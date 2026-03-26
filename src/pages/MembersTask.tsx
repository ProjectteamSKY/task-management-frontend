import { useState } from 'react';
import { workers, tasks, taskAssignments } from '@/data/mockData';
import { ClockIcon, AlertIcon, CheckIcon, ChevronDownIcon } from '@/components/icons/Icons';
import AssignTasksPanel from '@/components/workers/AssignTasksPanel';

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

type Filter = 'all' | 'active' | 'atrisk';

interface Assignment {
  taskId: string;
  workerId: string;
}

export default function MemberTasks() {
  const [filter, setFilter] = useState<Filter>('all');
  const [focusedWorker, setFocusedWorker] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    Object.fromEntries(workers.map(w => [w.id, true]))
  );
  const [localAssignments, setLocalAssignments] = useState<Assignment[]>(
    taskAssignments.map(a => ({ taskId: a.taskId, workerId: a.workerId }))
  );
  const [localTasks, setLocalTasks] = useState(() => tasks.map(t => ({ ...t })));
  const [reassigning, setReassigning] = useState<{
    taskId: string;
    fromWorkerId: string;
    picked: string | null;
  } | null>(null);
  const [assigningTo, setAssigningTo] = useState<string | null>(null);

  // ── AssignTasksPanel state ────────────────────────────────────────
  const [panelOpen, setPanelOpen] = useState(false);
  const [panelWorkerId, setPanelWorkerId] = useState<string | null>(null);

  const panelWorker = workers.find(w => w.id === panelWorkerId);

  function openPanel(workerId: string) {
    setPanelWorkerId(workerId);
    setPanelOpen(true);
  }

  function handlePanelAssign(taskId: string, assigned: boolean) {
    if (!panelWorkerId) return;
    setLocalAssignments(prev => {
      const without = prev.filter(
        a => !(a.taskId === taskId && a.workerId === panelWorkerId)
      );
      return assigned ? [...without, { taskId, workerId: panelWorkerId }] : without;
    });
  }

  // ── Helpers ──────────────────────────────────────────────────────
  const getWorkerTasks = (wid: string) =>
    localAssignments
      .filter(a => a.workerId === wid)
      .map(a => localTasks.find(t => t.id === a.taskId))
      .filter(Boolean) as typeof tasks;

  const unassignedTasks = localTasks.filter(
    t => !localAssignments.some(a => a.taskId === t.id)
  );

  const getWorkloadPct = (wid: string) => {
    const wt = getWorkerTasks(wid);
    const total = wt.reduce((s, t) => s + t.estimatedHours, 0);
    const cap = (workers.find(w => w.id === wid)?.dailyCapacityHours ?? 8) * 5;
    return Math.min(100, Math.round((total / cap) * 100));
  };

  const wlBarColor = (pct: number) =>
    pct >= 80 ? 'bg-destructive' : pct >= 60 ? 'bg-warning' : 'bg-success';

  const getDeadlineRisk = (task: typeof tasks[0], wid: string) => {
    const due = new Date(task.dueDate);
    const start = new Date(task.startDate);
    const days = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const cap = (workers.find(w => w.id === wid)?.dailyCapacityHours ?? 8) * days;
    if (task.estimatedHours > cap) return 'high';
    if (task.estimatedHours > cap * 0.8) return 'medium';
    return 'low';
  };

  // ── Actions ──────────────────────────────────────────────────────
  const handleChangeStatus = (taskId: string, status: string) =>
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));

  const handleRemove = (taskId: string, workerId: string) =>
    setLocalAssignments(prev =>
      prev.filter(a => !(a.taskId === taskId && a.workerId === workerId))
    );

  const handleConfirmReassign = () => {
    if (!reassigning?.picked) return;
    setLocalAssignments(prev =>
      prev.map(a =>
        a.taskId === reassigning.taskId && a.workerId === reassigning.fromWorkerId
          ? { ...a, workerId: reassigning.picked! }
          : a
      )
    );
    setReassigning(null);
  };

  const handleAssignTask = (taskId: string, workerId: string) => {
    setLocalAssignments(prev => [...prev, { taskId, workerId }]);
    setAssigningTo(null);
  };

  // ── Filtered workers ─────────────────────────────────────────────
  let visibleWorkers = workers;
  if (focusedWorker) {
    visibleWorkers = workers.filter(w => w.id === focusedWorker);
  } else if (filter === 'active') {
    visibleWorkers = workers.filter(w => w.status === 'active');
  } else if (filter === 'atrisk') {
    visibleWorkers = workers.filter(w =>
      getWorkerTasks(w.id).some(t => getDeadlineRisk(t, w.id) === 'high')
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden animate-fade-in">

      {/* ── Top bar ── */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h1 className="text-base font-semibold text-foreground">Member Tasks</h1>

        <div className="flex items-center gap-3">
          {/* Filter pills */}
          <div className="flex items-center gap-1.5">
            {(['all', 'active', 'atrisk'] as Filter[]).map(f => (
              <button
                key={f}
                onClick={() => { setFilter(f); setFocusedWorker(null); }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium
                  ${filter === f && !focusedWorker
                    ? 'border-border bg-secondary text-foreground'
                    : 'border-transparent text-muted-foreground hover:text-foreground'}`}
              >
                {f === 'all' ? 'All workers' : f === 'active' ? 'Active' : 'At risk'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Worker avatar strip ── */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-evenly w-full">

          {/* "All" chip */}
          <button
            onClick={() => setFocusedWorker(null)}
            className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl border transition-colors flex-1
              ${!focusedWorker
                ? 'border-primary/40 bg-primary/10'
                : 'border-transparent hover:bg-secondary/60'}`}
          >
            <div className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-[10px] font-semibold text-muted-foreground">
              All
            </div>
            <span className="text-[9px] font-medium text-foreground">All</span>
            <span className="text-[9px] text-muted-foreground">{workers.length}</span>
          </button>

          {/* Worker chips */}
          {workers.map(w => {
            const wt = getWorkerTasks(w.id);
            const pct = getWorkloadPct(w.id);
            const isFocused = focusedWorker === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setFocusedWorker(isFocused ? null : w.id)}
                className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl border transition-colors flex-1
                  ${isFocused
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-transparent hover:bg-secondary/60'}`}
              >
                <div className="relative">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-semibold text-primary">
                    {w.avatar}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full border-2 border-background
                    ${w.status === 'active' ? 'bg-success' : 'bg-warning'}`}
                  />
                </div>
                <span className="text-[9px] font-medium text-foreground truncate max-w-full">
                  {w.name.split(' ')[0]}
                </span>
                <div className="flex items-center gap-1 w-full px-1">
                  <div className="flex-1 h-1 rounded-full bg-border overflow-hidden">
                    <div
                      className={`h-full rounded-full ${wlBarColor(pct)}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-muted-foreground">{wt.length}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Worker rows (scrollable) ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
        {visibleWorkers.map(w => {
          const wt = getWorkerTasks(w.id);
          const atRisk = wt.filter(t => getDeadlineRisk(t, w.id) === 'high').length;
          const totalHrs = wt.reduce((s, t) => s + t.estimatedHours, 0);
          const pct = getWorkloadPct(w.id);
          const isExpanded = expanded[w.id] ?? true;
          const isAssigning = assigningTo === w.id;
          const otherWorkers = workers.filter(x => x.id !== w.id && x.status === 'active');

          return (
            <div key={w.id} className="rounded-xl border border-border overflow-hidden bg-secondary/5">

              {/* ── Worker header ── */}
              <div
                className="flex items-center gap-3 px-5 py-3 cursor-pointer hover:bg-secondary/30 transition-colors border-b border-border bg-secondary/20"
                onClick={() => setExpanded(prev => ({ ...prev, [w.id]: !isExpanded }))}
              >
                <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-xs font-semibold text-primary shrink-0">
                  {w.avatar}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{w.name}</span>
                    {w.status !== 'active' && (
                      <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">
                        {w.status}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{w.role} · {w.department}</p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                    {wt.length} tasks
                  </span>
                  <span className="text-[11px] text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                    <ClockIcon size={11} className="inline mr-0.5" />{totalHrs}h
                  </span>
                  {atRisk > 0 ? (
                    <span className="text-[11px] bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium border border-destructive/20">
                      <AlertIcon size={10} className="inline mr-0.5" />{atRisk} at risk
                    </span>
                  ) : (
                    <span className="text-[11px] bg-success/10 text-success px-2.5 py-1 rounded-full">
                      <CheckIcon size={10} className="inline mr-0.5" />on track
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                      <div
                        className={`h-full rounded-full ${wlBarColor(pct)}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-7">{pct}%</span>
                  </div>
                  {/* Per-row quick assign — opens panel directly for this worker */}
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      openPanel(w.id);
                    }}
                    className={`text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors
                      ${panelWorkerId === w.id && panelOpen
                        ? 'border-primary bg-primary/10 text-primary'
                        : 'border-border bg-secondary text-muted-foreground hover:text-foreground'}`}
                  >
                    + Assign
                  </button>
                  <ChevronDownIcon
                    size={14}
                    className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* ── Expanded body ── */}
              {isExpanded && (
                <>
                  {wt.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <CheckIcon size={20} className="text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">No tasks assigned</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">Click "+ Assign" to add work</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Column headers */}
                      <div className="grid grid-cols-[2fr_110px_100px_70px_90px_200px] gap-2 px-5 py-2 border-b border-border">
                        {['Task', 'Status', 'Priority', 'Hours', 'Risk', 'Actions'].map(h => (
                          <p key={h} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</p>
                        ))}
                      </div>

                      {/* Task rows */}
                      {wt.map(task => {
                        const risk = getDeadlineRisk(task, w.id);
                        const isThisReassign =
                          reassigning?.taskId === task.id && reassigning.fromWorkerId === w.id;

                        return (
                          <div key={task.id}>
                            <div className="grid grid-cols-[2fr_110px_100px_70px_90px_200px] gap-2 px-5 py-3 border-b border-border items-center hover:bg-secondary/20 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Due {task.dueDate}</p>
                              </div>

                              <select
                                value={task.status}
                                onChange={e => handleChangeStatus(task.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className={`text-[11px] font-medium px-2 py-1 rounded-full border-0 cursor-pointer outline-none w-fit ${statusStyles[task.status]}`}
                              >
                                {['todo', 'in_progress', 'review', 'done', 'backlog'].map(s => (
                                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                              </select>

                              <span className={`text-[11px] font-medium px-2 py-1 rounded-full w-fit ${priorityStyles[task.priority]}`}>
                                {task.priority}
                              </span>

                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ClockIcon size={12} />
                                <span>{task.estimatedHours}h</span>
                              </div>

                              {risk === 'high' ? (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                                  <AlertIcon size={10} />high
                                </span>
                              ) : risk === 'medium' ? (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-warning/10 text-warning border border-warning/20">
                                  watch
                                </span>
                              ) : (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-success/10 text-success border border-success/20 flex items-center gap-1">
                                  <CheckIcon size={10} />ok
                                </span>
                              )}

                              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() =>
                                    setReassigning(isThisReassign
                                      ? null
                                      : { taskId: task.id, fromWorkerId: w.id, picked: null }
                                    )
                                  }
                                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors
                                    ${isThisReassign
                                      ? 'bg-primary/15 text-primary'
                                      : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
                                >
                                  Reassign
                                </button>
                                <button
                                  onClick={() => handleRemove(task.id, w.id)}
                                  className="text-[10px] font-medium px-2.5 py-1.5 rounded-lg bg-secondary text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
                                >
                                  Remove
                                </button>
                              </div>
                            </div>

                            {isThisReassign && (
                              <div className="px-5 py-4 border-b border-border bg-secondary/30">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                                  Reassign to
                                </p>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                  {otherWorkers.map(ow => {
                                    const op = getWorkloadPct(ow.id);
                                    return (
                                      <button
                                        key={ow.id}
                                        onClick={() =>
                                          setReassigning(prev => prev ? { ...prev, picked: ow.id } : null)
                                        }
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors
                                          ${reassigning?.picked === ow.id
                                            ? 'border-primary bg-primary/10'
                                            : 'border-border bg-secondary/30 hover:border-border/60'}`}
                                      >
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">
                                          {ow.avatar}
                                        </div>
                                        <p className="text-[11px] font-medium text-foreground">{ow.name.split(' ')[0]}</p>
                                        <p className="text-[10px] text-muted-foreground">{ow.role.split(' ')[0]}</p>
                                        <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                                          <div
                                            className={`h-full rounded-full ${wlBarColor(op)}`}
                                            style={{ width: `${op}%` }}
                                          />
                                        </div>
                                        <span className="text-[10px] text-muted-foreground">{op}% loaded</span>
                                      </button>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-2">
                                  <button
                                    onClick={handleConfirmReassign}
                                    disabled={!reassigning?.picked}
                                    className="text-xs font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors"
                                  >
                                    Confirm reassignment
                                  </button>
                                  <button
                                    onClick={() => setReassigning(null)}
                                    className="text-xs font-medium px-4 py-2 rounded-lg bg-secondary text-muted-foreground hover:bg-secondary/80 transition-colors"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </>
                  )}

                  {isAssigning && (
                    <div className="px-5 py-4 border-t border-border bg-secondary/20">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">
                        Assign task to {w.name}
                      </p>
                      {unassignedTasks.length === 0 ? (
                        <p className="text-xs text-muted-foreground">No unassigned tasks available.</p>
                      ) : (
                        <div className="space-y-2">
                          {unassignedTasks.map(task => (
                            <div
                              key={task.id}
                              className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30"
                            >
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {task.estimatedHours}h · due {task.dueDate}
                                </p>
                              </div>
                              <span className={`text-[11px] font-medium px-2 py-1 rounded-full ${priorityStyles[task.priority]}`}>
                                {task.priority}
                              </span>
                              <button
                                onClick={() => handleAssignTask(task.id, w.id)}
                                className="text-xs font-medium px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors whitespace-nowrap"
                              >
                                Assign
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="px-6 py-3 border-t border-border bg-secondary/20 shrink-0 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground font-medium">{workers.length} workers</span>
          {' '}· {tasks.length} total tasks
        </span>
        {unassignedTasks.length > 0 && (
          <span className="text-warning">⚠ {unassignedTasks.length} unassigned</span>
        )}
        <span className="ml-auto">
          {visibleWorkers.filter(w =>
            getWorkerTasks(w.id).some(t => getDeadlineRisk(t, w.id) === 'high')
          ).length} workers with at-risk tasks
        </span>
      </div>

      {/* ── AssignTasksPanel (slide-in) ── */}
      {panelWorker && (
        <AssignTasksPanel
          open={panelOpen}
          worker={panelWorker}
          onClose={() => { setPanelOpen(false); setPanelWorkerId(null); }}
          onAssign={handlePanelAssign}
        />
      )}
    </div>
  );
}