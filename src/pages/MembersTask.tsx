import { useState } from 'react';
import { workers, tasks, taskAssignments } from '@/data/mockData';
import { ClockIcon, AlertIcon, CheckIcon } from '@/components/icons/Icons';

const priorityStyles: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border border-destructive/20',
  high: 'bg-warning/15 text-warning border border-warning/20',
  medium: 'bg-primary/15 text-primary border border-primary/20',
  low: 'bg-secondary text-muted-foreground border border-border',
};

const statusStyles: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  todo: 'bg-primary/15 text-primary',
  in_progress: 'bg-warning/15 text-warning',
  review: 'bg-purple-500/15 text-purple-400',
  done: 'bg-success/15 text-success',
};

const approvalStyles: Record<string, string> = {
  approved: 'bg-success/15 text-success border border-success/20',
  pending: 'bg-warning/15 text-warning border border-warning/20',
  rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
};

export default function MemberTasks() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id ?? '');

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // Get all task assignments for selected worker
  const workerAssignments = taskAssignments.filter(a => a.workerId === selectedWorkerId);
  const assignedTaskIds = workerAssignments.map(a => a.taskId);
  const workerTasks = tasks.filter(t => assignedTaskIds.includes(t.id));

  // Stats
  const totalHours = workerTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const pendingApprovals = workerAssignments.filter(a => a.approvalStatus === 'pending').length;
  const atRiskTasks = workerTasks.filter(t => {
    const due = new Date(t.dueDate);
    const start = new Date(t.startDate);
    const days = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const capacity = (selectedWorker?.dailyCapacityHours ?? 8) * days;
    return t.estimatedHours > capacity * 0.8;
  });

  const getDeadlineRisk = (task: typeof tasks[0]) => {
    const due = new Date(task.dueDate);
    const start = new Date(task.startDate);
    const days = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const capacity = (selectedWorker?.dailyCapacityHours ?? 8) * days;
    if (task.estimatedHours > capacity) return 'high';
    if (task.estimatedHours > capacity * 0.8) return 'medium';
    return 'low';
  };

  return (
    <div className="flex h-[calc(100vh-64px)] gap-0 animate-fade-in overflow-hidden">

      {/* LEFT PANEL — worker list */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">Team Members</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{workers.length} workers</p>
        </div>
        <div className="overflow-y-auto flex-1 scrollbar-thin py-2">
          {workers.map(worker => {
            const wAssignments = taskAssignments.filter(a => a.workerId === worker.id);
            const wTasks = tasks.filter(t => wAssignments.map(a => a.taskId).includes(t.id));
            const pending = wAssignments.filter(a => a.approvalStatus === 'pending').length;
            const isSelected = selectedWorkerId === worker.id;

            return (
              <button
                key={worker.id}
                onClick={() => setSelectedWorkerId(worker.id)}
                className={`w-full text-left px-4 py-3 transition-colors flex items-center gap-3 group
                  ${isSelected
                    ? 'bg-primary/10 border-r-2 border-primary'
                    : 'hover:bg-secondary/50 border-r-2 border-transparent'
                  }`}
              >
                {/* Avatar */}
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0
                  ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                  {worker.avatar}
                </div>
                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-sm font-medium text-foreground truncate">{worker.name}</p>
                    {pending > 0 && (
                      <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-medium">
                        {pending}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{worker.role}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {wTasks.length} tasks
                    <span className={`ml-1.5 ${worker.status === 'active' ? 'text-success' : 'text-warning'}`}>
                      · {worker.status}
                    </span>
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL — tasks for selected worker */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        {selectedWorker && (
          <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                {selectedWorker.avatar}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">{selectedWorker.name}</h1>
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
                    ${selectedWorker.status === 'active'
                      ? 'bg-success/15 text-success'
                      : 'bg-warning/15 text-warning'}`}>
                    {selectedWorker.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedWorker.role} · {selectedWorker.department}</p>
              </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-6">
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{workerTasks.length}</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Tasks</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{totalHours}h</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Total hrs</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-bold ${pendingApprovals > 0 ? 'text-warning' : 'text-muted-foreground'}`}>
                  {pendingApprovals}
                </p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Pending</p>
              </div>
              <div className="text-center">
                <p className={`text-xl font-bold ${atRiskTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {atRiskTasks.length}
                </p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">At Risk</p>
              </div>
              <div className="text-center">
                <p className="text-xl font-bold text-foreground">{selectedWorker.dailyCapacityHours}h</p>
                <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Daily Cap</p>
              </div>
            </div>
          </div>
        )}

        {/* Task list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-6">
          {workerTasks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                <CheckIcon size={20} className="text-muted-foreground" />
              </div>
              <p className="text-sm font-medium text-foreground">No tasks assigned</p>
              <p className="text-xs text-muted-foreground mt-1">This worker has no tasks yet.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Table header */}
              <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 px-4 pb-1">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Task</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Status</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Priority</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Hours</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Risk</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">Approval</p>
              </div>

              {workerTasks.map(task => {
                const assignment = workerAssignments.find(a => a.taskId === task.id);
                const risk = getDeadlineRisk(task);

                return (
                  <div key={task.id}
                    className="glass rounded-xl p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-4 items-center hover:bg-secondary/20 transition-colors">

                    {/* Task name */}
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{task.description}</p>
                      <p className="text-[11px] text-muted-foreground mt-1">Due {task.dueDate}</p>
                    </div>

                    {/* Status */}
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full w-fit ${statusStyles[task.status]}`}>
                      {task.status.replace('_', ' ')}
                    </span>

                    {/* Priority */}
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full w-fit ${priorityStyles[task.priority]}`}>
                      {task.priority}
                    </span>

                    {/* Hours */}
                    <div className="flex items-center gap-1 text-sm text-foreground">
                      <ClockIcon size={13} className="text-muted-foreground" />
                      <span>{task.estimatedHours}h</span>
                      {assignment?.assignedHours && assignment.assignedHours !== task.estimatedHours && (
                        <span className="text-[11px] text-muted-foreground">/ {assignment.assignedHours}h alloc</span>
                      )}
                    </div>

                    {/* Deadline Risk */}
                    <div className="flex items-center gap-1">
                      {risk === 'high' && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full border border-destructive/20">
                          <AlertIcon size={11} /> high
                        </span>
                      )}
                      {risk === 'medium' && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20">
                          <AlertIcon size={11} /> med
                        </span>
                      )}
                      {risk === 'low' && (
                        <span className="flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20">
                          <CheckIcon size={11} /> ok
                        </span>
                      )}
                    </div>

                    {/* Approval + AI confidence */}
                    <div className="flex flex-col gap-1">
                      {assignment?.approvalStatus && (
                        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${approvalStyles[assignment.approvalStatus]}`}>
                          {assignment.approvalStatus}
                        </span>
                      )}
                      {assignment?.confidence && (
                        <span className="text-[10px] text-muted-foreground">
                          AI {assignment.confidence}% match
                        </span>
                      )}
                      {assignment?.approvalStatus === 'pending' && (
                        <div className="flex gap-1 mt-1">
                          <button className="text-[10px] font-medium bg-success/15 text-success px-2 py-1 rounded hover:bg-success/25 transition-colors">
                            ✓ Approve
                          </button>
                          <button className="text-[10px] font-medium bg-primary/15 text-primary px-2 py-1 rounded hover:bg-primary/25 transition-colors">
                            Reassign
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer summary bar */}
        {workerTasks.length > 0 && selectedWorker && (
          <div className="px-6 py-3 border-t border-border bg-secondary/20 shrink-0 flex items-center gap-6">
            <p className="text-xs text-muted-foreground">
              <span className="text-foreground font-medium">{workerTasks.length} tasks</span> · {totalHours}h total workload
            </p>
            {pendingApprovals > 0 && (
              <p className="text-xs text-warning">
                ⚠ {pendingApprovals} task{pendingApprovals > 1 ? 's' : ''} awaiting approval
              </p>
            )}
            {atRiskTasks.length > 0 && (
              <p className="text-xs text-destructive">
                🔴 {atRiskTasks.length} task{atRiskTasks.length > 1 ? 's' : ''} at deadline risk
              </p>
            )}
            <p className="text-xs text-muted-foreground ml-auto">
              Daily capacity: <span className="text-foreground font-medium">{selectedWorker.dailyCapacityHours}h/day</span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}