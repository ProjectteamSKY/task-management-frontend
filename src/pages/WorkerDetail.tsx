import { useParams, Link } from 'react-router-dom';
import { workers, workerPerformance, taskAssignments, tasks, scheduleSlots, getWorkerWorkload, getOverallWorkload } from '@/data/mockData';
import { ChevronRightIcon, ClockIcon, CheckIcon, StarIcon, AlertIcon } from '@/components/icons/Icons';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DATES = ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'];

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const worker = workers.find(w => w.id === id);
  if (!worker) return <div className="text-foreground">Worker not found</div>;

  const perf = workerPerformance.find(p => p.workerId === worker.id);
  const assignments = taskAssignments.filter(a => a.workerId === worker.id);
  const workerTasks = tasks.filter(t => t.assignedWorkers.includes(worker.id));
  const workload = getOverallWorkload(worker.id);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/workers" className="hover:text-foreground transition-colors">Workers</Link>
        <ChevronRightIcon size={14} />
        <span className="text-foreground">{worker.name}</span>
      </div>

      {/* Profile header */}
      <div className="glass rounded-xl p-6 flex items-start gap-6">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shrink-0">
          {worker.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{worker.name}</h1>
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              worker.status === 'active' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}>{worker.status}</span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">{worker.role} · {worker.department} · {worker.email}</p>

          {/* Capabilities */}
          <div className="flex flex-wrap gap-2 mt-3">
            {worker.capabilities.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs bg-secondary rounded-md px-2.5 py-1.5">
                <span className="text-foreground font-medium">{c.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < c.proficiency ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-2 mt-2">
            {worker.specializations.map(s => (
              <span key={s} className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-md">{s}</span>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-4 shrink-0">
          <div className="text-center">
            <p className="text-2xl font-bold text-foreground">{worker.dailyCapacityHours}h</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Cap</p>
          </div>
          <div className="text-center">
            <p className={`text-2xl font-bold ${workload > 80 ? 'text-destructive' : workload > 60 ? 'text-warning' : 'text-success'}`}>{workload}%</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workload</p>
          </div>
          {perf && (
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground flex items-center gap-1"><StarIcon size={16} className="text-warning" />{perf.qualityScore}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Performance */}
        {perf && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Tasks Completed</p>
                <p className="text-lg font-bold text-foreground">{perf.tasksCompleted}</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Avg Completion</p>
                <p className="text-lg font-bold text-foreground">{perf.avgCompletionTime}h</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">On-Time Rate</p>
                <p className="text-lg font-bold text-success">{Math.round(perf.onTimeRate * 100)}%</p>
              </div>
              <div className="bg-secondary/50 rounded-lg p-3">
                <p className="text-xs text-muted-foreground">Quality Score</p>
                <p className="text-lg font-bold text-foreground">{perf.qualityScore}/5</p>
              </div>
            </div>
          </div>
        )}

        {/* Assigned tasks */}
        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">Assigned Tasks ({workerTasks.length})</h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
            {workerTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.estimatedHours}h · {t.priority}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                  t.status === 'done' ? 'bg-success/15 text-success' :
                  t.status === 'in_progress' ? 'bg-warning/15 text-warning' :
                  'bg-primary/15 text-primary'
                }`}>{t.status.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule grid */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Schedule</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left">Date</th>
                {TIME_SLOTS.map(s => (
                  <th key={s} className="text-[10px] text-muted-foreground p-2 text-center font-normal">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATES.map(date => {
                const daySlots = scheduleSlots.filter(s => s.workerId === worker.id && s.date === date);
                return (
                  <tr key={date}>
                    <td className="text-xs text-foreground p-2 font-medium whitespace-nowrap">{date.slice(5)}</td>
                    {TIME_SLOTS.map((time, i) => {
                      const slot = daySlots.find(s => s.startTime === time);
                      const status = slot?.status || 'available';
                      const task = slot?.taskId ? tasks.find(t => t.id === slot.taskId) : null;
                      return (
                        <td key={time} className="p-1">
                          <div
                            className={`h-8 rounded-md flex items-center justify-center text-[9px] font-medium cursor-default transition-colors ${
                              status === 'allocated' ? 'slot-allocated' :
                              status === 'leave' ? 'slot-leave' :
                              status === 'blocked' ? 'slot-blocked' :
                              'slot-available'
                            }`}
                            title={task ? task.title : status}
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
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-allocated" /> Allocated</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-available" /> Available</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-leave" /> Leave</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded slot-blocked" /> Blocked</span>
        </div>
      </div>
    </div>
  );
}
