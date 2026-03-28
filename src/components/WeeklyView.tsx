import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { isOnLeave, type ScheduleSlot, type Worker } from '../services/scheduleService';
import { Calendar } from '@/components/ui/calendar';

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOUR_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16]; // 8 hours: 09:00–17:00
const TOTAL_HOURS = HOUR_SLOTS.length;

// ── Week helpers ──────────────────────────────────────────────────────────────

/** Returns the Monday of the week containing `date` */
function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sun
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns ISO date string "YYYY-MM-DD" for a Date */
function toISODate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** Returns the 5 Mon–Fri date strings for the week starting at `monday` */
function getWeekDates(monday: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });
}

/** Returns the Friday of the week starting at `monday` */
function getFridayOf(monday: Date): Date {
  const d = new Date(monday);
  d.setDate(d.getDate() + 4);
  return d;
}

/** Format "Mar 10 – 14, 2026" or "Mar 31 – Apr 4, 2026" */
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

// ── Hour-block logic ──────────────────────────────────────────────────────────

function getHourUnits(slots: ScheduleSlot[], workerId: string | number, date: string): number[] {
  const subSlotMap = new Set<string>();

  for (const slot of slots) {
    if (String(slot.workerId) !== String(workerId) || slot.date !== date) continue;
    if (slot.status === 'leave') continue;

    const [h, m] = slot.startTime.replace(':00:00', '').split(':').map(Number);
    const startMin = h * 60 + (m || 0);
    const units = slot.durationUnits ?? 2;

    for (let u = 0; u < units; u++) {
      const min = startMin + u * 30;
      const hh = String(Math.floor(min / 60)).padStart(2, '0');
      const mm = String(min % 60).padStart(2, '0');
      subSlotMap.add(`${hh}:${mm}`);
    }
  }

  return HOUR_SLOTS.map(h => {
    const hh = String(h).padStart(2, '0');
    const first  = subSlotMap.has(`${hh}:00`);
    const second = subSlotMap.has(`${hh}:30`);
    return (first ? 1 : 0) + (second ? 1 : 0);
  });
}

// ── Week Picker Popover ───────────────────────────────────────────────────────

interface WeekPickerProps {
  selectedMonday: Date;
  onSelect: (monday: Date) => void;
  onClose: () => void;
}

function WeekPicker({ selectedMonday, onSelect, onClose }: WeekPickerProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  // Pass Mon–Fri range to Calendar so the whole week is highlighted
  const selectedRange = {
    from: selectedMonday,
    to:   getFridayOf(selectedMonday),
  };

  function handleDayClick(date: Date | undefined) {
    if (!date) return;
    onSelect(getMondayOf(date));
    onClose();
  }

  return (
    <div
      ref={ref}
      className="absolute z-50 top-full mt-2 left-1/2 -translate-x-1/2 rounded-xl shadow-xl border border-border bg-background"
      style={{ boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}
    >
      <Calendar
        mode="range"
        selected={selectedRange}
        onDayClick={handleDayClick}
        weekStartsOn={1}
        today={new Date()}
        footer={
          <div className="pt-2 pb-1 border-t border-border/40 flex justify-center">
            <button
              onClick={() => { onSelect(getMondayOf(new Date())); onClose(); }}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors px-3 py-1 rounded-md hover:bg-secondary"
            >
              Go to today
            </button>
          </div>
        }
      />
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function HourBlocks({ hourUnits, leave }: { hourUnits: number[]; leave: boolean }) {
  if (leave) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="flex gap-[3px]">
          {Array.from({ length: TOTAL_HOURS }).map((_, i) => (
            <div
              key={i}
              className="w-4 h-4 rounded-sm"
              style={{ backgroundColor: 'var(--color-warning, #f59e0b)', opacity: 0.5 }}
              title="On Leave"
            />
          ))}
        </div>
        <span className="text-[9px] font-medium" style={{ color: 'var(--color-warning, #f59e0b)' }}>
          On Leave
        </span>
      </div>
    );
  }

  const workedHours = hourUnits.reduce((a, b) => a + b, 0) / 2;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-[3px]">
        {hourUnits.map((units, i) => (
          <div
            key={i}
            className="w-4 h-4 rounded-sm overflow-hidden"
            title={
              units === 2
                ? `Hour ${i + 1}: fully allocated`
                : units === 1
                ? `Hour ${i + 1}: 30 min allocated`
                : `Hour ${i + 1}: free`
            }
          >
            {units === 0 ? (
              <div
                className="w-full h-full"
                style={{ backgroundColor: 'var(--color-success, #22c55e)', opacity: 0.22 }}
              />
            ) : units === 2 ? (
              <div
                className="w-full h-full"
                style={{ backgroundColor: 'var(--color-primary, #3b82f6)', opacity: 1 }}
              />
            ) : (
              <div className="w-full h-full flex flex-col">
                <div
                  className="w-full flex-1"
                  style={{ backgroundColor: 'var(--color-primary, #3b82f6)', opacity: 1 }}
                />
                <div
                  className="w-full flex-1"
                  style={{ backgroundColor: 'var(--color-success, #22c55e)', opacity: 0.22 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>
      <span
        className="text-[9px] font-semibold"
        style={{
          color:
            workedHours === TOTAL_HOURS
              ? 'var(--color-primary, #3b82f6)'
              : 'var(--color-success, #22c55e)',
        }}
      >
        {workedHours}h / {TOTAL_HOURS}h
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface WeeklyViewProps {
  slots: ScheduleSlot[];
  workers: Worker[];
}

export default function WeeklyView({ slots, workers }: WeeklyViewProps) {
  const [monday, setMonday]   = useState<Date>(() => getMondayOf(new Date()));
  const [calOpen, setCalOpen] = useState(false);

  const dates        = getWeekDates(monday);
  const weekLabel    = formatWeekRange(dates);
  const maxWeekHours = dates.length * TOTAL_HOURS;

  const today      = toISODate(new Date());
  const isThisWeek = dates.includes(today);

  function prevWeek() {
    setMonday(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  }

  function nextWeek() {
    setMonday(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  }

  function goToday() {
    setMonday(getMondayOf(new Date()));
  }

  return (
    <div className="glass rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
        {/* Week navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={prevWeek}
            className="w-7 h-7 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            title="Previous week"
          >
            <ChevronLeft size={15} />
          </button>

          {/* Clickable week label → opens Calendar popover */}
          <div className="relative">
            <button
              onClick={() => setCalOpen(o => !o)}
              className="flex items-center gap-1.5 px-2 py-1 rounded-md text-sm font-semibold text-foreground hover:bg-secondary transition-colors min-w-[180px] justify-center"
              title="Pick a week"
            >
              <CalendarDays size={13} className="text-muted-foreground" />
              {weekLabel}
            </button>

            {calOpen && (
              <WeekPicker
                selectedMonday={monday}
                onSelect={setMonday}
                onClose={() => setCalOpen(false)}
              />
            )}
          </div>

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

        {/* Legend */}
        <div className="flex items-center gap-4 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-primary,#3b82f6)' }} />
            Worked
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-success,#22c55e)', opacity: 0.3 }} />
            Free
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm inline-block" style={{ backgroundColor: 'var(--color-warning,#f59e0b)', opacity: 0.5 }} />
            Leave
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left w-44 font-medium">
                Worker
              </th>
              {dates.map((date, di) => {
                const isToday = date === today;
                return (
                  <th
                    key={date}
                    className="text-[10px] text-muted-foreground p-2 text-center font-medium min-w-[130px]"
                  >
                    <span className="block">{DAY_SHORT[di]}</span>
                    <span
                      className={`block font-semibold ${isToday ? 'text-primary' : 'text-foreground'}`}
                    >
                      {isToday && (
                        <span
                          className="inline-block w-1.5 h-1.5 rounded-full mr-1 align-middle"
                          style={{ backgroundColor: 'var(--color-primary,#3b82f6)' }}
                        />
                      )}
                      {new Date(date + 'T00:00:00').toLocaleString('default', {
                        month: 'short',
                        day:   'numeric',
                      })}
                    </span>
                  </th>
                );
              })}
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-right font-medium">
                Total hrs
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => {
              const weekHourUnits = dates.map(d => getHourUnits(slots, worker.id, d));
              const totalWorked   = weekHourUnits.flat().reduce((a, b) => a + b, 0) / 2;

              return (
                <tr key={worker.id} className="border-t border-border/30">
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-[11px] font-medium text-secondary-foreground shrink-0">
                        {worker.avatar}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-foreground">{worker.name}</p>
                        <p className="text-[10px] text-muted-foreground">{worker.role}</p>
                      </div>
                    </div>
                  </td>
                  {dates.map((date, di) => (
                    <td key={date} className="p-3 align-middle text-center">
                      <HourBlocks
                        hourUnits={weekHourUnits[di]}
                        leave={isOnLeave(slots, worker.id, date)}
                      />
                    </td>
                  ))}
                  <td className="p-2 text-right align-middle">
                    <span
                      className="text-xs font-bold"
                      style={{
                        color:
                          totalWorked >= maxWeekHours
                            ? 'var(--color-primary,#3b82f6)'
                            : totalWorked >= maxWeekHours * 0.6
                            ? 'var(--color-success,#22c55e)'
                            : 'var(--color-muted-foreground,#888)',
                      }}
                    >
                      {totalWorked}h
                    </span>
                    <span className="text-[10px] text-muted-foreground"> / {maxWeekHours}h</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}