import { useState, useEffect } from 'react';
import { fetchScheduleData, type ScheduleSlot, type Task as ScheduleTask } from '@/services/scheduleService';
import { taskService } from '@/services/taskService';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

const STATUS_STYLES: Record<string, string> = {
  done:        'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  review:      'bg-primary/15 text-primary',
  todo:        'bg-secondary text-muted-foreground',
  backlog:     'bg-secondary text-muted-foreground',
};

const SCHEDULE_LEGEND = [
  ['slot-allocated', 'Allocated'],
  ['slot-available', 'Available'],
  ['slot-leave',     'Leave'    ],
  ['slot-blocked',   'Blocked'  ],
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalisedTask {
  id:             string;
  title:          string;
  status:         string;
  priority:       string;
  estimatedHours: number;
}

interface WorkerOverviewProps {
  worker:       any;
  perf?:        any;
  workerTasks:  NormalisedTask[];
  workload:     number;
  scheduleKey?: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekDates(monday: Date): string[] {
  return Array.from({ length: 5 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d.toISOString().slice(0, 10);
  });
}

function formatWeekLabel(monday: Date): string {
  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  return `${fmt(monday)} – ${fmt(friday)}`;
}

/**
 * For a given hour column (e.g. "09:00"), returns how many 30-min sub-slots
 * within that hour are occupied: 0 = free, 1 = half (30 min), 2 = full (60 min).
 */
function getSlotUnits(slots: ScheduleSlot[], workerId: string, date: string, time: string): number {
  const subSlotMap = new Set<string>();

  for (const slot of slots) {
    if (String(slot.workerId) !== String(workerId) || slot.date !== date) continue;
    if (slot.status === 'leave' || slot.status === 'blocked') continue;

    const [h, m] = slot.startTime.replace(':00:00', '').split(':').map(Number);
    const startMin = h * 60 + (m || 0);
    const units    = slot.durationUnits ?? 2;

    for (let u = 0; u < units; u++) {
      const min = startMin + u * 30;
      const hh  = String(Math.floor(min / 60)).padStart(2, '0');
      const mm  = String(min % 60).padStart(2, '0');
      subSlotMap.add(`${hh}:${mm}`);
    }
  }

  const [colH] = time.split(':').map(Number);
  const hh     = String(colH).padStart(2, '0');
  const first  = subSlotMap.has(`${hh}:00`);
  const second = subSlotMap.has(`${hh}:30`);
  return (first ? 1 : 0) + (second ? 1 : 0);
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkerOverview({ worker, perf, workerTasks, workload, scheduleKey }: WorkerOverviewProps) {
  const [slots,        setSlots]        = useState<ScheduleSlot[]>([]);
  const [taskMap,      setTaskMap]      = useState<Record<string, ScheduleTask>>({});
  const [allDates,     setAllDates]     = useState<string[]>([]);
  const [schedLoading, setSchedLoading] = useState(true);

  const [weekOffset, setWeekOffset] = useState(0);

  const currentMonday = getMondayOf(new Date());
  currentMonday.setDate(currentMonday.getDate() + weekOffset * 7);
  const displayDates  = weekDates(currentMonday);
  const weekLabel     = formatWeekLabel(currentMonday);
  const isCurrentWeek = weekOffset === 0;
  const today         = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    if (!worker?.id) return;
    setSchedLoading(true);

    Promise.all([
      fetchScheduleData(),
      taskService.getTasks(),
    ])
      .then(([schedData, rawTasks]) => {
        const workerSlots = schedData.slots.filter((s: ScheduleSlot) => s.workerId === worker.id);
        setSlots(workerSlots);

        const map: Record<string, ScheduleTask> = {};
        rawTasks.forEach((t: any) => { map[String(t.id)] = { id: String(t.id), title: t.title }; });
        schedData.tasks.forEach((t: ScheduleTask) => { map[t.id] = t; });
        setTaskMap(map);

        const uniqueDates = [...new Set(workerSlots.map((s: ScheduleSlot) => s.date))].sort() as string[];
        setAllDates(uniqueDates);
      })
      .catch(err => console.error('Failed to load schedule:', err))
      .finally(() => setSchedLoading(false));
  }, [worker?.id, scheduleKey]);

  const hasDataForWeek = displayDates.some(d => allDates.includes(d));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {perf && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['Tasks Completed', perf.tasksCompleted,                     'text-foreground'],
                ['Avg Completion',  `${perf.avgCompletionTime}h`,            'text-foreground'],
                ['On-Time Rate',    `${Math.round(perf.onTimeRate * 100)}%`, 'text-success'   ],
                ['Quality Score',   `${perf.qualityScore}/5`,                'text-foreground'],
              ] as [string, string | number, string][]).map(([label, value, color]) => (
                <div key={label} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Assigned Tasks ({workerTasks.length})
          </h3>
          {workerTasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">No tasks assigned yet.</p>
          ) : (
            <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
              {workerTasks.map(t => (
                <div key={t.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground truncate">{t.title}</p>
                    <p className="text-xs text-muted-foreground">{t.estimatedHours}h · {t.priority}</p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? ''}`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="glass rounded-xl p-5">

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-foreground">Weekly Schedule</h3>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setWeekOffset(o => o - 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Previous week"
            >
              ‹
            </button>

            <span className="text-xs text-muted-foreground min-w-[130px] text-center">
              {weekLabel}
            </span>

            <button
              onClick={() => setWeekOffset(o => o + 1)}
              className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Next week"
            >
              ›
            </button>

            {!isCurrentWeek && (
              <button
                onClick={() => setWeekOffset(0)}
                className="text-[10px] px-2 py-1 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
              >
                Today
              </button>
            )}
          </div>
        </div>

        {schedLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left">
                      Date
                    </th>
                    {TIME_SLOTS.map(s => (
                      <th key={s} className="text-[10px] text-muted-foreground p-2 text-center font-normal">
                        {s}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displayDates.map(date => {
                    const isLeave = slots.some(
                      s => String(s.workerId) === String(worker.id) &&
                           s.date === date && s.status === 'leave',
                    );
                    const isBlocked = !isLeave && slots.some(
                      s => String(s.workerId) === String(worker.id) &&
                           s.date === date && s.status === 'blocked',
                    );

                    return (
                      <tr key={date}>
                        <td className="text-xs text-foreground p-2 font-medium whitespace-nowrap">
                          <span className={date === today ? 'text-primary font-bold' : ''}>
                            {date.slice(5)}
                          </span>
                        </td>
                        {TIME_SLOTS.map(time => {
                          const units = getSlotUnits(slots, worker.id, date, time);

                          return (
                            <td key={time} className="p-1">
                              <div className="h-8 rounded-md overflow-hidden">
                                {isLeave ? (
                                  <div className="w-full h-full slot-leave flex items-center justify-center text-[9px] font-medium">L</div>
                                ) : isBlocked ? (
                                  <div className="w-full h-full slot-blocked flex items-center justify-center text-[9px] font-medium">░</div>
                                ) : units === 2 ? (
                                  // Full hour allocated
                                  <div className="w-full h-full slot-allocated flex items-center justify-center text-[9px] font-medium">█</div>
                               ) : units === 1 ? (
  // Half hour allocated — left half filled, right half free
  <div className="w-full h-full flex flex-row">
    <div className="h-full flex-1 slot-allocated" />
    <div className="h-full flex-1 slot-available" />
  </div>

                                ) : (
                                  // Free
                                  <div className="w-full h-full slot-available flex items-center justify-center text-[9px] font-medium">░</div>
                                )}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {!hasDataForWeek && (
              <p className="text-xs text-muted-foreground text-center py-3">
                No schedule data for this week.
              </p>
            )}

            <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
              {SCHEDULE_LEGEND.map(([cls, label]) => (
                <span key={label} className="flex items-center gap-1.5">
                  <span className={`w-3 h-3 rounded ${cls}`} /> {label}
                </span>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}