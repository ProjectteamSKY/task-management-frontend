import { useState } from 'react';
import { workers, tasks, taskAssignments } from '@/data/mockData';
import { ClockIcon, AlertIcon, CheckIcon } from '@/components/icons/Icons';
import ReassignModal from './ReassignModal';
import SplitTaskModal from './SplitTaskModal';
import TaskHistoryChart from './TaskHistoryChart';
import TimeSlotGrid from './TimeSlotGrid';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkerCapability {
  capability: string;
  proficiency: 'beginner' | 'intermediate' | 'expert';
}

interface WorkerSpecialization {
  specialization: string;
}

interface WorkerPerformance {
  workerId: string;
  estimatedHours: number;
  actualHours: number;
}

interface TaskDependency {
  taskId: string;
  dependsOnTaskId: string;
  dependsOnTitle: string;
}

interface MultiWorkerInfo {
  taskId: string;
  totalWorkers: number;
  workerNames: string[];
}

type ActiveModal =
  | { type: 'reassign'; taskId: string; taskTitle: string; taskHours: number; capability: string }
  | { type: 'split';    taskId: string; taskTitle: string; taskHours: number; capability: string }
  | null;

type RightPanel = 'tasks' | 'history' | 'schedule';

// ─── Mock extended data ───────────────────────────────────────────────────────

const workerCapabilities: Record<string, WorkerCapability[]> = {
  w1: [
    { capability: 'Python', proficiency: 'expert' },
    { capability: 'API Development', proficiency: 'expert' },
    { capability: 'PostgreSQL', proficiency: 'intermediate' },
  ],
  w2: [
    { capability: 'Electrical Wiring', proficiency: 'expert' },
    { capability: 'Safety Inspection', proficiency: 'intermediate' },
  ],
  w3: [
    { capability: 'Software Testing', proficiency: 'expert' },
    { capability: 'Test Automation', proficiency: 'intermediate' },
    { capability: 'Bug Triage', proficiency: 'expert' },
  ],
};

const workerSpecializations: Record<string, WorkerSpecialization[]> = {
  w1: [{ specialization: 'backend' }, { specialization: 'api' }],
  w2: [{ specialization: 'electrical' }, { specialization: 'construction' }],
  w3: [{ specialization: 'qa' }, { specialization: 'automation' }],
};

const workerPerformance: Record<string, WorkerPerformance[]> = {
  w1: [
    { workerId: 'w1', estimatedHours: 8, actualHours: 7 },
    { workerId: 'w1', estimatedHours: 6, actualHours: 5 },
    { workerId: 'w1', estimatedHours: 10, actualHours: 9 },
  ],
  w2: [
    { workerId: 'w2', estimatedHours: 8, actualHours: 6 },
    { workerId: 'w2', estimatedHours: 12, actualHours: 10 },
  ],
  w3: [
    { workerId: 'w3', estimatedHours: 5, actualHours: 6 },
    { workerId: 'w3', estimatedHours: 8, actualHours: 8 },
  ],
};

const aiReasonings: Record<string, string[]> = {
  t1_w1: ['Backend capability match', 'Previous similar tasks (avg 8h)', 'Available capacity this week'],
  t2_w2: ['Electrical capability match', 'Certified for wiring work', 'No conflicting assignments'],
  t3_w3: ['QA specialization match', 'Above-average test coverage history', 'Low current workload'],
};

const taskDependencies: Record<string, TaskDependency[]> = {
  t2: [{ taskId: 't2', dependsOnTaskId: 't5', dependsOnTitle: 'Complete wall construction' }],
  t3: [{ taskId: 't3', dependsOnTaskId: 't1', dependsOnTitle: 'Fix login bug' }],
};

const multiWorkerTasks: Record<string, MultiWorkerInfo> = {
  t4: { taskId: 't4', totalWorkers: 3, workerNames: ['Ahmed', 'Sara', 'John'] },
};

const taskCapabilities: Record<string, string> = {
  t1: 'backend',
  t2: 'electrical',
  t3: 'qa',
  t4: 'construction',
};

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

const approvalStyles: Record<string, string> = {
  approved: 'bg-success/15 text-success border border-success/20',
  pending:  'bg-warning/15 text-warning border border-warning/20',
  rejected: 'bg-destructive/15 text-destructive border border-destructive/20',
};

const proficiencyStyles: Record<string, string> = {
  expert:       'bg-primary/20 text-primary border border-primary/25',
  intermediate: 'bg-secondary text-muted-foreground border border-border',
  beginner:     'bg-muted text-muted-foreground border border-border',
};

// ─── Helper functions ─────────────────────────────────────────────────────────

function getProductivityFactor(workerId: string): number | null {
  const history = workerPerformance[workerId];
  if (!history || history.length === 0) return null;
  const total = history.reduce(
    (acc, p) => ({ est: acc.est + p.estimatedHours, act: acc.act + p.actualHours }),
    { est: 0, act: 0 }
  );
  return Math.round((total.est / total.act) * 100) / 100;
}

function getWorkloadPct(worker: typeof workers[0], workerTasks: typeof tasks): number {
  const totalAllocated = workerTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const capacity = worker.dailyCapacityHours * 5;
  return Math.min(100, Math.round((totalAllocated / capacity) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function WorkloadBar({ pct }: { pct: number }) {
  const color = pct >= 80 ? 'bg-destructive' : pct >= 60 ? 'bg-warning' : 'bg-success';
  return (
    <div className="flex items-center gap-1.5 mt-1">
      <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[10px] font-medium tabular-nums
        ${pct >= 80 ? 'text-destructive' : pct >= 60 ? 'text-warning' : 'text-success'}`}>
        {pct}%
      </span>
    </div>
  );
}

function AIReasoningPanel({ reasons, confidence }: { reasons: string[]; confidence: number }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors group"
      >
        <span className={`text-[10px] font-medium
          ${confidence >= 85 ? 'text-success' : confidence >= 60 ? 'text-warning' : 'text-destructive'}`}>
          AI {confidence}%
        </span>
        <span style={{ display: 'inline-block', transform: open ? 'rotate(90deg)' : 'rotate(0deg)', transition: 'transform 150ms' }}>›</span>
      </button>
      {open && (
        <div className="mt-0.5 p-2 rounded-lg bg-secondary/40 border border-border space-y-1 animate-fade-in">
          {reasons.map((r, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[10px] text-muted-foreground">
              <span className="text-success mt-0.5 shrink-0">•</span>
              <span>{r}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DependencyBadge({ deps }: { deps: TaskDependency[] }) {
  const [open, setOpen] = useState(false);
  if (!deps || deps.length === 0) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
          bg-purple-500/15 text-purple-400 border border-purple-500/20 hover:bg-purple-500/25 transition-colors"
      >
        <span>⛓</span><span>{deps.length} dep{deps.length > 1 ? 's' : ''}</span>
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-10 w-52 p-2.5 rounded-xl bg-popover border border-border shadow-lg animate-fade-in">
          <p className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wider">Blocked by</p>
          {deps.map((d, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-0.5">
              <span className="text-destructive">⛔</span>
              <span className="truncate">{d.dependsOnTitle}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MultiWorkerBadge({ info }: { info: MultiWorkerInfo }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
          bg-blue-500/15 text-blue-400 border border-blue-500/20 hover:bg-blue-500/25 transition-colors"
      >
        <span>👥</span><span>+{info.totalWorkers} workers</span>
      </button>
      {open && (
        <div className="absolute top-6 left-0 z-10 w-48 p-2.5 rounded-xl bg-popover border border-border shadow-lg animate-fade-in">
          <p className="text-[10px] font-semibold text-foreground mb-1.5 uppercase tracking-wider">Shared with</p>
          {info.workerNames.map((name, i) => (
            <div key={i} className="flex items-center gap-1.5 text-[11px] text-muted-foreground py-0.5">
              <span className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium">
                {name[0]}
              </span>
              <span>{name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function MemberTasks() {
  const [selectedWorkerId, setSelectedWorkerId] = useState(workers[0]?.id ?? '');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [rightPanel, setRightPanel] = useState<RightPanel>('tasks');

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);
  const workerAssignments = taskAssignments.filter(a => a.workerId === selectedWorkerId);
  const assignedTaskIds = workerAssignments.map(a => a.taskId);
  const workerTasks = tasks.filter(t => assignedTaskIds.includes(t.id));

  const totalHours = workerTasks.reduce((s, t) => s + t.estimatedHours, 0);
  const pendingApprovals = workerAssignments.filter(a => a.approvalStatus === 'pending').length;
  const atRiskTasks = workerTasks.filter(t => {
    const due = new Date(t.dueDate);
    const start = new Date(t.startDate);
    const days = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const capacity = (selectedWorker?.dailyCapacityHours ?? 8) * days;
    return t.estimatedHours > capacity * 0.8;
  });

  const capabilities = workerCapabilities[selectedWorkerId] ?? [];
  const specializations = workerSpecializations[selectedWorkerId] ?? [];
  const productivityFactor = getProductivityFactor(selectedWorkerId);
  const workloadPct = selectedWorker ? getWorkloadPct(selectedWorker, workerTasks) : 0;

  function getDeadlineRisk(task: typeof tasks[0]) {
    const due = new Date(task.dueDate);
    const start = new Date(task.startDate);
    const days = Math.max(1, Math.ceil((due.getTime() - start.getTime()) / 86400000));
    const capacity = (selectedWorker?.dailyCapacityHours ?? 8) * days;
    if (task.estimatedHours > capacity) return 'high';
    if (task.estimatedHours > capacity * 0.8) return 'medium';
    return 'low';
  }

  return (
    <>
      {/* ── Modals ─────────────────────────────────────────────────────────── */}
      {activeModal?.type === 'reassign' && (
        <ReassignModal
          taskId={activeModal.taskId}
          taskTitle={activeModal.taskTitle}
          taskHours={activeModal.taskHours}
          requiredCapability={activeModal.capability}
          currentWorkerId={selectedWorkerId}
          onClose={() => setActiveModal(null)}
          onConfirm={(newWorkerId) => {
            console.log('Reassigned to', newWorkerId);
            setActiveModal(null);
          }}
        />
      )}
      {activeModal?.type === 'split' && (
        <SplitTaskModal
          taskId={activeModal.taskId}
          taskTitle={activeModal.taskTitle}
          totalHours={activeModal.taskHours}
          requiredCapability={activeModal.capability}
          onClose={() => setActiveModal(null)}
          onConfirm={(slots) => {
            console.log('Split task slots:', slots);
            setActiveModal(null);
          }}
        />
      )}

      {/* ── Layout ─────────────────────────────────────────────────────────── */}
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
              const wPct = getWorkloadPct(worker, wTasks);
              const wCaps = workerCapabilities[worker.id] ?? [];

              return (
                <button
                  key={worker.id}
                  onClick={() => { setSelectedWorkerId(worker.id); setRightPanel('tasks'); }}
                  className={`w-full text-left px-4 py-3 transition-colors flex items-start gap-3 group
                    ${isSelected
                      ? 'bg-primary/10 border-r-2 border-primary'
                      : 'hover:bg-secondary/50 border-r-2 border-transparent'
                    }`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5
                    ${isSelected ? 'bg-primary/20 text-primary' : 'bg-secondary text-secondary-foreground'}`}>
                    {worker.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium text-foreground truncate">{worker.name}</p>
                      {pending > 0 && (
                        <span className="text-[10px] bg-warning/20 text-warning px-1.5 py-0.5 rounded-full font-medium">{pending}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{worker.role}</p>
                    <WorkloadBar pct={wPct} />
                    {wCaps.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {wCaps.slice(0, 2).map(c => (
                          <span key={c.capability}
                            className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border truncate max-w-[80px]">
                            {c.capability}
                          </span>
                        ))}
                        {wCaps.length > 2 && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                            +{wCaps.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="flex-1 flex flex-col overflow-hidden">

          {/* Header */}
          {selectedWorker && (
            <div className="px-6 py-4 border-b border-border shrink-0">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                    {selectedWorker.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-bold text-foreground">{selectedWorker.name}</h1>
                      <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium
                        ${selectedWorker.status === 'active' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'}`}>
                        {selectedWorker.status}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedWorker.role} · {selectedWorker.department}</p>
                    {capabilities.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {capabilities.map(c => (
                          <span key={c.capability}
                            className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${proficiencyStyles[c.proficiency]}`}>
                            {c.capability}
                          </span>
                        ))}
                        {specializations.map(s => (
                          <span key={s.specialization}
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-secondary text-muted-foreground border border-border">
                            {s.specialization}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-5">
                  {[
                    { label: 'Tasks',    value: String(workerTasks.length), color: 'text-foreground' },
                    { label: 'Total hrs', value: `${totalHours}h`,          color: 'text-foreground' },
                    { label: 'Load',     value: `${workloadPct}%`,          color: workloadPct >= 80 ? 'text-destructive' : workloadPct >= 60 ? 'text-warning' : 'text-success' },
                    ...(productivityFactor !== null ? [{ label: 'Speed', value: `${productivityFactor}×`, color: productivityFactor >= 1 ? 'text-success' : 'text-warning' }] : []),
                    { label: 'Pending',  value: String(pendingApprovals),   color: pendingApprovals > 0 ? 'text-warning' : 'text-muted-foreground' },
                    { label: 'At Risk',  value: String(atRiskTasks.length), color: atRiskTasks.length > 0 ? 'text-destructive' : 'text-muted-foreground' },
                    { label: 'Daily Cap', value: `${selectedWorker.dailyCapacityHours}h`, color: 'text-foreground' },
                  ].map(stat => (
                    <div key={stat.label} className="text-center">
                      <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                      <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Tab bar: Tasks / History / Schedule ── */}
          <div className="flex items-center gap-0 px-6 border-b border-border shrink-0 bg-secondary/10">
            {([
              { id: 'tasks',    label: '📋 Tasks',    count: workerTasks.length },
              { id: 'history',  label: '📊 History',  count: null },
              { id: 'schedule', label: '🗓 Schedule', count: null },
            ] as const).map(tab => (
              <button
                key={tab.id}
                onClick={() => setRightPanel(tab.id)}
                className={`px-4 py-2.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5
                  ${rightPanel === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
              >
                {tab.label}
                {tab.count !== null && (
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full
                    ${rightPanel === tab.id ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* ── Panel content ── */}
          <div className="flex-1 overflow-y-auto scrollbar-thin">

            {/* ── TASKS TAB ── */}
            {rightPanel === 'tasks' && (
              <div className="p-6">
                {workerTasks.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center py-20">
                    <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center mb-3">
                      <CheckIcon size={20} className="text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground">No tasks assigned</p>
                    <p className="text-xs text-muted-foreground mt-1">This worker has no tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] gap-4 px-4 pb-1">
                      {['Task', 'Status', 'Priority', 'Hours', 'Risk', 'AI / Approval'].map(h => (
                        <p key={h} className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{h}</p>
                      ))}
                    </div>

                    {workerTasks.map(task => {
                      const assignment = workerAssignments.find(a => a.taskId === task.id);
                      const risk = getDeadlineRisk(task);
                      const reasons = aiReasonings[`${task.id}_${selectedWorkerId}`] ?? [];
                      const deps = taskDependencies[task.id] ?? [];
                      const multiWorker = multiWorkerTasks[task.id];
                      const capability = taskCapabilities[task.id] ?? 'general';

                      return (
                        <div key={task.id}
                          className="glass rounded-xl p-4 grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1.4fr] gap-4 items-start hover:bg-secondary/20 transition-colors">

                          {/* Task info */}
                          <div>
                            <p className="text-sm font-medium text-foreground">{task.title}</p>
                            <p className="text-xs text-muted-foreground mt-0.5 truncate max-w-xs">{task.description}</p>
                            <p className="text-[11px] text-muted-foreground mt-1">Due {task.dueDate}</p>
                            <div className="flex flex-wrap gap-1.5 mt-2">
                              {deps.length > 0 && <DependencyBadge deps={deps} />}
                              {multiWorker && <MultiWorkerBadge info={multiWorker} />}
                              <button
                                onClick={() => setRightPanel('schedule')}
                                className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full
                                  bg-secondary text-muted-foreground border border-border hover:text-foreground hover:bg-secondary/80 transition-colors">
                                📅 Schedule
                              </button>
                            </div>
                          </div>

                          {/* Status */}
                          <div className="pt-0.5">
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full w-fit ${statusStyles[task.status]}`}>
                              {task.status.replace('_', ' ')}
                            </span>
                          </div>

                          {/* Priority */}
                          <div className="pt-0.5">
                            <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full w-fit ${priorityStyles[task.priority]}`}>
                              {task.priority}
                            </span>
                          </div>

                          {/* Hours */}
                          <div className="flex items-center gap-1 text-sm text-foreground pt-0.5">
                            <ClockIcon size={13} className="text-muted-foreground" />
                            <span>{task.estimatedHours}h</span>
                            {assignment?.assignedHours && assignment.assignedHours !== task.estimatedHours && (
                              <span className="text-[11px] text-muted-foreground">/ {assignment.assignedHours}h</span>
                            )}
                          </div>

                          {/* Risk */}
                          <div className="pt-0.5">
                            {risk === 'high' && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-destructive bg-destructive/10 px-2 py-1 rounded-full border border-destructive/20 w-fit">
                                <AlertIcon size={11} /> high
                              </span>
                            )}
                            {risk === 'medium' && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-warning bg-warning/10 px-2 py-1 rounded-full border border-warning/20 w-fit">
                                <AlertIcon size={11} /> med
                              </span>
                            )}
                            {risk === 'low' && (
                              <span className="flex items-center gap-1 text-[11px] font-medium text-success bg-success/10 px-2 py-1 rounded-full border border-success/20 w-fit">
                                <CheckIcon size={11} /> ok
                              </span>
                            )}
                          </div>

                          {/* AI + Approval */}
                          <div className="flex flex-col gap-1.5">
                            {assignment?.confidence && (
                              <AIReasoningPanel reasons={reasons} confidence={assignment.confidence} />
                            )}
                            {assignment?.approvalStatus && (
                              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full w-fit ${approvalStyles[assignment.approvalStatus]}`}>
                                {assignment.approvalStatus}
                              </span>
                            )}
                            {assignment?.approvalStatus === 'pending' && (
                              <div className="flex flex-wrap gap-1 mt-0.5">
                                <button className="text-[10px] font-medium bg-success/15 text-success px-2 py-1 rounded hover:bg-success/25 transition-colors">
                                  ✓ Approve
                                </button>
                                {/* Opens Reassign modal */}
                                <button
                                  onClick={() => setActiveModal({
                                    type: 'reassign',
                                    taskId: task.id,
                                    taskTitle: task.title,
                                    taskHours: task.estimatedHours,
                                    capability,
                                  })}
                                  className="text-[10px] font-medium bg-primary/15 text-primary px-2 py-1 rounded hover:bg-primary/25 transition-colors">
                                  Reassign
                                </button>
                                {/* Opens Split modal */}
                                <button
                                  onClick={() => setActiveModal({
                                    type: 'split',
                                    taskId: task.id,
                                    taskTitle: task.title,
                                    taskHours: task.estimatedHours,
                                    capability,
                                  })}
                                  className="text-[10px] font-medium bg-secondary text-muted-foreground px-2 py-1 rounded hover:bg-secondary/80 hover:text-foreground border border-border transition-colors">
                                  ✂ Split
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
            )}

            {/* ── HISTORY TAB ── */}
            {rightPanel === 'history' && selectedWorker && (
              <div className="p-6">
                <TaskHistoryChart
                  workerId={selectedWorkerId}
                  workerName={selectedWorker.name}
                />
              </div>
            )}

            {/* ── SCHEDULE TAB ── */}
            {rightPanel === 'schedule' && (
              <div className="p-6">
                <TimeSlotGrid
                  focusWorkerId={selectedWorkerId}
                  onSlotClick={(workerId, date, hour) => {
                    console.log('Slot clicked:', workerId, date, hour);
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer summary */}
          {workerTasks.length > 0 && selectedWorker && rightPanel === 'tasks' && (
            <div className="px-6 py-3 border-t border-border bg-secondary/20 shrink-0 flex items-center gap-6 flex-wrap">
              <p className="text-xs text-muted-foreground">
                <span className="text-foreground font-medium">{workerTasks.length} tasks</span> · {totalHours}h total
              </p>
              {productivityFactor !== null && (
                <p className={`text-xs ${productivityFactor >= 1 ? 'text-success' : 'text-warning'}`}>
                  ⚡ {productivityFactor}× productivity
                </p>
              )}
              {pendingApprovals > 0 && (
                <p className="text-xs text-warning">⚠ {pendingApprovals} awaiting approval</p>
              )}
              {atRiskTasks.length > 0 && (
                <p className="text-xs text-destructive">🔴 {atRiskTasks.length} at deadline risk</p>
              )}
              <p className="text-xs text-muted-foreground ml-auto">
                Daily cap: <span className="text-foreground font-medium">{selectedWorker.dailyCapacityHours}h/day</span>
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}