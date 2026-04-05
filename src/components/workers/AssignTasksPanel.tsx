import { useState, useMemo, useEffect } from 'react';
import { SearchIcon, XIcon, CheckIcon, ClockIcon, AlertIcon } from '@/components/icons/Icons';
import type { NormalisedAssignment } from '@/pages/MembersTask';

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

export interface AssignSchedulePayload {
  date:          string;
  startTime:     string;
  endTime:       string;
  durationUnits: number;
}

interface AssignTasksPanelProps {
  open:        boolean;
  worker:      { id: string; name: string; dailyCapacityHours: number };
  workers?:    { id: string; name: string }[];   // all workers — for showing assignee names
  assignments: NormalisedAssignment[];
  allTasks:    NormalisedTask[];
  onClose:     () => void;
  onAssign:    (taskId: string, assigned: boolean, schedule?: AssignSchedulePayload) => Promise<void>;
}

const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 22; h++) {
  TIME_SLOTS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 22) TIME_SLOTS.push(`${String(h).padStart(2, '0')}:30`);
}

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
  'flex h-8 rounded-md border border-input bg-background px-2.5 py-1.5 text-xs text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2';

function toMinutes(t: string) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function calcDurationUnits(start: string, end: string): number {
  return Math.max(0, Math.round((toMinutes(end) - toMinutes(start)) / 30));
}

function formatDuration(units: number): string {
  if (units <= 0) return '—';
  const totalMins = units * 30;
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h === 0) return `${m}m`;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

// ── Schedule Picker Modal ─────────────────────────────────────────────────────

function SchedulePickerModal({
  task,
  maxDurationUnits,
  onConfirm,
  onCancel,
}: {
  task:             NormalisedTask;
  maxDurationUnits: number;       // cap — remaining allocatable units
  onConfirm:        (payload: AssignSchedulePayload) => void;
  onCancel:         () => void;
}) {
  const today = new Date().toISOString().split('T')[0];

  const [date,      setDate]      = useState(task.startDate || today);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime,   setEndTime]   = useState('10:00');
  const [error,     setError]     = useState('');

  const durationUnits = calcDurationUnits(startTime, endTime);
  const durationLabel = formatDuration(durationUnits);
  const maxLabel      = formatDuration(maxDurationUnits);
  const exceedsCap    = maxDurationUnits > 0 && durationUnits > maxDurationUnits;

  function handleStartChange(val: string) {
    setStartTime(val);
    setError('');
    if (toMinutes(endTime) <= toMinutes(val)) {
      const idx  = TIME_SLOTS.indexOf(val);
      const next = TIME_SLOTS[idx + 1] ?? val;
      setEndTime(next);
    }
  }

  function handleConfirm() {
    if (!date)              { setError('Please select a date.');              return; }
    if (durationUnits <= 0) { setError('End time must be after start time.'); return; }
    if (exceedsCap)         { setError(`Max assignable is ${maxLabel}.`);     return; }
    const payload: AssignSchedulePayload = { date, startTime, endTime, durationUnits };
    console.log('📅 SchedulePickerModal confirmed payload:', payload);
    onConfirm(payload);
  }

  // Filter end times to not exceed the remaining cap
  const endTimeOptions = TIME_SLOTS.filter(t => {
    if (toMinutes(t) <= toMinutes(startTime)) return false;
    if (maxDurationUnits > 0) {
      const units = calcDurationUnits(startTime, t);
      return units <= maxDurationUnits;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-[calc(100%-48px)] max-w-[300px] bg-background border border-border rounded-xl shadow-2xl p-3.5">

        <h3 className="text-[13px] font-semibold text-foreground mb-0.5">Schedule slot</h3>
        <p className="text-[11px] text-muted-foreground mb-2.5 truncate" title={task.title}>
          {task.title}
        </p>

        {/* Remaining hours banner */}
        {maxDurationUnits > 0 && maxDurationUnits < task.estimatedHours * 2 && (
          <div className="flex items-center gap-1.5 text-[11px] text-warning bg-warning/10 rounded-md px-2.5 py-1.5 mb-2.5">
            <AlertIcon size={11} />
            Only <span className="font-semibold mx-0.5">{maxLabel}</span> remaining for this task
          </div>
        )}

        {task.estimatedHours > 0 && (
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground bg-secondary rounded-md px-2.5 py-1.5 mb-2.5">
            <ClockIcon size={11} />
            Estimated: <span className="font-medium text-foreground ml-1">{task.estimatedHours}h</span>
            {maxDurationUnits > 0 && (
              <span className="ml-auto text-warning font-medium">{maxLabel} left</span>
            )}
          </div>
        )}

        <div className="space-y-2">
          <div>
            <label className="block text-[11px] font-medium text-muted-foreground mb-1">
              Date <span className="text-destructive">*</span>
            </label>
            <input
              type="date"
              value={date}
              min={today}
              onChange={e => { setDate(e.target.value); setError(''); }}
              className={inputCls + ' w-full'}
            />
            {(task.startDate || task.dueDate) && (
              <p className="text-[10px] text-muted-foreground mt-1">
                Task window: {task.startDate || '—'} → {task.dueDate || '—'}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                Start <span className="text-destructive">*</span>
              </label>
              <select
                value={startTime}
                onChange={e => handleStartChange(e.target.value)}
                className={inputCls + ' w-full'}
              >
                {TIME_SLOTS.filter((_, i) => i < TIME_SLOTS.length - 1).map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-medium text-muted-foreground mb-1">
                End <span className="text-destructive">*</span>
              </label>
              <select
                value={endTime}
                onChange={e => { setEndTime(e.target.value); setError(''); }}
                className={inputCls + ' w-full'}
              >
                {endTimeOptions.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className={`flex items-center justify-between text-[11px] rounded-md px-2.5 py-1.5 ${
            exceedsCap
              ? 'bg-destructive/10 text-destructive'
              : durationUnits > 0
                ? 'bg-primary/10 text-primary'
                : 'bg-secondary text-muted-foreground'
          }`}>
            <span>Duration</span>
            <span className="font-semibold">{durationLabel} · {durationUnits} unit{durationUnits !== 1 ? 's' : ''}</span>
          </div>

          {exceedsCap && (
            <div className="flex items-center gap-1.5 text-[11px] text-destructive bg-destructive/10 rounded-md px-2.5 py-1.5">
              <AlertIcon size={11} />
              Exceeds remaining {maxLabel} for this task
            </div>
          )}

          {!exceedsCap && task.estimatedHours > 0 && durationUnits / 2 > task.estimatedHours && (
            <div className="flex items-center gap-1.5 text-[11px] text-warning bg-warning/10 rounded-md px-2.5 py-1.5">
              <AlertIcon size={11} />
              Slot exceeds estimated {task.estimatedHours}h
            </div>
          )}
        </div>

        {error && (
          <p className="text-[11px] text-destructive mt-2 flex items-center gap-1">
            <AlertIcon size={11} /> {error}
          </p>
        )}

        <div className="flex gap-2 mt-3">
          <button
            onClick={onCancel}
            className="flex-1 h-8 rounded-lg border border-border text-xs text-muted-foreground hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={exceedsCap}
            className="flex-1 h-8 rounded-lg gradient-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Assign &amp; Schedule
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function AssignTasksPanel({
  open,
  worker,
  workers = [],
  assignments,
  allTasks,
  onClose,
  onAssign,
}: AssignTasksPanelProps) {
  const [search,         setSearch]         = useState('');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [pending,        setPending]        = useState<Set<string>>(new Set());
  const [pickerTask,     setPickerTask]     = useState<NormalisedTask | null>(null);

  useEffect(() => {
    setSearch('');
    setPriorityFilter('all');
    setStatusFilter('all');
    setPickerTask(null);
  }, [worker.id]);

  const assignedTaskIds = useMemo(
    () => new Set(assignments.filter(a => a.workerId === worker.id).map(a => a.taskId)),
    [assignments, worker.id],
  );

  const assignedTasks  = allTasks.filter(t => assignedTaskIds.has(t.id));
  const assignedHours  = assignedTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const assignedCount  = assignedTaskIds.size;
  const capacityHours  = worker.dailyCapacityHours * 5;
  const capacityPct    = Math.min(100, Math.round((assignedHours / capacityHours) * 100));

  // Build a worker id → name map for quick lookup
  const workerNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    workers.forEach(w => { map[w.id] = w.name; });
    return map;
  }, [workers]);

  // For a given task, get all OTHER workers it's already assigned to + their allocated hours
function getExistingAssignees(taskId: string) {
  return assignments
    .filter(a => a.taskId === taskId && a.workerId !== worker.id)
    .map(a => ({
      workerId:       a.workerId,
      workerName:     workerNameMap[a.workerId] ?? `Unknown (${a.workerId})`, // 👈 better fallback
      allocatedHours: (a as any).allocatedHours ?? 0,
    }));
}

  // Remaining hours for a task = estimatedHours - sum of all other workers' allocatedHours
  function getRemainingUnits(task: NormalisedTask): number {
    const otherAllocated = assignments
      .filter(a => a.taskId === task.id && a.workerId !== worker.id)
      .reduce((sum, a) => sum + ((a as any).allocatedHours ?? 0), 0);
    const remaining = task.estimatedHours - otherAllocated;
    return Math.max(0, Math.round(remaining * 2)); // convert hours → 30-min units
  }

const filtered = useMemo(() => {
  let list = allTasks.filter(t => {
    if (t.status === 'done') return false;
    if (assignedTaskIds.has(t.id)) return false; // already assigned to this worker

    // Also hide tasks fully allocated by other workers
    if (t.estimatedHours > 0) {
      const otherAllocated = assignments
        .filter(a => a.taskId === t.id && a.workerId !== worker.id)
        .reduce((sum, a) => sum + ((a as any).allocatedHours ?? 0), 0);
      const remainingUnits = Math.max(0, Math.round((t.estimatedHours - otherAllocated) * 2));
      if (remainingUnits === 0) return false;
    }

    return true;
  });

  if (search.trim()) {
    const q = search.toLowerCase();
    list = list.filter(t =>
      t.title.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q),
    );
  }
  if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
  if (statusFilter   !== 'all') list = list.filter(t => t.status   === statusFilter);
  return list;
}, [search, priorityFilter, statusFilter, assignedTaskIds, allTasks, assignments, worker.id]);

  function handleToggleClick(task: NormalisedTask) {
    console.log('🖱️ handleToggleClick fired', { taskId: task.id, isAssigned: assignedTaskIds.has(task.id) });
    if (pending.has(task.id)) return;
    if (assignedTaskIds.has(task.id)) {
      doAssign(task.id, false);
    } else {
      setPickerTask(task);
    }
  }

  async function doAssign(taskId: string, assigned: boolean, schedule?: AssignSchedulePayload) {
    console.log('🔥 doAssign called', { taskId, assigned, schedule });
    setPending(prev => new Set(prev).add(taskId));
    try {
      await onAssign(taskId, assigned, schedule);
    } finally {
      setPending(prev => { const n = new Set(prev); n.delete(taskId); return n; });
    }
  }

  async function handlePickerConfirm(payload: AssignSchedulePayload) {
    console.log('✅ handlePickerConfirm called', payload);
    if (!pickerTask) return;
    const taskId = pickerTask.id;
    setPickerTask(null);
    await doAssign(taskId, true, payload);
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
      <div
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 z-50 flex flex-col w-full max-w-md bg-background border-l border-border shadow-2xl animate-slide-in-right">

        {pickerTask && (
          <SchedulePickerModal
            task={pickerTask}
            maxDurationUnits={getRemainingUnits(pickerTask)}
            onConfirm={handlePickerConfirm}
            onCancel={() => setPickerTask(null)}
          />
        )}

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
                const isAssigned  = assignedTaskIds.has(task.id);
                const isPending   = pending.has(task.id);
                const existingAssignees = getExistingAssignees(task.id);
                const remainingUnits    = getRemainingUnits(task);
                const remainingHours    = remainingUnits / 2;
                const fullyAllocated    = task.estimatedHours > 0 && remainingUnits === 0 && !isAssigned;

                const slot = assignments.find(
                  a => a.taskId === task.id && a.workerId === worker.id,
                ) as (NormalisedAssignment & {
                  date?: string; startTime?: string; endTime?: string; durationUnits?: number;
                }) | undefined;

                return (
                  <div
                    key={task.id}
                    className={`px-5 py-4 transition-colors hover:bg-secondary/20 ${
                      isAssigned ? 'bg-primary/5 border-l-2 border-l-primary' :
                      fullyAllocated ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <button
                        onClick={() => !fullyAllocated && handleToggleClick(task)}
                        disabled={isPending || fullyAllocated}
                        className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors
                          ${isPending
                            ? 'opacity-50 cursor-wait border-border'
                            : fullyAllocated
                              ? 'opacity-30 cursor-not-allowed border-border'
                              : isAssigned
                                ? 'bg-primary border-primary'
                                : 'bg-transparent border-border hover:border-primary/50'
                          }`}
                        title={
                          fullyAllocated ? 'Fully allocated to other workers'
                          : isAssigned   ? 'Unassign task'
                          : 'Assign task + schedule slot'
                        }
                      >
                        {isPending
                          ? <div className="w-2.5 h-2.5 border border-muted-foreground border-t-transparent rounded-full animate-spin" />
                          : isAssigned
                            ? <CheckIcon size={11} className="text-primary-foreground" />
                            : null
                        }
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{task.title}</p>
                        {task.description && (
                          <p className="text-[11px] text-muted-foreground truncate mt-0.5">{task.description}</p>
                        )}

                        {/* Existing assignees */}
                        {existingAssignees.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {existingAssignees.map(a => (
                              <span
                                key={a.workerId}
                                className="flex items-center gap-1 text-[10px] bg-secondary text-muted-foreground rounded-full px-2 py-0.5"
                                title={`${a.workerName} — ${a.allocatedHours}h allocated`}
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[8px] font-bold shrink-0">
                                  {a.workerName.charAt(0)}
                                </span>
                                {a.workerName.split(' ')[0]}
                                <span className="text-muted-foreground/60">·</span>
                                {a.allocatedHours}h
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Remaining hours indicator */}
                        {!isAssigned && task.estimatedHours > 0 && existingAssignees.length > 0 && (
                          <div className={`flex items-center gap-1 mt-1.5 text-[10px] rounded px-1.5 py-0.5 w-fit ${
                            remainingUnits === 0
                              ? 'bg-destructive/10 text-destructive'
                              : 'bg-warning/10 text-warning'
                          }`}>
                            <ClockIcon size={9} />
                            {remainingUnits === 0
                              ? 'Fully allocated'
                              : `${remainingHours}h remaining`}
                          </div>
                        )}

                        <div className="flex items-center flex-wrap gap-1.5 mt-2">
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[task.priority] ?? ''}`}>
                            {task.priority}
                          </span>
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[task.status] ?? ''}`}>
                            {task.status.replace('_', ' ')}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                            <ClockIcon size={10} />{task.estimatedHours}h est.
                          </span>
                          {task.dueDate && (
                            <span className="text-[10px] text-muted-foreground">Due {task.dueDate}</span>
                          )}
                        </div>

                        {/* Scheduled slot for this worker */}
                        {isAssigned && slot?.date && slot?.startTime && (
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-primary bg-primary/10 rounded-md px-2 py-1 w-fit">
                            <ClockIcon size={9} />
                            <span className="font-medium">{slot.date}</span>
                            <span className="text-primary/60">·</span>
                            <span>{slot.startTime}{slot.endTime ? ` → ${slot.endTime}` : ''}</span>
                            {slot.durationUnits != null && (
                              <>
                                <span className="text-primary/60">·</span>
                                <span>{formatDuration(slot.durationUnits)}</span>
                              </>
                            )}
                          </div>
                        )}
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