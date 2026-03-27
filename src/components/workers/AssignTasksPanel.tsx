import { useState, useMemo, useEffect } from 'react';
import { SearchIcon, XIcon, CheckIcon, ClockIcon, AlertIcon } from '@/components/icons/Icons';
import type { NormalisedAssignment } from '@/pages/MembersTask';

// ─── Types ────────────────────────────────────────────────────────────────────

interface NormalisedTask {
  id:             string;
  title:          string;
  description:    string;
  status:         string;
  priority:       string;
  estimatedHours: number;
  startDate:      string;
  dueDate:        string;
}

interface AssignTasksPanelProps {
  open:        boolean;
  worker:      { id: string; name: string; dailyCapacityHours: number };
  assignments: NormalisedAssignment[];   // all assignments from parent
  allTasks:    NormalisedTask[];         // all tasks from parent
  onClose:     () => void;
  onAssign:    (taskId: string, assigned: boolean) => Promise<void>;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high:     'bg-orange-500/15 text-orange-400',
  medium:   'bg-warning/15 text-warning',
  low:      'bg-secondary text-muted-foreground',
};

const STATUS_STYLES: Record<string, string> = {
  done:        'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  review:      'bg-primary/15 text-primary',
  todo:        'bg-secondary text-muted-foreground',
  backlog:     'bg-secondary text-muted-foreground',
};

const inputCls =
  'flex h-9 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Component ────────────────────────────────────────────────────────────────

export default function AssignTasksPanel({
  open,
  worker,
  assignments,
  allTasks,
  onClose,
  onAssign,
}: AssignTasksPanelProps) {
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [pending,        setPending]        = useState<Set<string>>(new Set()); // task IDs awaiting API

  // Reset filters when worker changes
  useEffect(() => {
    setSearch('');
    setPriorityFilter('all');
    setStatusFilter('all');
  }, [worker.id]);

  // Derive which tasks are assigned to this worker from live assignments prop
  const assignedTaskIds = useMemo(
    () => new Set(assignments.filter(a => a.workerId === worker.id).map(a => a.taskId)),
    [assignments, worker.id]
  );

  // Capacity calculations
  const assignedTasks   = allTasks.filter(t => assignedTaskIds.has(t.id));
  const assignedHours   = assignedTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const assignedCount   = assignedTaskIds.size;
  const capacityHours   = worker.dailyCapacityHours * 5;
  const capacityPct     = Math.min(100, Math.round((assignedHours / capacityHours) * 100));

  const filtered = useMemo(() => {
    let list = allTasks.filter(t => t.status !== 'done');
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
    if (statusFilter   !== 'all') list = list.filter(t => t.status   === statusFilter);
    // Assigned tasks float to top
    list.sort((a, b) => {
      const aA = assignedTaskIds.has(a.id) ? 0 : 1;
      const bA = assignedTaskIds.has(b.id) ? 0 : 1;
      return aA - bA;
    });
    return list;
  }, [search, priorityFilter, statusFilter, assignedTaskIds, allTasks]);

  async function toggleAssign(taskId: string) {
    if (pending.has(taskId)) return; // debounce while API in-flight
    const nowAssigned = !assignedTaskIds.has(taskId);
    setPending(prev => new Set(prev).add(taskId));
    try {
      await onAssign(taskId, nowAssigned);
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    }
  }

  function clearFilters() {
    setSearch('');
    setPriorityFilter('all');
    setStatusFilter('all');
  }

  const hasFilters = search || priorityFilter !== 'all' || statusFilter !== 'all';

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-background border-l border-border shadow-2xl animate-slide-in-right">

        {/* Header */}
        <div className="flex items-start justify-between px-5 py-4 border-b border-border/50 shrink-0">
          <div>
            <h2 className="text-base font-semibold text-foreground">Assign Tasks</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{worker.name}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors mt-0.5"
          >
            <XIcon size={16} />
          </button>
        </div>

        {/* Capacity bar */}
        <div className="px-5 py-3 border-b border-border/50 bg-secondary/20 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Weekly Capacity</span>
            <span className="text-[11px] text-muted-foreground">{assignedHours}h / {capacityHours}h</span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                capacityPct > 90 ? 'bg-destructive' : capacityPct > 70 ? 'bg-warning' : 'bg-success'
              }`}
              style={{ width: `${capacityPct}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <span className={`text-[11px] font-medium ${
              capacityPct > 90 ? 'text-destructive' : capacityPct > 70 ? 'text-warning' : 'text-success'
            }`}>
              {capacityPct}% allocated
            </span>
            <span className="text-[11px] text-muted-foreground">
              {assignedCount} task{assignedCount !== 1 ? 's' : ''} assigned
            </span>
          </div>
          {capacityPct > 90 && (
            <div className="flex items-center gap-1.5 mt-2 text-[11px] text-destructive bg-destructive/10 rounded-lg px-3 py-1.5">
              <AlertIcon size={12} />
              Worker is near or over capacity
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="px-5 py-3 border-b border-border/50 space-y-2 shrink-0">
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2">
            <SearchIcon size={13} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
            {search && (
              <button onClick={() => setSearch('')} className="text-muted-foreground hover:text-foreground">
                <XIcon size={12} />
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={inputCls + ' flex-1'}>
              <option value="all">All priorities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls + ' flex-1'}>
              <option value="all">All statuses</option>
              <option value="in_progress">In Progress</option>
              <option value="review">Review</option>
              <option value="todo">To Do</option>
              <option value="backlog">Backlog</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-muted-foreground">
              {filtered.length} task{filtered.length !== 1 ? 's' : ''}
            </span>
            {hasFilters && (
              <button onClick={clearFilters} className="text-[11px] text-primary hover:text-primary/70 transition-colors">
                Clear filters
              </button>
            )}
          </div>
        </div>

        {/* Task list */}
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center px-5">
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
                <ClockIcon size={16} className="text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground">No tasks match your filters</p>
              <button onClick={clearFilters} className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors">
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {filtered.map(task => {
                const isAssigned = assignedTaskIds.has(task.id);
                const isPending  = pending.has(task.id);
                return (
                  <div
                    key={task.id}
                    className={`px-5 py-4 transition-colors hover:bg-secondary/20 ${
                      isAssigned ? 'bg-primary/5 border-l-2 border-l-primary' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Assign toggle */}
                      <button
                        onClick={() => toggleAssign(task.id)}
                        disabled={isPending}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                          ${isPending
                            ? 'opacity-50 cursor-wait border-border'
                            : isAssigned
                              ? 'bg-primary border-primary'
                              : 'bg-transparent border-border hover:border-primary/50'
                          }`}
                        title={isAssigned ? 'Unassign task' : 'Assign task'}
                      >
                        {isPending
                          ? <div className="w-2.5 h-2.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                          : isAssigned
                            ? <CheckIcon size={11} className="text-primary-foreground" />
                            : null
                        }
                      </button>

                      {/* Task info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{task.description}</p>
                        )}
                        <div className="flex items-center flex-wrap gap-1.5 mt-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status] ?? ''}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <ClockIcon size={10} />{task.estimatedHours}h
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground">Due {task.dueDate}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-border/50 shrink-0 flex items-center justify-between gap-3">
          <p className="text-[11px] text-muted-foreground">
            {assignedCount} task{assignedCount !== 1 ? 's' : ''} assigned · {assignedHours}h total
          </p>
          <button
            onClick={onClose}
            className="text-sm px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            Done
          </button>
        </div>

      </div>
    </>
  );
}