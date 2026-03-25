import { getWorkerWorkload, type ScheduleSlot, type Worker, type Task } from '../services/scheduleService';

const TIME_SLOTS = ['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'];
const DATES = ['2026-03-10', '2026-03-11', '2026-03-12', '2026-03-13', '2026-03-14'];
const DAY_LABELS = ['Mon 10', 'Tue 11', 'Wed 12', 'Thu 13', 'Fri 14'];
const TOTAL_HOURS = 8;

/**
 * Each TIME_SLOT represents a 1-hour capsule.
 * Within that hour there are 2 possible 30-min units:
 *   unit 0 → HH:00
 *   unit 1 → HH:30
 *
 * durationUnits in DB: 1 unit = 30 min, 2 units = 1 hr, etc.
 *
 * Spanning logic:
 *   - Consecutive filled capsules (same taskId & status) are ALL merged via colSpan
 *   - Including the partial last cell (e.g. half-filled hour)
 *   - fillPercent = totalFilledUnits / (span × 2) × 100
 *   - Rendered as a single CSS linear-gradient capsule
 *
 * Examples:
 *   09:00–12:00 (6 units) → span=3, fillPercent=100%
 *   09:00–10:30 (3 units) → span=2, fillPercent=75%
 *   09:00–09:30 (1 unit)  → span=1, fillPercent=50%
 */

interface HourCell {
  hour: string;           // e.g. "09:00"
  status: string;         // dominant status for this hour
  taskId?: string;
  filledUnits: number;    // 0, 1, or 2 within this single hour
  totalFilledUnits: number; // sum across the whole span (set after merging)
  span: number;           // colSpan
  fillPercent: number;    // 0–100, computed after merging
}

function toMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function buildHourCells(daySlots: ScheduleSlot[]): HourCell[] {
  // Expand every DB slot into 30-min sub-slot keys
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

  // Build one raw HourCell per TIME_SLOT
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

  // Merge consecutive cells with same taskId & status (including partial last cell)
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
      // Merge if same task+status AND next cell has ANY filled units (including partial)
      if (
        next.status === cell.status &&
        next.taskId === cell.taskId &&
        next.filledUnits > 0
      ) {
        span++;
        totalFilledUnits += next.filledUnits;
        absorbed.add(j);
        cells[j].span = 0; // mark absorbed
      } else {
        break;
      }
    }

    cells[i].span = span;
    cells[i].totalFilledUnits = totalFilledUnits;
    // fillPercent: filled units out of total possible (span × 2 half-slots)
    cells[i].fillPercent = Math.round((totalFilledUnits / (span * 2)) * 100);
  }

  // For available cells, fillPercent stays 0
  return cells.filter(c => c.span !== 0);
}

interface DailyViewProps {
  slots: ScheduleSlot[];
  workers: Worker[];
  tasks: Task[];
}

export default function DailyView({ slots, workers, tasks }: DailyViewProps) {
  return (
    <div className="space-y-4">
      {DATES.map((date, di) => (
        <div key={date} className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            {DAY_LABELS[di]} — March {date.slice(8)}, 2026
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
                  const daySlots = slots.filter(s => s.workerId === worker.id && s.date === date);
                  const wl = getWorkerWorkload(slots, worker.id, date, TOTAL_HOURS);
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

                        // Label shown inside the capsule
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
                          status === 'allocated'
                            ? 'slot-allocated'
                            : status === 'leave'
                            ? 'slot-leave'
                            : status === 'blocked'
                            ? 'slot-blocked'
                            : 'slot-available';

                        return (
                          <td key={hour} colSpan={span} className="p-1">
                            {fillPercent === 100 || fillPercent === 0 ? (
                              /* ── Fully filled or fully available ── */
                              <div
                                className={`h-9 rounded-md flex items-center justify-center text-[9px] font-medium transition-colors ${filledClass}`}
                                title={task ? task.title : status}
                              >
                                {fillPercent > 0 && label ? label : ''}
                              </div>
                            ) : (
                              /* ── Partial fill — outer div has border/radius, inner divs have bg only ── */
                              <div
                                className={`h-9 rounded-md overflow-hidden flex border ${
                                  status === 'allocated' ? 'border-primary/40'
                                  : status === 'leave' ? 'border-warning/30'
                                  : status === 'blocked' ? 'border-destructive/30'
                                  : 'border-success/30'
                                }`}
                                title={task ? task.title : status}
                              >
                                {/* Filled portion — bg only, no border */}
                                <div
                                  className={`h-full flex items-center justify-center text-[9px] font-medium ${
                                    status === 'allocated' ? 'bg-primary/20 text-primary'
                                    : status === 'leave' ? 'bg-warning/15 text-warning'
                                    : status === 'blocked' ? 'bg-destructive/15 text-destructive'
                                    : 'bg-success/15 text-success'
                                  }`}
                                  style={{ width: `${fillPercent}%` }}
                                >
                                  {label ? <span className="px-1 truncate">{label}</span> : null}
                                </div>
                                {/* Available portion — bg only, no border */}
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
      ))}
    </div>
  );
}