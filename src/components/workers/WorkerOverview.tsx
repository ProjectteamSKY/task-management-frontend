import { tasks, scheduleSlots } from '@/data/mockData';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DATES      = ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'];

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

interface WorkerOverviewProps {
  worker: any;
  perf: any;
  workerTasks: typeof tasks;
  workload: number;
}

export default function WorkerOverview({ worker, perf, workerTasks, workload }: WorkerOverviewProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance */}
        {perf && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              {([
                ['Tasks Completed', perf.tasksCompleted,                    'text-foreground'],
                ['Avg Completion',  `${perf.avgCompletionTime}h`,           'text-foreground'],
                ['On-Time Rate',    `${Math.round(perf.onTimeRate * 100)}%`,'text-success'   ],
                ['Quality Score',   `${perf.qualityScore}/5`,               'text-foreground'],
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
        </div>
      </div>

      {/* Weekly Schedule */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Schedule</h3>
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
              {DATES.map(date => {
                const daySlots = scheduleSlots.filter(
                  s => s.workerId === worker.id && s.date === date,
                );
                return (
                  <tr key={date}>
                    <td className="text-xs text-foreground p-2 font-medium whitespace-nowrap">
                      {date.slice(5)}
                    </td>
                    {TIME_SLOTS.map(time => {
                      const slot   = daySlots.find(s => s.startTime === time);
                      const status = slot?.status ?? 'available';
                      const task   = slot?.taskId ? tasks.find(t => t.id === slot.taskId) : null;
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
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          {SCHEDULE_LEGEND.map(([cls, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${cls}`} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}