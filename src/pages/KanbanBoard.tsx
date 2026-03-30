import { useState, useCallback, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from 'react-beautiful-dnd';
import { Task, TaskStatus } from '@/types';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import { taskService } from '@/services/taskService';
import { workerService, NormalisedWorker } from '@/services/workerService';
import { assignmentService } from '@/services/taskassignmentService';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLUMNS: {
  status: TaskStatus;
  label: string;
  accent: string;
  bg: string;
}[] = [
  { status: 'backlog',     label: 'Backlog',     accent: 'bg-muted-foreground', bg: 'bg-muted-foreground/5' },
  { status: 'todo',        label: 'To Do',       accent: 'bg-primary',          bg: 'bg-primary/5'          },
  { status: 'in_progress', label: 'In Progress', accent: 'bg-warning',          bg: 'bg-warning/5'          },
  { status: 'review',      label: 'In Review',   accent: 'bg-purple-400',       bg: 'bg-purple-400/5'       },
  { status: 'done',        label: 'Done',        accent: 'bg-success',          bg: 'bg-success/5'          },
];

const AVATAR_PALETTE = [
  '#0052CC', '#00B8D9', '#36B37E', '#FF5630',
  '#6554C0', '#FF8B00', '#0065FF', '#57D9A3',
];

const PRIORITY_META: Record<string, { icon: string; color: string }> = {
  critical: { icon: '▲▲', color: '#FF5630' },
  high:     { icon: '▲',  color: '#FF8B00' },
  medium:   { icon: '■',  color: '#0052CC' },
  low:      { icon: '▼',  color: '#36B37E' },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normaliseTask(raw: Record<string, any>): Task {
  return {
    id:                   String(raw.id),
    title:                raw.title ?? '',
    description:          raw.description ?? '',
    status:               raw.status ?? 'backlog',
    priority:             raw.priority ?? 'low',
    estimatedHours:       raw.estimated_hours       ?? raw.estimatedHours       ?? 0,
    startDate:            raw.start_date            ?? raw.startDate            ?? '',
    dueDate:              raw.end_date              ?? raw.dueDate              ?? '',
    assignedWorkers:      (raw.assigned_workers ?? raw.assignedWorkers ?? []).map(String),
    requiredCapabilities: raw.required_capabilities ?? raw.requiredCapabilities ?? [],
    dependencies:         raw.dependencies          ?? [],
    source:               raw.source                ?? undefined,
    taskType:             raw.task_type             ?? raw.taskType             ?? undefined,
  } as Task;
}

function avatarColor(id: string) {
  let h = 0;
  for (const ch of id) h = ch.charCodeAt(0) + ((h << 5) - h);
  return AVATAR_PALETTE[Math.abs(h) % AVATAR_PALETTE.length];
}

// ─── WorkerAvatar ─────────────────────────────────────────────────────────────

function WorkerAvatar({
  worker,
  size = 28,
  style,
}: {
  worker: NormalisedWorker;
  size?: number;
  style?: React.CSSProperties;
}) {
  const isUrl    = worker.avatar?.startsWith('http') || worker.avatar?.startsWith('/');
  const initials = worker.name.split(' ').map(p => p[0]).slice(0, 2).join('').toUpperCase();
  const base: React.CSSProperties = {
    width: size, height: size, borderRadius: '50%',
    border: '2px solid white', flexShrink: 0,
    boxSizing: 'border-box', ...style,
  };

  if (isUrl) {
    return (
      <img
        src={worker.avatar} alt={worker.name} title={worker.name}
        style={{ ...base, objectFit: 'cover', display: 'block' }}
      />
    );
  }
  return (
    <span
      title={worker.name}
      style={{
        ...base,
        background: avatarColor(worker.id),
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        fontSize: Math.round(size * 0.36), fontWeight: 700, color: '#fff',
        letterSpacing: '0.02em', userSelect: 'none',
      }}
    >
      {initials}
    </span>
  );
}

// ─── Stacked avatars on card ──────────────────────────────────────────────────

function CardAvatarStack({
  taskId,
  workersByTask,
  workers,
}: {
  taskId: string;
  workersByTask: Record<string, string[]>;
  workers: NormalisedWorker[];
}) {
  const workerIds = workersByTask[taskId] ?? [];
  const assigned  = workers.filter(w => workerIds.includes(w.id));
  if (!assigned.length) return null;

  const visible  = assigned.slice(0, 3);
  const overflow = assigned.length - 3;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((w, i) => (
        <WorkerAvatar
          key={w.id}
          worker={w}
          size={24}
          style={{ marginLeft: i === 0 ? 0 : -7, zIndex: 3 - i }}
        />
      ))}
      {overflow > 0 && (
        <div style={{
          marginLeft: -7, width: 24, height: 24,
          borderRadius: '50%', border: '2px solid #fff',
          background: '#DFE1E6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 8, fontWeight: 700, color: '#42526E',
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Filter bar avatar stack ───────────────────────────────────────────────────

function FilterAvatarBar({
  workers,
  selectedId,
  onSelect,
}: {
  workers: NormalisedWorker[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const MAX      = 8;
  const visible  = workers.slice(0, MAX);
  const overflow = workers.length - MAX;

  return (
    <div style={{ display: 'flex', alignItems: 'center' }}>
      {visible.map((w, i) => {
        const active     = selectedId === null || selectedId === w.id;
        const isSelected = selectedId === w.id;
        return (
          <button
            key={w.id}
            onClick={() => onSelect(w.id)}
            title={w.name}
            style={{
              marginLeft: i === 0 ? 0 : -8,
              zIndex: isSelected ? 20 : visible.length - i,
              opacity: active ? 1 : 0.3,
              transform: isSelected ? 'scale(1.18) translateY(-2px)' : 'scale(1)',
              transition: 'all 0.15s ease',
              padding: 0, border: 'none', background: 'none',
              cursor: 'pointer', borderRadius: '50%', outline: 'none',
            }}
          >
            <WorkerAvatar
              worker={w}
              size={32}
              style={
                isSelected
                  ? {
                      border: `2.5px solid ${avatarColor(w.id)}`,
                      boxShadow: `0 0 0 3px ${avatarColor(w.id)}40`,
                    }
                  : {}
              }
            />
          </button>
        );
      })}
      {overflow > 0 && (
        <div style={{
          marginLeft: -8, width: 32, height: 32,
          borderRadius: '50%', border: '2px solid #fff',
          background: '#DFE1E6',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 700, color: '#42526E',
        }}>
          +{overflow}
        </div>
      )}
    </div>
  );
}

// ─── Task Card ────────────────────────────────────────────────────────────────

function TaskCard({
  task,
  workers,
  workersByTask,
  isUpdating,
  onClick,
}: {
  task: Task;
  workers: NormalisedWorker[];
  workersByTask: Record<string, string[]>;
  isUpdating: boolean;
  onClick: () => void;
}) {
  const prio = PRIORITY_META[task.priority] ?? PRIORITY_META.medium;

  return (
    <div
      onClick={onClick}
      style={{ position: 'relative', opacity: isUpdating ? 0.55 : 1 }}
      className="
        rounded-lg bg-card border border-border
        hover:border-[#4C9AFF] hover:shadow-[0_2px_8px_rgba(9,30,66,0.15)]
        transition-all duration-150 cursor-pointer select-none
        px-3 pt-3 pb-2.5
      "
    >
      <p className="text-[13px] font-medium text-foreground leading-snug mb-3">
        {task.title}
      </p>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ fontSize: 9, color: prio.color, fontWeight: 900, lineHeight: 1 }}>
            {prio.icon}
          </span>
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            #{task.id}
          </span>
        </div>

        <CardAvatarStack
          taskId={task.id}
          workersByTask={workersByTask}
          workers={workers}
        />
      </div>

      {isUpdating && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8,
          background: 'rgba(255,255,255,0.6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      )}
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────

export default function KanbanBoard() {
  const [taskList,      setTaskList]      = useState<Task[]>([]);
  const [workers,       setWorkers]       = useState<NormalisedWorker[]>([]);
  // taskId  → workerIds[]  (for showing avatars on cards)
  const [workersByTask, setWorkersByTask] = useState<Record<string, string[]>>({});
  // workerId → taskIds[]   (for filtering cards when avatar is clicked)
  const [tasksByWorker, setTasksByWorker] = useState<Record<string, string[]>>({});
  const [loading,       setLoading]       = useState(true);
  const [error,         setError]         = useState<string | null>(null);
  const [selectedTask,  setSelectedTask]  = useState<Task | null>(null);
  const [updatingId,    setUpdatingId]    = useState<string | null>(null);
  const [filteredWorkerId, setFilteredWorkerId] = useState<string | null>(null);

  // ── Load tasks, workers, assignments in parallel ───────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [rawTasks, rawWorkers, rawAssignments] = await Promise.all([
          taskService.getTasks(),
          workerService.getWorkers(),
          assignmentService.getAssignments(),
        ]);

        // Build bidirectional lookup maps from assignments
        // Each assignment: { task_id: number, worker_id: number, ... }
        const byTask:   Record<string, string[]> = {};
        const byWorker: Record<string, string[]> = {};

        for (const a of rawAssignments) {
          const taskId   = String(a.task_id);
          const workerId = String(a.worker_id);

          if (!byTask[taskId])     byTask[taskId]     = [];
          if (!byWorker[workerId]) byWorker[workerId] = [];

          if (!byTask[taskId].includes(workerId))   byTask[taskId].push(workerId);
          if (!byWorker[workerId].includes(taskId)) byWorker[workerId].push(taskId);
        }

        setTaskList(rawTasks.map(normaliseTask));
        setWorkers(rawWorkers);
        setWorkersByTask(byTask);
        setTasksByWorker(byWorker);
      } catch (e) {
        console.error('Failed to load board data:', e);
        setError('Failed to load board data. Please refresh.');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Click avatar → toggle filter
  const handleAvatarClick = (id: string) =>
    setFilteredWorkerId(prev => (prev === id ? null : id));

  // ── Drag ──────────────────────────────────────────────────────────────────
  const onDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;
    if (!destination) return;
    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) return;

    const newStatus  = destination.droppableId as TaskStatus;
    const prevStatus = source.droppableId      as TaskStatus;

    setTaskList(prev =>
      prev.map(t => t.id === draggableId ? { ...t, status: newStatus } : t),
    );

    try {
      setUpdatingId(draggableId);
      await taskService.updateTaskStatus(Number(draggableId), newStatus);
    } catch {
      setTaskList(prev =>
        prev.map(t => t.id === draggableId ? { ...t, status: prevStatus } : t),
      );
    } finally {
      setUpdatingId(null);
    }
  }, []);

  // ── Filter uses tasksByWorker from assignments ─────────────────────────────
  const visibleTasks = filteredWorkerId
    ? taskList.filter(t => (tasksByWorker[filteredWorkerId] ?? []).includes(t.id))
    : taskList;

  const filteredWorker = workers.find(w => w.id === filteredWorkerId) ?? null;

  // ── Loading skeleton ───────────────────────────────────────────────────────
  if (loading) return (
    <div className="flex flex-col h-full animate-fade-in">
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
        <p className="text-muted-foreground text-sm mt-1">Drag tasks between columns to update status</p>
      </div>
      <div className="flex items-center mb-6" style={{ gap: 0 }}>
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="w-8 h-8 rounded-full bg-secondary/70 animate-pulse"
            style={{ marginLeft: i > 1 ? -8 : 0, border: '2px solid white' }} />
        ))}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4">
        {STATUS_COLUMNS.map(col => (
          <div key={col.status} className="flex-shrink-0 w-[280px]">
            <div className="flex items-center gap-2 mb-3 px-1">
              <span className={`w-2 h-2 rounded-full ${col.accent}`} />
              <div className="h-4 w-20 bg-secondary/60 rounded animate-pulse" />
            </div>
            <div className="min-h-[200px] rounded-xl bg-secondary/30 p-2 space-y-2">
              {[1, 2].map(j => (
                <div key={j} className="rounded-lg bg-secondary/50 h-28 animate-pulse" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error) return (
    <div className="flex flex-col h-full animate-fade-in">
      <h1 className="text-2xl font-bold text-foreground mb-6">Kanban Board</h1>
      <div className="rounded-xl bg-destructive/10 border border-destructive/20 p-6 text-center">
        <p className="text-destructive text-sm font-medium">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-3 text-xs text-muted-foreground underline hover:text-foreground transition-colors"
        >
          Retry
        </button>
      </div>
    </div>
  );

  // ── Board ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full animate-fade-in">

      {/* ── Header ── */}
      <div className="mb-6 flex-shrink-0">
        <h1 className="text-2xl font-bold text-foreground mb-1">Kanban Board</h1>
        <p className="text-muted-foreground text-sm mb-3">
          Drag tasks between columns to update status
        </p>

        <div className="flex items-center gap-3 flex-wrap">
          <FilterAvatarBar
            workers={workers}
            selectedId={filteredWorkerId}
            onSelect={handleAvatarClick}
          />

          {filteredWorker && (
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-secondary border border-border ml-1">
              <WorkerAvatar worker={filteredWorker} size={18} />
              <span className="text-[12px] font-semibold text-foreground leading-none">
                {filteredWorker.name}
              </span>
              <button
                onClick={() => setFilteredWorkerId(null)}
                className="text-muted-foreground hover:text-foreground text-xs ml-0.5 leading-none"
                title="Clear filter"
              >
                ✕
              </button>
            </div>
          )}

          <p className="text-xs text-muted-foreground ml-auto hidden sm:block">
            {filteredWorkerId
              ? `Showing ${visibleTasks.length} task(s) for ${filteredWorker?.name}`
              : 'Click a member to filter · Drag to change status'}
          </p>
        </div>
      </div>

      {/* ── Columns ── */}
      <div className="min-w-0 overflow-hidden flex-1">
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 h-full scrollbar-thin scrollbar-thumb-border scrollbar-track-transparent">

            {STATUS_COLUMNS.map(col => {
              const colTasks = visibleTasks.filter(t => t.status === col.status);

              return (
                <div key={col.status} className="flex-shrink-0 w-[280px] flex flex-col">

                  <div className="flex items-center gap-2 mb-3 px-1">
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${col.accent}`} />
                    <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                    <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 ml-auto">
                      {colTasks.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.status}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className={[
                          'flex-1 min-h-[200px] rounded-xl p-2 transition-colors duration-200',
                          snapshot.isDraggingOver
                            ? `${col.bg} ring-1 ring-inset ring-border`
                            : 'bg-secondary/30',
                        ].join(' ')}
                      >
                        <div className="space-y-2">
                          {colTasks.map((task, idx) => (
                            <Draggable key={task.id} draggableId={task.id} index={idx}>
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  {...prov.dragHandleProps}
                                  style={prov.draggableProps.style}
                                  className={snap.isDragging ? 'rotate-1 scale-[1.02] shadow-2xl' : ''}
                                >
                                  <TaskCard
                                    task={task}
                                    workers={workers}
                                    workersByTask={workersByTask}
                                    isUpdating={updatingId === task.id}
                                    onClick={() => setSelectedTask(task)}
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}

                          {colTasks.length === 0 && !snapshot.isDraggingOver && (
                            <div className="flex items-center justify-center h-16 rounded border-2 border-dashed border-border/30">
                              <p className="text-xs text-muted-foreground/35">No tasks</p>
                            </div>
                          )}
                        </div>
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}

          </div>
        </DragDropContext>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}