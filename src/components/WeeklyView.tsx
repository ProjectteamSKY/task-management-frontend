import { isOnLeave, type ScheduleSlot, type Worker } from '../services/scheduleService';

const DATES = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'];
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
const HOUR_SLOTS = [9, 10, 11, 12, 13, 14, 15, 16]; // 8 hours: 09:00–17:00
const TOTAL_HOURS = HOUR_SLOTS.length;


function getHourUnits(slots: ScheduleSlot[], workerId: number, date: string): number[] {
  // Build sub-slot map: "HH:MM" -> true if allocated/blocked
  const subSlotMap = new Set<string>();

  for (const slot of slots) {
    if (slot.workerId !== workerId || slot.date !== date) continue;
    if (slot.status === 'leave') continue; // leave handled separately

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
    const first = subSlotMap.has(`${hh}:00`);
    const second = subSlotMap.has(`${hh}:30`);
    return (first ? 1 : 0) + (second ? 1 : 0);
  });
}

function getWorkedHours(slots: ScheduleSlot[], workerId: number, date: string): number {
  const units = getHourUnits(slots, workerId, date);
  const totalUnits = units.reduce((a, b) => a + b, 0);
  return totalUnits / 2; 
}


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
              /* Full green */
              <div
                className="w-full h-full"
                style={{ backgroundColor: 'var(--color-success, #22c55e)', opacity: 0.22 }}
              />
            ) : units === 2 ? (
              /* Full blue */
              <div
                className="w-full h-full"
                style={{ backgroundColor: 'var(--color-primary, #3b82f6)', opacity: 1 }}
              />
            ) : (
              /* Half blue (top), half green (bottom) */
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

interface WeeklyViewProps {
  slots: ScheduleSlot[];
  workers: Worker[];
}

export default function WeeklyView({ slots, workers }: WeeklyViewProps) {
  const maxWeekHours = DATES.length * TOTAL_HOURS;

  return (
    <div className="glass rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-foreground">Week of March 10 – 14, 2026</h2>
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

      <div className="overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left w-44 font-medium">
                Worker
              </th>
              {DATES.map((date, di) => (
                <th key={date} className="text-[10px] text-muted-foreground p-2 text-center font-medium min-w-[130px]">
                  <span className="block">{DAY_SHORT[di]}</span>
                  <span className="block text-foreground font-semibold">Mar {date.slice(8)}</span>
                </th>
              ))}
              <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-right font-medium">
                Total hrs
              </th>
            </tr>
          </thead>
          <tbody>
            {workers.map(worker => {
              const weekHourUnits = DATES.map(d => getHourUnits(slots, worker.id, d));
              const totalWorked = weekHourUnits
                .flat()
                .reduce((a, b) => a + b, 0) / 2;

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
                  {DATES.map((date, di) => (
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