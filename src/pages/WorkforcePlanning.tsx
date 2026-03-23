import { useState } from 'react';
import { tasks, workers, scheduleSlots, getWorkerWorkload, getOverallWorkload, taskAssignments } from '@/data/mockData';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/kanban/TaskCard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { ClockIcon, AlertIcon } from '@/components/icons/Icons';

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const TODAY = '2026-03-11';

const kanbanColumns: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'todo', label: 'To Do', accent: 'bg-primary' },
  { status: 'in_progress', label: 'In Progress', accent: 'bg-warning' },
  { status: 'review', label: 'Review', accent: 'bg-purple-400' },
  { status: 'done', label: 'Done', accent: 'bg-success' },
];

export default function WorkforcePlanning() {
  const [taskList, setTaskList] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const pendingApprovals = taskAssignments.filter(a => a.approvalStatus === 'pending');
  const unassigned = taskList.filter(t => t.assignedWorkers.length === 0 && t.status !== 'done');

  const handleDrop = (status: TaskStatus) => {
    if (!draggedTask) return;
    setTaskList(prev => prev.map(t => t.id === draggedTask ? { ...t, status } : t));
    setDraggedTask(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Workforce Planning</h1>
        <p className="text-muted-foreground text-sm mt-1">Unified task inbox, kanban board, and worker availability</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[320px_1fr] gap-4">
        {/* Left: Task Inbox */}
        <div className="space-y-4">
          {/* Unassigned / Inbox */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <AlertIcon size={15} className="text-warning" />
              Task Inbox
              <span className="text-xs bg-warning/15 text-warning px-2 py-0.5 rounded-full ml-auto">{unassigned.length}</span>
            </h3>
            <div className="space-y-2 max-h-[300px] overflow-y-auto scrollbar-thin">
              {unassigned.map(task => (
                <div key={task.id} onClick={() => setSelectedTask(task)}
                  className="bg-secondary/50 rounded-lg p-3 cursor-pointer hover:bg-secondary/80 transition-colors"
                  draggable onDragStart={() => setDraggedTask(task.id)}
                >
                  <p className="text-sm font-medium text-foreground">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                    <ClockIcon size={12} /> {task.estimatedHours}h
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                      task.priority === 'critical' ? 'bg-destructive/15 text-destructive' :
                      task.priority === 'high' ? 'bg-warning/15 text-warning' :
                      'bg-primary/15 text-primary'
                    }`}>{task.priority}</span>
                    {task.source === 'slack' && <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">#</span>}
                  </div>
                </div>
              ))}
              {unassigned.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No unassigned tasks</p>}
            </div>
          </div>

          {/* Pending Approvals */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Pending Approvals ({pendingApprovals.length})</h3>
            <div className="space-y-2 max-h-[200px] overflow-y-auto scrollbar-thin">
              {pendingApprovals.map(a => {
                const task = tasks.find(t => t.id === a.taskId);
                const worker = workers.find(w => w.id === a.workerId);
                return (
                  <div key={a.id} className="bg-secondary/50 rounded-lg p-3">
                    <p className="text-xs font-medium text-foreground">{task?.title}</p>
                    <div className="flex items-center justify-between mt-1.5">
                      <span className="text-[11px] text-muted-foreground">{worker?.name} · {a.confidence}%</span>
                      <div className="flex gap-1">
                        <button className="text-[10px] bg-success/15 text-success px-2 py-0.5 rounded hover:bg-success/25">✓</button>
                        <button className="text-[10px] bg-destructive/15 text-destructive px-2 py-0.5 rounded hover:bg-destructive/25">✕</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Workload indicators */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Worker Workload</h3>
            <div className="space-y-2.5">
              {workers.filter(w => w.status === 'active').map(worker => {
                const wl = getOverallWorkload(worker.id);
                return (
                  <div key={worker.id} className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-medium text-secondary-foreground shrink-0">{worker.avatar}</div>
                    <span className="text-xs text-foreground w-16 truncate">{worker.name.split(' ')[0]}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${wl > 80 ? 'bg-destructive' : wl > 60 ? 'bg-warning' : 'bg-success'}`} style={{ width: `${wl}%` }} />
                    </div>
                    <span className={`text-[11px] font-medium w-8 text-right ${wl > 80 ? 'text-destructive' : wl > 60 ? 'text-warning' : 'text-success'}`}>{wl}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Kanban + Availability */}
        <div className="space-y-4">
          {/* Mini Kanban */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Kanban Board</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
              {kanbanColumns.map(col => {
                const colTasks = taskList.filter(t => t.status === col.status);
                return (
                  <div key={col.status} className="min-w-[220px] flex-shrink-0"
                    onDragOver={e => e.preventDefault()} onDrop={() => handleDrop(col.status)}
                  >
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                      <span className="text-xs font-semibold text-foreground">{col.label}</span>
                      <span className="text-[10px] text-muted-foreground ml-auto">{colTasks.length}</span>
                    </div>
                    <div className="space-y-1.5 min-h-[100px] bg-secondary/20 rounded-lg p-1.5">
                      {colTasks.slice(0, 4).map(task => (
                        <div key={task.id} draggable onDragStart={() => setDraggedTask(task.id)} onClick={() => setSelectedTask(task)}
                          className="bg-card/60 border border-border/50 rounded-md p-2 cursor-pointer hover:border-primary/30 transition-colors text-xs"
                        >
                          <p className="text-foreground font-medium truncate">{task.title}</p>
                          <p className="text-muted-foreground mt-0.5">{task.estimatedHours}h · {task.assignedWorkers.length} workers</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Availability Grid */}
          <div className="glass rounded-xl p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">Worker Availability — {TODAY}</h3>
            <div className="overflow-x-auto scrollbar-thin">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left w-36 font-medium">Worker</th>
                    {TIME_SLOTS.map(s => (
                      <th key={s} className="text-[10px] text-muted-foreground p-1.5 text-center font-normal">{s}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {workers.filter(w => w.status === 'active').map(worker => {
                    const daySlots = scheduleSlots.filter(s => s.workerId === worker.id && s.date === TODAY);
                    return (
                      <tr key={worker.id} className="border-t border-border/20">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-secondary flex items-center justify-center text-[9px] font-medium text-secondary-foreground">{worker.avatar}</div>
                            <span className="text-xs text-foreground">{worker.name.split(' ')[0]}</span>
                          </div>
                        </td>
                        {TIME_SLOTS.map(time => {
                          const slot = daySlots.find(s => s.startTime === time);
                          const status = slot?.status || 'available';
                          const task = slot?.taskId ? tasks.find(t => t.id === slot.taskId) : null;
                          return (
                            <td key={time} className="p-0.5"
                              onDragOver={status === 'available' ? (e) => e.preventDefault() : undefined}
                              onDrop={status === 'available' ? () => {
                                // Drag-to-assign placeholder
                                if (draggedTask) setDraggedTask(null);
                              } : undefined}
                            >
                              <div className={`h-8 rounded flex items-center justify-center text-[8px] font-medium transition-all ${
                                status === 'allocated' ? 'slot-allocated' :
                                status === 'leave' ? 'slot-leave' :
                                status === 'available' ? 'slot-available hover:bg-success/25 cursor-pointer' :
                                'slot-blocked'
                              }`} title={task ? task.title : status}>
                                {status === 'allocated' ? '█' : ''}
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
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded slot-allocated" /> Allocated</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded slot-available" /> Available</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded slot-leave" /> Leave</span>
            </div>
          </div>
        </div>
      </div>

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
