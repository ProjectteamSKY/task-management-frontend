import { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { getWorkerWorkload, type ScheduleSlot, type Worker, type Task } from '../services/scheduleService';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DAY_SHORT  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const TOTAL_HOURS = 8;

// ── Week helpers ──────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

function formatWeekRange(dates: string[]): string {
  const start = new Date(dates[0] + 'T00:00:00');
  const end   = new Date(dates[4] + 'T00:00:00');
  const startM = start.toLocaleString('default', { month: 'short' });
  const endM   = end.toLocaleString('default', { month: 'short' });
  const startD = start.getDate();
  const endD   = end.getDate();
  const year   = end.getFullYear();
  if (startM === endM) return `${startM} ${startD} – ${endD}, ${year}`;
  return `${startM} ${startD} – ${endM} ${endD}, ${year}`;
}

function formatDayLabel(date: string, di: number): string {
  const d = new Date(date + 'T00:00:00');
  return `${DAY_SHORT[di]} ${d.getDate()} — ${d.toLocaleString('default', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;
}

// ── Hour-cell logic ───────────────────────────────────────────────────────────

interface HourCell {
  hour: string;
  status: string;
  taskId?: string;
  filledUnits: number;
  totalFilledUnits: number;
  span: number;
  fillPercent: number;
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildHourCells(daySlots: ScheduleSlot[]): HourCell[] {
  const subSlotMap: Record<string, { status: string; taskId?: string }> = {};

  for (const slot of daySlots) {
    const startMin = toMinutes(slot.startTime);
    const units = slot.durationUnits ?? 2;
    for (let u = 0; u < units; u++) {
      const min = startMin + u * 30;
      const hh = String(Math.floor(min / 60)).padStart(2, '0');
      const mm = String(min % 60).padStart(2, '0');
      subSlotMap[`${hh}:${mm}`] = { status: slot.status, taskId: slot.taskId };
    }
  }

  const rawCells = TIME_SLOTS.map(hour => {
    const [h] = hour.split(':').map(Number);
    const hh = String(h).padStart(2, '0');
    const s1 = subSlotMap[`${hh}:00`];
    const s2 = subSlotMap[`${hh}:30`];

    const priority = (s: string) =>
      s === 'allocated' ? 3 : s === 'leave' ? 2 : s === 'blocked' ? 1 : 0;

    const dominant = [s1, s2]
      .filter(Boolean)
      .sort((a, b) => priority(b!.status) - priority(a!.status))[0];

    const status = dominant?.status ?? 'available';
    const taskId = dominant?.taskId;

    let filledUnits = 0;
    if (s1 && s1.status !== 'available') filledUnits++;
    if (s2 && s2.status !== 'available') filledUnits++;

    return { hour, status, taskId, filledUnits, totalFilledUnits: filledUnits, span: 1, fillPercent: 0 };
  });

  const cells: HourCell[] = rawCells.map(c => ({ ...c }));
  const absorbed = new Set<number>();

  for (let i = 0; i < cells.length; i++) {
    if (absorbed.has(i)) continue;
    const cell = cells[i];
    if (cell.status === 'available' || cell.filledUnits === 0) continue;

    let span = 1;
    let totalFilledUnits = cell.filledUnits;

    for (let j = i + 1; j < cells.length; j++) {
      const next = cells[j];
      if (
        next.status === cell.status &&
        next.taskId === cell.taskId &&
        next.filledUnits > 0
      ) {
        span++;
        totalFilledUnits += next.filledUnits;
        absorbed.add(j);
        cells[j].span = 0;
      } else {
        break;
      }
    }

    cells[i].span = span;
    cells[i].totalFilledUnits = totalFilledUnits;
    cells[i].fillPercent = Math.round((totalFilledUnits / (span * 2)) * 100);
  }

  return cells.filter(c => c.span !== 0);
}

// ── Main component ────────────────────────────────────────────────────────────

interface DailyViewProps {
  slots: ScheduleSlot[];
  workers: Worker[];
  tasks: Task[];
}

export default function DailyView({ slots, workers, tasks }: DailyViewProps) {
  const [monday, setMonday] = useState<Date>(() => getMondayOf(new Date()));

  const dates      = getWeekDates(monday);
  const weekLabel  = formatWeekRange(dates);
  const today      = toISODate(new Date());
  const isThisWeek = dates.includes(today);

  function prevWeek() {
    setMonday(prev => { const d = new Date(prev); d.setDate(d.getDate() - 7); return d; });
  }
  function nextWeek() {
    setMonday(prev => { const d = new Date(prev); d.setDate(d.getDate() + 7); return d; });
  }
  function goToday() {
    setMonday(getMondayOf(new Date()));
  }

  return (
    <div className="space-y-4">
      {/* ── Week navigation header ── */}
      <div className="flex items-center justify-between gap-3 flex-wrap px-1">
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Previous week"
          >
            <ChevronLeft size={15} />
          </button>

          <span className="text-sm font-semibold text-foreground min-w-[180px] text-center">
            {weekLabel}
          </span>

          <button
            onClick={nextWeek}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Next week"
          >
            <ChevronRight size={15} />
          </button>

          {!isThisWeek && (
            <button
              onClick={goToday}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              title="Go to current week"
            >
              <CalendarDays size={11} />
              Today
            </button>
          )}
        </div>
      </div>

      {/* ── One card per day ── */}
      {dates.map((date, di) => {
        const isToday = date === today;
        const d = new Date(date + 'T00:00:00');
        const dayHeading = `${DAY_SHORT[di]} ${d.getDate()} — ${d.toLocaleString('default', { month: 'long' })} ${d.getDate()}, ${d.getFullYear()}`;

        return (
          <div
            key={date}
            className={`glass rounded-xl p-5 ${isToday ? 'ring-1 ring-primary/40' : ''}`}
          >
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              {isToday && (
                <span
                  className="inline-block w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: 'var(--color-primary,#3b82f6)' }}
                />
              )}
              <span className={isToday ? 'text-primary' : 'text-foreground'}>
                {dayHeading}
              </span>
              {isToday && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                  Today
                </span>
              )}
            </h3>

            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left w-40 font-medium">
                      Worker
                    </th>
                    {TIME_SLOTS.map(s => (
                      <th key={s} className="text-[10px] text-muted-foreground p-2 text-center font-normal min-w-[60px]">
                        {s}
                      </th>
                    ))}
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-right font-medium">
                      Load
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {workers.map(worker => {
                    const daySlots = slots.filter(
                      s => String(s.workerId) === String(worker.id) && s.date === date
                    );
                    const wl    = getWorkerWorkload(slots, worker.id, date, TOTAL_HOURS);
                    const cells = buildHourCells(daySlots);

                    return (
                      <tr key={worker.id} className="border-t border-border/30">
                        {/* Worker info */}
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-medium text-secondary-foreground shrink-0">
                              {worker.avatar}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground">{worker.name.split(' ')[0]}</p>
                              <p className="text-[10px] text-muted-foreground">{worker.role}</p>
                            </div>
                          </div>
                        </td>

                        {/* Hour cells */}
                        {cells.map(({ hour, status, taskId, fillPercent, span }) => {
                          const task = taskId ? tasks.find(t => t.id === taskId) : null;

                          const label = (() => {
                            if (status === 'allocated' && task) {
                              const maxChars = 10 * span;
                              return task.title.length > maxChars
                                ? task.title.slice(0, maxChars) + '..'
                                : task.title;
                            }
                            if (status === 'leave') return 'On Leave';
                            return '';
                          })();

                          const filledClass =
                            status === 'allocated' ? 'slot-allocated'
                            : status === 'leave'    ? 'slot-leave'
                            : status === 'blocked'  ? 'slot-blocked'
                            : 'slot-available';

                          return (
                            <td key={hour} colSpan={span} className="p-1">
                              {fillPercent === 100 || fillPercent === 0 ? (
                                <div
                                  className={`h-9 rounded-md flex items-center justify-center text-[9px] font-medium transition-colors ${filledClass}`}
                                  title={task ? task.title : status}
                                >
                                  {fillPercent > 0 && label ? label : ''}
                                </div>
                              ) : (
                                <div
                                  className={`h-9 rounded-md overflow-hidden flex border ${
                                    status === 'allocated' ? 'border-primary/40'
                                    : status === 'leave'   ? 'border-warning/30'
                                    : status === 'blocked' ? 'border-destructive/30'
                                    : 'border-success/30'
                                  }`}
                                  title={task ? task.title : status}
                                >
                                  <div
                                    className={`h-full flex items-center justify-center text-[9px] font-medium ${
                                      status === 'allocated' ? 'bg-primary/20 text-primary'
                                      : status === 'leave'   ? 'bg-warning/15 text-warning'
                                      : status === 'blocked' ? 'bg-destructive/15 text-destructive'
                                      : 'bg-success/15 text-success'
                                    }`}
                                    style={{ width: `${fillPercent}%` }}
                                  >
                                    {label ? <span className="px-1 truncate">{label}</span> : null}
                                  </div>
                                  <div
                                    className="h-full bg-success/15"
                                    style={{ width: `${100 - fillPercent}%` }}
                                  />
                                </div>
                              )}
                            </td>
                          );
                        })}

                        {/* Workload % */}
                        <td className="p-2 text-right">
                          <span
                            className={`text-xs font-semibold ${
                              wl > 80 ? 'text-destructive' : wl > 50 ? 'text-warning' : 'text-success'
                            }`}
                          >
                            {wl}%
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
}