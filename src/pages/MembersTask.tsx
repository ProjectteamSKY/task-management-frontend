import { useState, useEffect, useCallback } from 'react';
import { taskService } from '@/services/taskService';
import { assignmentService } from '@/services/taskassignmentService';
import { workerService, type NormalisedWorker } from '@/services/workerService';
import { createScheduleSlot, deleteScheduleSlot } from '@/services/scheduleService';
import {
  workerAvailabilityService,
} from '@/services/workerAvailability';
import { ClockIcon, AlertIcon, CheckIcon, ChevronDownIcon } from '@/components/icons/Icons';
import AssignTasksPanel, { type AssignSchedulePayload } from '@/components/workers/AssignTasksPanel';
import LeaveApprovalsDialog, { type LeaveWithWorker } from '@/modal/LeaveApproval';

// ─── Style maps ───────────────────────────────────────────────────────────────

const priorityStyles: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive border border-destructive/20',
  high:     'bg-warning/15 text-warning border border-warning/20',
  medium:   'bg-primary/15 text-primary border border-primary/20',
  low:      'bg-secondary text-muted-foreground border border-border',
};

const statusStyles: Record<string, string> = {
  backlog:     'bg-muted text-muted-foreground',
  todo:        'bg-primary/15 text-primary',
  in_progress: 'bg-warning/15 text-warning',
  review:      'bg-purple-500/15 text-purple-400',
  done:        'bg-success/15 text-success',
};

// ─── Types ────────────────────────────────────────────────────────────────────

type Filter = 'all' | 'active' | 'atrisk';

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normaliseTask(t: any) {
  return {
    id:             String(t.id),
    title:          t.title,
    description:    t.description ?? '',
    status:         t.status,
    priority:       t.priority,
    estimatedHours: t.estimated_hours ?? 0,
    startDate:      t.start_date ?? '',
    dueDate:        t.end_date ?? '',
    task_type:      t.task_type ?? '',
    project_id:     t.project_id ?? null,
  };
}

export interface NormalisedAssignment {
  assignmentId:    number;
  taskId:          string;
  workerId:        string;
  allocatedHours:  number;
  scheduleSlotId?: string;
  date?:           string;
  startTime?:      string;
  endTime?:        string;
  durationUnits?:  number;
}

function normaliseAssignment(a: any): NormalisedAssignment {
  const trimTime = (t: string | null | undefined) =>
    t ? t.slice(0, 5) : undefined;
  return {
    assignmentId:   a.id ?? a.assignment_id,
    taskId:         String(a.task_id ?? a.task?.id),
    workerId:       String(a.worker_id ?? a.worker?.id),
    allocatedHours: a.allocated_hours ?? 0,
    scheduleSlotId: a.schedule_slot_id ? String(a.schedule_slot_id) : undefined,
    date:           a.start_date   ?? undefined,
    startTime:      trimTime(a.start_time),
    endTime:        trimTime(a.end_time),
    durationUnits:  a.duration_units ?? undefined,
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MembersTask() {
  const [filter,        setFilter]        = useState<Filter>('all');
  const [focusedWorker, setFocusedWorker] = useState<string | null>(null);
  const [expanded,      setExpanded]      = useState<Record<string, boolean>>({});

  const [workers,        setWorkers]        = useState<NormalisedWorker[]>([]);
  const [workersLoading, setWorkersLoading] = useState(true);
  const [workersError,   setWorkersError]   = useState<string | null>(null);

  const [localTasks,   setLocalTasks]   = useState<ReturnType<typeof normaliseTask>[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError,   setTasksError]   = useState<string | null>(null);

  const [assignments,        setAssignments]        = useState<NormalisedAssignment[]>([]);
  const [assignmentsLoading, setAssignmentsLoading] = useState(true);

  // Leave approval state
  const [allLeaves,     setAllLeaves]     = useState<LeaveWithWorker[]>([]);
  const [leavesLoading, setLeavesLoading] = useState(false);
  const [approvingId,   setApprovingId]   = useState<number | null>(null);
  const [approvalsOpen, setApprovalsOpen] = useState(false);

  const [panelOpen,     setPanelOpen]     = useState(false);
  const [panelWorkerId, setPanelWorkerId] = useState<string | null>(null);

  const [reassigning, setReassigning] = useState<{
    taskId: string; fromWorkerId: string; picked: string | null;
  } | null>(null);

  // ── Data fetching ──────────────────────────────────────────────────────────

  useEffect(() => {
    setWorkersLoading(true);
    workerService.getWorkers()
      .then(data => {
        setWorkers(data);
        setExpanded(Object.fromEntries(data.map((w: NormalisedWorker) => [w.id, true])));
        setWorkersError(null);
      })
      .catch((err: Error) => setWorkersError(err.message))
      .finally(() => setWorkersLoading(false));
  }, []);

  useEffect(() => {
    setTasksLoading(true);
    taskService.getTasks()
      .then((data: any[]) => { setLocalTasks(data.map(normaliseTask)); setTasksError(null); })
      .catch((err: Error) => setTasksError(err.message))
      .finally(() => setTasksLoading(false));
  }, []);

  useEffect(() => {
    setAssignmentsLoading(true);
    assignmentService.getAssignments()
      .then((data: any[]) => setAssignments(data.map(normaliseAssignment)))
      .catch(() => setAssignments([]))
      .finally(() => setAssignmentsLoading(false));
  }, []);

  // ── Single global fetch for all leaves — no per-worker loop ───────────────
  const fetchAllLeaves = useCallback(async (workerList: NormalisedWorker[]) => {
    if (workerList.length === 0) return;
    setLeavesLoading(true);
    try {
      const leaves = await workerAvailabilityService.getAllLeaves(); // GET /leaves — one call
      const merged: LeaveWithWorker[] = leaves.map(l => {
        const worker = workerList.find(w => Number(w.id) === l.worker_id);
        return {
          ...l,
          workerName:   worker?.name   ?? l.worker_name ?? 'Unknown',
          workerAvatar: worker?.avatar ?? (worker?.name?.slice(0, 2).toUpperCase() ?? '??'),
        };
      });
      setAllLeaves(merged);
    } catch (err) {
      console.error('Failed to fetch leaves:', err);
      setAllLeaves([]);
    } finally {
      setLeavesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workers.length > 0) fetchAllLeaves(workers);
  }, [workers, fetchAllLeaves]);

  // ── Derived values ─────────────────────────────────────────────────────────

  const pendingLeaves = allLeaves.filter(
    l => !l.approval_status || l.approval_status === 'pending'
  );

  const getWorkerTasks = (wid: string) =>
    assignments
      .filter(a => a.workerId === wid)
      .map(a => localTasks.find(t => t.id === a.taskId))
      .filter(Boolean) as ReturnType<typeof normaliseTask>[];

  const unassignedTasks = localTasks.filter(
    t => !assignments.some(a => a.taskId === t.id)
  );

  const getWorkloadPct = (wid: string) => {
    const wt    = getWorkerTasks(wid);
    const total = wt.reduce((s, t) => s + t.estimatedHours, 0);
    const cap   = (workers.find(w => w.id === wid)?.dailyCapacityHours ?? 8) * 5;
    return Math.min(100, Math.round((total / cap) * 100));
  };

  const wlBarColor = (pct: number) =>
    pct >= 80 ? 'bg-destructive' : pct >= 60 ? 'bg-warning' : 'bg-success';

  const getDeadlineRisk = (task: ReturnType<typeof normaliseTask>, wid: string) => {
    if (!task.startDate || !task.dueDate) return 'low';
    const due   = new Date(task.dueDate);
    const start = new Date(task.startDate);
    const days  = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const cap   = (workers.find(w => w.id === wid)?.dailyCapacityHours ?? 8) * days;
    if (task.estimatedHours > cap)       return 'high';
    if (task.estimatedHours > cap * 0.8) return 'medium';
    return 'low';
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleChangeStatus = async (taskId: string, status: string) => {
    setLocalTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
    try {
      await taskService.updateTaskStatus(Number(taskId), status);
    } catch {
      taskService.getTasks()
        .then((data: any[]) => setLocalTasks(data.map(normaliseTask)))
        .catch(() => {});
    }
  };

  const handleApproveLeave = async (leave: LeaveWithWorker) => {
    setApprovingId(leave.id);
    try {
      await workerAvailabilityService.approveLeave(leave.worker_id, leave.id);
      setAllLeaves(prev =>
        prev.map(l =>
          l.id === leave.id && l.worker_id === leave.worker_id
            ? { ...l, approval_status: 'approved' }
            : l
        )
      );
    } catch (err) {
      console.error('Failed to approve leave:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handleRejectLeave = async (leave: LeaveWithWorker) => {
    setApprovingId(leave.id);
    try {
      await workerAvailabilityService.rejectLeave(leave.worker_id, leave.id);
      setAllLeaves(prev =>
        prev.map(l =>
          l.id === leave.id && l.worker_id === leave.worker_id
            ? { ...l, approval_status: 'rejected' }
            : l
        )
      );
    } catch (err) {
      console.error('Failed to reject leave:', err);
    } finally {
      setApprovingId(null);
    }
  };

  const handlePanelAssign = async (
    taskId: string,
    assigned: boolean,
    schedule?: AssignSchedulePayload,
  ) => {
    if (!panelWorkerId) return;

    if (assigned && schedule) {
      try {
        const created = await assignmentService.createAssignment({
          task_id:         Number(taskId),
          worker_id:       Number(panelWorkerId),
          allocated_hours: schedule.durationUnits / 2,
          status:          'pending',
          start_date:      schedule.date,
          end_date:        schedule.date,
          start_time:      schedule.startTime,
          end_time:        schedule.endTime,
          duration_units:  schedule.durationUnits,
        });
        const slot = await createScheduleSlot({
          worker_id:      Number(panelWorkerId),
          task_id:        Number(taskId),
          date:           schedule.date,
          start_time:     schedule.startTime,
          end_time:       schedule.endTime,
          duration_units: schedule.durationUnits,
          status:         'allocated',
        });
        setAssignments(prev => [
          ...prev,
          { ...normaliseAssignment(created), scheduleSlotId: slot.id },
        ]);
      } catch (err) {
        console.error('handlePanelAssign failed:', err);
      }
    } else if (!assigned) {
      const existing = assignments.find(
        a => a.taskId === taskId && a.workerId === panelWorkerId,
      );
      if (!existing) return;
      try {
        await assignmentService.deleteAssignment(existing.assignmentId);
        if (existing.scheduleSlotId) await deleteScheduleSlot(existing.scheduleSlotId);
        setAssignments(prev =>
          prev.filter(a => a.assignmentId !== existing.assignmentId),
        );
      } catch (err) {
        console.error('Failed to delete assignment/schedule slot:', err);
      }
    }
  };

  const handleRemove = async (taskId: string, workerId: string) => {
    const existing = assignments.find(a => a.taskId === taskId && a.workerId === workerId);
    if (!existing) return;
    setAssignments(prev => prev.filter(a => a.assignmentId !== existing.assignmentId));
    try {
      await assignmentService.deleteAssignment(existing.assignmentId);
      if (existing.scheduleSlotId) await deleteScheduleSlot(existing.scheduleSlotId);
    } catch {
      setAssignments(prev => [...prev, existing]);
    }
  };

  const handleConfirmReassign = async () => {
    if (!reassigning?.picked) return;
    const { taskId, fromWorkerId, picked } = reassigning;
    const existing = assignments.find(a => a.taskId === taskId && a.workerId === fromWorkerId);
    if (!existing) { setReassigning(null); return; }

    const task = localTasks.find(t => t.id === taskId);
    setAssignments(prev =>
      prev.map(a =>
        a.assignmentId === existing.assignmentId ? { ...a, workerId: picked } : a,
      ),
    );
    setReassigning(null);

    try {
      await assignmentService.deleteAssignment(existing.assignmentId);
      if (existing.scheduleSlotId) await deleteScheduleSlot(existing.scheduleSlotId);
      const created = await assignmentService.createAssignment({
        task_id:         Number(taskId),
        worker_id:       Number(picked),
        allocated_hours: task?.estimatedHours ?? 0,
        start_date:      new Date().toISOString().split('T')[0],
        end_date:        new Date().toISOString().split('T')[0],
        status:          'pending',
      });
      setAssignments(prev =>
        prev.map(a =>
          a.workerId === picked && a.taskId === taskId && a.assignmentId === existing.assignmentId
            ? normaliseAssignment(created)
            : a,
        ),
      );
    } catch {
      setAssignments(prev =>
        prev.map(a =>
          a.workerId === picked && a.taskId === taskId
            ? { ...a, workerId: fromWorkerId, assignmentId: existing.assignmentId }
            : a,
        ),
      );
    }
  };

  // ── Visibility ─────────────────────────────────────────────────────────────

  let visibleWorkers = workers;
  if (focusedWorker) {
    visibleWorkers = workers.filter(w => w.id === focusedWorker);
  } else if (filter === 'active') {
    visibleWorkers = workers.filter(w => w.status === 'active');
  } else if (filter === 'atrisk') {
    visibleWorkers = workers.filter(w =>
      getWorkerTasks(w.id).some(t => getDeadlineRisk(t, w.id) === 'high'),
    );
  }

  const panelWorker = workers.find(w => w.id === panelWorkerId);
  const isLoading   = workersLoading || tasksLoading || assignmentsLoading;

  // ── Loading / error states ─────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      </div>
    );
  }

  const anyError = workersError || tasksError;
  if (anyError) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-64px)]">
        <div className="flex flex-col items-center gap-3 text-center max-w-xs">
          <AlertIcon size={24} className="text-destructive" />
          <p className="text-sm font-medium text-foreground">Failed to load data</p>
          <p className="text-xs text-muted-foreground">{anyError}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-xs font-medium px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden animate-fade-in">

      {/* ── Header ── */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between shrink-0">
        <h1 className="text-base font-semibold text-foreground">Member Tasks</h1>

        <div className="flex items-center gap-2">
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

          {/* Approvals button */}
          <button
            onClick={() => setApprovalsOpen(true)}
            className="relative text-xs font-medium px-3 py-1.5 rounded-full border border-border bg-secondary text-foreground hover:bg-secondary/80 transition-colors"
          >
            Approvals
            {pendingLeaves.length > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 rounded-full bg-warning text-warning-foreground text-[9px] font-semibold flex items-center justify-center px-1">
                {pendingLeaves.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ── Leave Approvals Dialog ── */}
      <LeaveApprovalsDialog
        open={approvalsOpen}
        onOpenChange={setApprovalsOpen}
        pendingLeaves={pendingLeaves}
        leavesLoading={leavesLoading}
        approvingId={approvingId}
        onApprove={handleApproveLeave}
        onReject={handleRejectLeave}
      />

      {/* ── Worker avatar strip ── */}
      <div className="px-6 py-3 border-b border-border shrink-0">
        <div className="flex items-center justify-evenly w-full">
          <button
            onClick={() => setFocusedWorker(null)}
            className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl border transition-colors flex-1
              ${!focusedWorker ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:bg-secondary/60'}`}
          >
            <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-[11px] font-semibold text-muted-foreground">All</div>
            <span className="text-[10px] font-medium text-foreground">All</span>
            <span className="text-[10px] text-muted-foreground">{workers.length}</span>
          </button>

          {workers.map(w => {
            const wt        = getWorkerTasks(w.id);
            const pct       = getWorkloadPct(w.id);
            const isFocused = focusedWorker === w.id;
            return (
              <button
                key={w.id}
                onClick={() => setFocusedWorker(isFocused ? null : w.id)}
                className={`flex flex-col items-center gap-1 px-1.5 py-1.5 rounded-xl border transition-colors flex-1
                  ${isFocused ? 'border-primary/40 bg-primary/10' : 'border-transparent hover:bg-secondary/60'}`}
              >
                <div className="relative">
                  {wt.length > 0 && (
                    <span className={`absolute -top-1 -right-1.5 min-w-[17px] h-[17px] rounded-full border border-background
                      flex items-center justify-center text-[9px] font-semibold px-0.5
                      ${pct >= 80 ? 'bg-destructive text-destructive-foreground' : pct >= 60 ? 'bg-warning text-warning-foreground' : 'bg-primary text-primary-foreground'}`}
                    >
                      {wt.length}
                    </span>
                  )}
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-[13px] font-semibold text-primary">
                    {w.avatar}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background
                    ${w.status === 'active' ? 'bg-success' : 'bg-warning'}`}
                  />
                </div>
                <span className="text-[11px] font-medium text-foreground truncate max-w-full">
                  {w.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Worker cards ── */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-6 space-y-3">
        {visibleWorkers.map(w => {
          const wt           = getWorkerTasks(w.id);
          const atRisk       = wt.filter(t => getDeadlineRisk(t, w.id) === 'high').length;
          const totalHrs     = wt.reduce((s, t) => s + t.estimatedHours, 0);
          const pct          = getWorkloadPct(w.id);
          const isExpanded   = expanded[w.id] ?? true;
          const otherWorkers = workers.filter(x => x.id !== w.id && x.status === 'active');

          return (
            <div key={w.id} className="rounded-xl border border-border overflow-hidden bg-secondary/5">

              {/* Worker header row */}
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
                      <span className="text-[10px] bg-warning/15 text-warning px-2 py-0.5 rounded-full font-medium">{w.status}</span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">{w.role} · {w.department}</p>
                </div>
                <div className="flex items-center gap-2.5 shrink-0">
                  <span className="text-[11px] bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">{wt.length} tasks</span>
                  <span className="text-[11px] text-muted-foreground px-2 py-1 rounded-full bg-secondary">
                    <ClockIcon size={11} className="inline mr-0.5" />{totalHrs}h
                  </span>
                  {atRisk > 0 ? (
                    <span className="text-[11px] bg-destructive/10 text-destructive px-2.5 py-1 rounded-full font-medium border border-destructive/20">
                      <AlertIcon size={10} className="inline mr-0.5" />{atRisk} at risk
                    </span>
                  ) : (
                    <span className="text-[11px] bg-success/10 text-success px-2.5 py-1 rounded-full">
                      <CheckIcon size={10} className="inline mr-0.5" />No Risk
                    </span>
                  )}
                  <div className="flex items-center gap-1.5">
                    <div className="w-16 h-1.5 rounded-full bg-border overflow-hidden">
                      <div className={`h-full rounded-full ${wlBarColor(pct)}`} style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[11px] text-muted-foreground w-7">{pct}%</span>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); setPanelWorkerId(w.id); setPanelOpen(true); }}
                    className="text-[11px] font-medium px-3 py-1.5 rounded-lg border border-primary bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    + Assign
                  </button>
                  <ChevronDownIcon
                    size={14}
                    className={`text-muted-foreground transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                  />
                </div>
              </div>

              {/* Task rows */}
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
                      <div className="grid grid-cols-[2fr_110px_100px_70px_90px_200px] gap-2 px-5 py-2 border-b border-border">
                        {['Task', 'Status', 'Priority', 'Hours', 'Risk', 'Actions'].map(h => (
                          <p key={h} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</p>
                        ))}
                      </div>

                      {wt.map(task => {
                        const risk           = getDeadlineRisk(task, w.id);
                        const isThisReassign = reassigning?.taskId === task.id && reassigning.fromWorkerId === w.id;
                        const slot           = assignments.find(a => a.taskId === task.id && a.workerId === w.id);

                        return (
                          <div key={task.id}>
                            <div className="grid grid-cols-[2fr_110px_100px_70px_90px_200px] gap-2 px-5 py-3 border-b border-border items-center hover:bg-secondary/20 transition-colors">
                              <div>
                                <p className="text-sm font-medium text-foreground">{task.title}</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                  {task.dueDate ? `Due ${task.dueDate}` : 'No due date'}
                                </p>
                                {slot?.date && slot?.startTime ? (
                                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-primary bg-primary/8 rounded px-1.5 py-0.5 w-fit">
                                    <ClockIcon size={9} />
                                    <span className="font-medium">{slot.date}</span>
                                    <span className="opacity-50">·</span>
                                    <span>{slot.startTime}{slot.endTime ? ` → ${slot.endTime}` : ''}</span>
                                  </div>
                                ) : slot && !slot.date ? (
                                  <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                                    <ClockIcon size={9} /><span>No schedule set</span>
                                  </div>
                                ) : null}
                              </div>

                              <select
                                value={task.status}
                                onChange={e => handleChangeStatus(task.id, e.target.value)}
                                onClick={e => e.stopPropagation()}
                                className={`text-[11px] font-medium px-2 py-1 rounded-full border-0 cursor-pointer outline-none w-fit ${statusStyles[task.status] ?? ''}`}
                              >
                                {['todo', 'in_progress', 'review', 'done', 'backlog'].map(s => (
                                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                                ))}
                              </select>

                              <span className={`text-[11px] font-medium px-2 py-1 rounded-full w-fit ${priorityStyles[task.priority] ?? ''}`}>
                                {task.priority}
                              </span>

                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <ClockIcon size={12} /><span>{task.estimatedHours}h</span>
                              </div>

                              {risk === 'high' ? (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-destructive/10 text-destructive border border-destructive/20 flex items-center gap-1">
                                  <AlertIcon size={10} />high
                                </span>
                              ) : risk === 'medium' ? (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-warning/10 text-warning border border-warning/20">watch</span>
                              ) : (
                                <span className="text-[11px] font-medium px-2 py-1 rounded-full w-fit bg-success/10 text-success border border-success/20 flex items-center gap-1">
                                  <CheckIcon size={10} />ok
                                </span>
                              )}

                              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                                <button
                                  onClick={() => setReassigning(isThisReassign ? null : { taskId: task.id, fromWorkerId: w.id, picked: null })}
                                  className={`text-[10px] font-medium px-2.5 py-1.5 rounded-lg transition-colors
                                    ${isThisReassign ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground hover:text-foreground'}`}
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

                            {/* Reassign panel */}
                            {isThisReassign && (
                              <div className="px-5 py-4 border-b border-border bg-secondary/30">
                                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium mb-3">Reassign to</p>
                                <div className="grid grid-cols-4 gap-2 mb-3">
                                  {otherWorkers.map(ow => {
                                    const op = getWorkloadPct(ow.id);
                                    return (
                                      <button
                                        key={ow.id}
                                        onClick={() => setReassigning(prev => prev ? { ...prev, picked: ow.id } : null)}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border text-center transition-colors
                                          ${reassigning?.picked === ow.id ? 'border-primary bg-primary/10' : 'border-border bg-secondary/30 hover:border-border/60'}`}
                                      >
                                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold">{ow.avatar}</div>
                                        <p className="text-[11px] font-medium text-foreground">{ow.name.split(' ')[0]}</p>
                                        <p className="text-[10px] text-muted-foreground">{ow.role.split(' ')[0]}</p>
                                        <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                                          <div className={`h-full rounded-full ${wlBarColor(op)}`} style={{ width: `${op}%` }} />
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
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Footer ── */}
      <div className="px-6 py-3 border-t border-border bg-secondary/20 shrink-0 flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          <span className="text-foreground font-medium">{workers.length} workers</span>
          {' '}· {localTasks.length} total tasks
        </span>
        {unassignedTasks.length > 0 && (
          <span className="text-warning">⚠ {unassignedTasks.length} unassigned</span>
        )}
        {pendingLeaves.length > 0 && (
          <span
            className="text-warning cursor-pointer hover:underline"
            onClick={() => setApprovalsOpen(true)}
          >
            📋 {pendingLeaves.length} leave{pendingLeaves.length > 1 ? 's' : ''} pending
          </span>
        )}
        <span className="ml-auto">
          {visibleWorkers.filter(w =>
            getWorkerTasks(w.id).some(t => getDeadlineRisk(t, w.id) === 'high'),
          ).length} workers with at-risk tasks
        </span>
      </div>

      {/* ── Assign panel ── */}
      {panelWorker && (
        <AssignTasksPanel
          open={panelOpen}
          worker={panelWorker}
          workers={workers.map(w => ({ id: w.id, name: w.name }))}
          assignments={assignments}
          allTasks={localTasks}
          onClose={() => { setPanelOpen(false); setPanelWorkerId(null); }}
          onAssign={handlePanelAssign}
        />
      )}
    </div>
  );
}