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

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkerOverview({ worker, perf, workerTasks, workload, scheduleKey }: WorkerOverviewProps) {
  const [slots,        setSlots]        = useState<ScheduleSlot[]>([]);
  const [taskMap,      setTaskMap]      = useState<Record<string, ScheduleTask>>({});
  const [dates,        setDates]        = useState<string[]>([]);
  const [schedLoading, setSchedLoading] = useState(true);

  // ── Fetch schedule — re-runs when worker changes OR an assignment is added/removed
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
        if (uniqueDates.length > 0) {
          setDates(uniqueDates.slice(-5));
        } else {
          const today  = new Date();
          const monday = new Date(today);
          monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
          setDates(
            Array.from({ length: 5 }, (_, i) => {
              const d = new Date(monday);
              d.setDate(monday.getDate() + i);
              return d.toISOString().slice(0, 10);
            })
          );
        }
      })
      .catch(err => console.error('Failed to load schedule:', err))
      .finally(() => setSchedLoading(false));

  }, [worker?.id, scheduleKey]); // ← scheduleKey triggers re-fetch after assign/unassign

  // ── Helpers ───────────────────────────────────────────────────────

  function getSlot(date: string, time: string): ScheduleSlot | undefined {
    return slots.find(s => s.date === date && s.startTime === time);
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Performance — only shown when perf data exists */}
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

        {/* Assigned tasks */}
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
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Schedule</h3>

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
                  {dates.map(date => (
                    <tr key={date}>
                      <td className="text-xs text-foreground p-2 font-medium whitespace-nowrap">
                        {date.slice(5)}
                      </td>
                      {TIME_SLOTS.map(time => {
                        const slot   = getSlot(date, time);
                        const status = slot?.status ?? 'available';
                        const task   = slot?.taskId ? taskMap[slot.taskId] : null;
                        return (
                          <td key={time} className="p-1">
                            <div
                              title={task ? task.title : status}
                              className={`h-8 rounded-md flex items-center justify-center text-[9px] font-medium cursor-default transition-colors ${
                                status === 'allocated' ? 'slot-allocated' :
                                status === 'leave'     ? 'slot-leave'     :
                                status === 'blocked'   ? 'slot-blocked'   :
                                                         'slot-available'
                              }`}
                            >
                              {status === 'allocated' ? '█' : status === 'leave' ? 'L' : '░'}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {dates.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">
                No schedule data available for this worker.
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