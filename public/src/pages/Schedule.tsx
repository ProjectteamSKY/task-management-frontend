import { workers, tasks, scheduleSlots, getWorkerWorkload } from '@/data/mockData';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DATES = ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'];
const DAY_LABELS = ['Mon 10','Tue 11','Wed 12','Thu 13','Fri 14'];

export default function Schedule() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Schedule</h1>
        <p className="text-muted-foreground text-sm mt-1">Multi-worker, multi-day availability grid</p>
      </div>

      {/* Daily detailed view */}
      {DATES.map((date, di) => (
        <div key={date} className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-3">{DAY_LABELS[di]} — March {date.slice(8)}, 2026</h3>
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left w-40 font-medium">Worker</th>
                  {TIME_SLOTS.map(s => (
                    <th key={s} className="text-[10px] text-muted-foreground p-2 text-center font-normal min-w-[60px]">{s}</th>
                  ))}
                  <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-right font-medium">Load</th>
                </tr>
              </thead>
              <tbody>
                {workers.map(worker => {
                  const daySlots = scheduleSlots.filter(s => s.workerId === worker.id && s.date === date);
                  const wl = getWorkerWorkload(worker.id, date);
                  return (
                    <tr key={worker.id} className="border-t border-border/30">
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
                      {TIME_SLOTS.map(time => {
                        const slot = daySlots.find(s => s.startTime === time);
                        const status = slot?.status || 'available';
                        const task = slot?.taskId ? tasks.find(t => t.id === slot.taskId) : null;
                        return (
                          <td key={time} className="p-1">
                            <div
                              className={`h-9 rounded-md flex items-center justify-center text-[9px] font-medium transition-colors ${
                                status === 'allocated' ? 'slot-allocated' :
                                status === 'leave' ? 'slot-leave' :
                                status === 'blocked' ? 'slot-blocked' :
                                'slot-available'
                              }`}
                              title={task ? task.title : status}
                            >
                              {status === 'allocated' && task ? task.title.slice(0, 8) + '..' : status === 'leave' ? 'L' : ''}
                            </div>
                          </td>
                        );
                      })}
                      <td className="p-2 text-right">
                        <span className={`text-xs font-semibold ${wl > 80 ? 'text-destructive' : wl > 50 ? 'text-warning' : 'text-success'}`}>{wl}%</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {/* Legend */}
      <div className="flex gap-4 text-[11px] text-muted-foreground">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-allocated" /> Allocated</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-available" /> Available</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-leave" /> Leave</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-blocked" /> Blocked</span>
      </div>
    </div>
  );
}
