import { useState, useMemo } from 'react';
import { tasks, scheduleSlots } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface DailyViewProps {
  workerId: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAY_START    = 9;    // 09:00
const DAY_END      = 17;   // 17:00
const SLOT_MIN     = 30;   // 30-min grid resolution
const SLOT_PX      = 40;   // px per 30-min slot
const TOTAL_SLOTS  = (DAY_END - DAY_START) * 2;   // 16 slots (9:00–17:00)

// All 30-min labels from 09:00 to 17:00
const TIME_LABELS = Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => {
  const totalMins = DAY_START * 60 + i * SLOT_MIN;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
});

const SLOT_STYLES: Record<string, { bg: string; border: string; text: string; dot: string; label: string }> = {
  allocated: { bg: 'bg-primary/15',     border: 'border-primary/50',     text: 'text-primary',     dot: 'bg-primary',     label: 'Allocated' },
  leave:     { bg: 'bg-warning/15',     border: 'border-warning/50',     text: 'text-warning',     dot: 'bg-warning',     label: 'Leave'     },
  blocked:   { bg: 'bg-destructive/15', border: 'border-destructive/50', text: 'text-destructive', dot: 'bg-destructive', label: 'Blocked'   },
  available: { bg: '',                  border: '',                       text: 'text-muted-foreground/30', dot: 'bg-success', label: 'Available' },
};

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/20 text-destructive',
  high:     'bg-orange-500/20 text-orange-400',
  medium:   'bg-warning/20 text-warning',
  low:      'bg-secondary text-muted-foreground',
};

const STATUS_STYLES: Record<string, string> = {
  done:        'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  review:      'bg-primary/15 text-primary',
  todo:        'bg-secondary text-muted-foreground',
  backlog:     'bg-secondary text-muted-foreground',
};

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISO(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekDates(anchor: Date): Date[] {
  const day = anchor.getDay();
  const mon = new Date(anchor);
  mon.setDate(anchor.getDate() - ((day + 6) % 7));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(mon);
    d.setDate(mon.getDate() + i);
    return d;
  });
}

/** Convert "HH:MM" → minutes since midnight */
function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Minutes since DAY_START → pixel offset */
function minsToTop(mins: number): number {
  return ((mins - DAY_START * 60) / SLOT_MIN) * SLOT_PX;
}

/** Duration in minutes → pixel height */
function minsToHeight(mins: number): number {
  return (mins / SLOT_MIN) * SLOT_PX;
}

// ─── Legend ───────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex flex-wrap gap-4 text-[10px] text-muted-foreground">
      {(['allocated', 'leave', 'blocked', 'available'] as const).map(key => (
        <span key={key} className="flex items-center gap-1.5">
          <span className={`w-2 h-2 rounded-sm ${SLOT_STYLES[key].dot}`} />
          {SLOT_STYLES[key].label}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function DailyView({ workerId }: DailyViewProps) {
  const today     = useMemo(() => new Date(), []);
  const [selected, setSelected] = useState<Date>(today);

  const weekDates   = useMemo(() => getWeekDates(selected), [selected]);
  const selectedISO = toISO(selected);

  // All slots for this worker on the selected day
  const daySlots = useMemo(
    () => scheduleSlots.filter(s => s.workerId === workerId && s.date === selectedISO),
    [workerId, selectedISO],
  );

  // Build positioned task blocks from slots
  const taskBlocks = useMemo(() => {
    return daySlots
      .filter(s => s.status !== 'available')
      .map(slot => {
        const startMins = toMins(slot.startTime);
        const endMins   = toMins(slot.endTime);
        const duration  = endMins - startMins;
        const task      = slot.taskId ? tasks.find(t => t.id === slot.taskId) : null;
        const style     = SLOT_STYLES[slot.status] ?? SLOT_STYLES.available;
        return {
          slot,
          task,
          style,
          top:    minsToTop(startMins),
          height: minsToHeight(duration),
          durationMins: duration,
        };
      });
  }, [daySlots]);

  // Summary for the day
  const summary = useMemo(() => {
    const allocatedMins = daySlots
      .filter(s => s.status === 'allocated')
      .reduce((sum, s) => sum + (toMins(s.endTime) - toMins(s.startTime)), 0);
    const leaveMins = daySlots
      .filter(s => s.status === 'leave')
      .reduce((sum, s) => sum + (toMins(s.endTime) - toMins(s.startTime)), 0);
    const blockedMins = daySlots
      .filter(s => s.status === 'blocked')
      .reduce((sum, s) => sum + (toMins(s.endTime) - toMins(s.startTime)), 0);
    const totalWorkMins   = (DAY_END - DAY_START) * 60;
    const occupiedMins    = allocatedMins + leaveMins + blockedMins;
    const freeMins        = Math.max(0, totalWorkMins - occupiedMins);
    return {
      allocatedH: (allocatedMins / 60).toFixed(1),
      leaveH:     (leaveMins    / 60).toFixed(1),
      blockedH:   (blockedMins  / 60).toFixed(1),
      freeH:      (freeMins     / 60).toFixed(1),
      taskCount:  daySlots.filter(s => s.status === 'allocated').length,
    };
  }, [daySlots]);

  const isToday = (d: Date) => toISO(d) === toISO(today);
  const isSel   = (d: Date) => toISO(d) === selectedISO;

  // Current time indicator position
  const nowIndicator = useMemo(() => {
    if (!isToday(selected)) return null;
    const now     = new Date();
    const nowMins = now.getHours() * 60 + now.getMinutes();
    if (nowMins < DAY_START * 60 || nowMins > DAY_END * 60) return null;
    return minsToTop(nowMins);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  return (
    <div className="space-y-4">

      {/* ── Week strip ─────────────────────────────────────────────────────── */}
      <div className="glass rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={() => { const d = new Date(selected); d.setDate(d.getDate() - 7); setSelected(d); }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs font-medium text-foreground">
            {weekDates[0]?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            {' – '}
            {weekDates[6]?.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </span>
          <button
            onClick={() => { const d = new Date(selected); d.setDate(d.getDate() + 7); setSelected(d); }}
            className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover:bg-secondary transition-colors"
          >
            Next →
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5">
          {weekDates.map((date, i) => {
            const iso      = toISO(date);
            const hasTasks = scheduleSlots.some(
              s => s.workerId === workerId && s.date === iso && s.status === 'allocated',
            );
            return (
              <button
                key={iso}
                onClick={() => setSelected(date)}
                className={`flex flex-col items-center gap-1 py-2.5 px-1 rounded-xl transition-all ${
                  isSel(date)
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : isToday(date)
                    ? 'bg-primary/10 text-primary hover:bg-primary/20'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                }`}
              >
                <span className="text-[10px] uppercase tracking-wider">{DAY_LABELS[i]}</span>
                <span className="text-sm font-semibold leading-none">{date.getDate()}</span>
                <span className={`w-1 h-1 rounded-full transition-colors ${
                  hasTasks
                    ? isSel(date) ? 'bg-primary-foreground/60' : 'bg-primary'
                    : 'opacity-0'
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Day summary pills ──────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-foreground">
          {selected.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </span>
        <div className="flex gap-2 ml-auto flex-wrap">
          {Number(summary.allocatedH) > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/15 text-primary font-medium">
              {summary.taskCount} task{summary.taskCount !== 1 ? 's' : ''} · {summary.allocatedH}h allocated
            </span>
          )}
          {Number(summary.leaveH) > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
              {summary.leaveH}h leave
            </span>
          )}
          {Number(summary.blockedH) > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
              {summary.blockedH}h blocked
            </span>
          )}
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-medium">
            {summary.freeH}h free
          </span>
        </div>
      </div>

      {/* ── Timeline ───────────────────────────────────────────────────────── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-foreground">Daily Schedule</h3>
          <Legend />
        </div>

        <div className="flex gap-0">

          {/* ── Time axis ── */}
          <div className="shrink-0 w-14 select-none relative" style={{ height: TOTAL_SLOTS * SLOT_PX }}>
            {TIME_LABELS.map((label, i) => (
              // Only show whole-hour labels (every 2 slots)
              i % 2 === 0 && (
                <div
                  key={label}
                  className="absolute right-3 text-[10px] text-muted-foreground -translate-y-2"
                  style={{ top: i * SLOT_PX }}
                >
                  {label}
                </div>
              )
            ))}
          </div>

          {/* ── Timeline column ── */}
          <div
            className="relative flex-1 border-l border-border/40"
            style={{ height: TOTAL_SLOTS * SLOT_PX }}
          >
            {/* Grid lines — solid on each hour, dashed on each half-hour */}
            {TIME_LABELS.map((label, i) => (
              <div
                key={label}
                className={`absolute left-0 right-0 ${
                  i % 2 === 0
                    ? 'border-t border-border/40'
                    : 'border-t border-border/20 border-dashed'
                }`}
                style={{ top: i * SLOT_PX }}
              />
            ))}
            {/* Bottom line */}
            <div
              className="absolute left-0 right-0 border-t border-border/40"
              style={{ top: TOTAL_SLOTS * SLOT_PX }}
            />

            {/* ── Empty state ── */}
            {taskBlocks.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                  <span className="text-muted-foreground text-sm">✓</span>
                </div>
                <p className="text-xs text-muted-foreground">No tasks scheduled for this day</p>
              </div>
            )}

            {/* ── Task / slot blocks ── */}
            {taskBlocks.map(({ slot, task, style, top, height, durationMins }) => {
              const isLeaveOrBlocked = slot.status === 'leave' || slot.status === 'blocked';
              const isCompact        = height < SLOT_PX * 2; // < 1 hour → compact mode

              return (
                <div
                  key={slot.id}
                  className={`absolute left-2 right-2 rounded-lg border overflow-hidden ${style.bg} ${style.border}`}
                  style={{ top: top + 2, height: height - 4 }}
                >
                  {isLeaveOrBlocked ? (
                    /* Leave / Blocked — simple banner */
                    <div className="flex items-center gap-2 px-3 h-full">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      <span className={`text-xs font-medium ${style.text}`}>{style.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {slot.startTime} – {slot.endTime}
                      </span>
                    </div>
                  ) : isCompact ? (
                    /* Compact allocated block (< 1 h) */
                    <div className="flex items-center gap-2 px-3 h-full">
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                      <span className="text-xs font-semibold text-foreground truncate flex-1">
                        {task?.title ?? 'Task'}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {slot.startTime}–{slot.endTime}
                      </span>
                    </div>
                  ) : (
                    /* Full allocated block */
                    <div className="px-3 py-2 h-full flex flex-col gap-1 overflow-hidden">
                      {/* Time range */}
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
                        <span className="text-[10px] text-muted-foreground">
                          {slot.startTime} – {slot.endTime}
                        </span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          {(durationMins / 60).toFixed(1)}h
                        </span>
                      </div>

                      {/* Task title */}
                      <p className={`text-sm font-semibold text-foreground leading-tight ${height < SLOT_PX * 3 ? 'truncate' : ''}`}>
                        {task?.title ?? 'Allocated'}
                      </p>

                      {/* Description — only when tall enough */}
                      {task?.description && height >= SLOT_PX * 4 && (
                        <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                          {task.description}
                        </p>
                      )}

                      {/* Badges */}
                      {task && height >= SLOT_PX * 2.5 && (
                        <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full ${STATUS_STYLES[task.status] ?? ''}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {/* ── Current time indicator ── */}
            {nowIndicator !== null && (
              <div
                className="absolute left-0 right-0 flex items-center pointer-events-none z-10"
                style={{ top: nowIndicator }}
              >
                <div className="w-2.5 h-2.5 rounded-full bg-destructive -ml-1.5 shrink-0 shadow-sm" />
                <div className="flex-1 h-px bg-destructive" />
                <span className="text-[9px] text-destructive ml-1 shrink-0">
                  {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

    </div>
  );
}