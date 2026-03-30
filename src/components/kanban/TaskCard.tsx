import { Task } from '@/types';
import { NormalisedWorker } from '@/services/workerService';
import { ClockIcon, LinkIcon } from '@/components/icons/Icons';

const priorityStyles: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high:     'bg-warning/15 text-warning',
  medium:   'bg-primary/15 text-primary',
  low:      'bg-secondary text-muted-foreground',
};

interface TaskCardProps {
  task: Task;
  workers: NormalisedWorker[];  // real workers from API, passed from KanbanBoard
  onDragStart?: () => void;     // kept for backwards compat, unused with RBD
  onClick: () => void;
}

export default function TaskCard({ task, workers, onClick }: TaskCardProps) {
  const assignedWorkerIds = task.assignedWorkers ?? [];
  const dependencies      = task.dependencies    ?? [];

  // Match by string id (API returns string ids after normalisation)
  const assigned = workers.filter(w => assignedWorkerIds.includes(w.id));
  const hasDeps  = dependencies.length > 0;

  return (
    <div
      onClick={onClick}
      className="glass rounded-lg p-3.5 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all duration-200 group select-none"
    >
      {/* Title + priority */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h4 className="text-sm font-medium text-foreground leading-snug group-hover:text-primary transition-colors">
          {task.title}
        </h4>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full shrink-0 ${priorityStyles[task.priority] ?? priorityStyles.low}`}>
          {task.priority}
        </span>
      </div>

      {/* Description */}
      <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
        {task.description}
      </p>

      {/* Meta row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <ClockIcon size={12} /> {task.estimatedHours}h
          </span>
          {hasDeps && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <LinkIcon size={12} /> {dependencies.length}
            </span>
          )}
          {task.source === 'slack' && (
            <span className="text-[10px] bg-secondary text-muted-foreground px-1.5 py-0.5 rounded">
              # slack
            </span>
          )}
        </div>

        {/* Avatar stack — from real API worker data */}
        <div className="flex -space-x-1.5">
          {assigned.slice(0, 3).map(w => (
            <div
              key={w.id}
              title={w.name}
              className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] font-medium text-secondary-foreground"
            >
              {w.avatar}
            </div>
          ))}
          {assigned.length > 3 && (
            <div className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[9px] text-muted-foreground">
              +{assigned.length - 3}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}