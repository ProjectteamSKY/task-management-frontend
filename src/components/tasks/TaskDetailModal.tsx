import { Task } from '@/types';
import { workers, taskAssignments, tasks as allTasks } from '@/data/mockData';
import { CloseIcon, ClockIcon, CheckIcon, AlertIcon, LinkIcon } from '@/components/icons/Icons';
import { useState } from 'react';

const priorityStyles: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high: 'bg-warning/15 text-warning',
  medium: 'bg-primary/15 text-primary',
  low: 'bg-secondary text-muted-foreground',
};

const statusStyles: Record<string, string> = {
  backlog: 'bg-muted text-muted-foreground',
  todo: 'bg-primary/15 text-primary',
  in_progress: 'bg-warning/15 text-warning',
  review: 'bg-purple-500/15 text-purple-400',
  done: 'bg-success/15 text-success',
};

export default function TaskDetailModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const assignments = taskAssignments.filter(a => a.taskId === task.id);
  const assigned = workers.filter(w => task.assignedWorkers.includes(w.id));
  const deps = allTasks.filter(t => task.dependencies.includes(t.id));

  // Deadline risk
  const dueDate = new Date(task.dueDate);
  const startDate = new Date(task.startDate);
  const workDays = Math.max(1, Math.ceil((dueDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const maxCapacity = assigned.reduce((s, w) => s + w.dailyCapacityHours, 8) * workDays;
  const riskLevel = task.estimatedHours > maxCapacity ? 'high' : task.estimatedHours > maxCapacity * 0.8 ? 'medium' : 'low';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm" onClick={onClose}>
      <div className="glass rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto scrollbar-thin animate-fade-in" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-border">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${priorityStyles[task.priority]}`}>{task.priority}</span>
              <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${statusStyles[task.status]}`}>{task.status.replace('_', ' ')}</span>
              {task.source === 'slack' && <span className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full"># slack</span>}
            </div>
            <h2 className="text-lg font-bold text-foreground">{task.title}</h2>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
            <CloseIcon size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <div>
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Description</h4>
            <p className="text-sm text-foreground/80">{task.description}</p>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Estimated</p>
              <p className="text-sm font-semibold text-foreground flex items-center gap-1"><ClockIcon size={14} /> {task.estimatedHours}h</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Start Date</p>
              <p className="text-sm font-semibold text-foreground">{task.startDate}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Due Date</p>
              <p className="text-sm font-semibold text-foreground">{task.dueDate}</p>
            </div>
            <div className="bg-secondary/50 rounded-lg p-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">Deadline Risk</p>
              <p className={`text-sm font-semibold flex items-center gap-1 ${riskLevel === 'high' ? 'text-destructive' : riskLevel === 'medium' ? 'text-warning' : 'text-success'}`}>
                <AlertIcon size={14} /> {riskLevel}
              </p>
            </div>
          </div>

          {/* Capabilities */}
          {task.requiredCapabilities.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Required Capabilities</h4>
              <div className="flex flex-wrap gap-2">
                {task.requiredCapabilities.map(c => (
                  <span key={c} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-md font-medium">{c}</span>
                ))}
              </div>
            </div>
          )}

          {/* Dependencies */}
          {deps.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Dependencies</h4>
              <div className="space-y-2">
                {deps.map(d => (
                  <div key={d.id} className="flex items-center gap-2 text-sm bg-secondary/50 rounded-lg p-2.5">
                    <LinkIcon size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{d.title}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ml-auto ${statusStyles[d.status]}`}>{d.status.replace('_', ' ')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Assignments / Approval */}
          {assignments.length > 0 && (
            <div>
              <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Assignments & Approval</h4>
              <div className="space-y-3">
                {assignments.map(a => {
                  const worker = workers.find(w => w.id === a.workerId);
                  return (
                    <div key={a.id} className="glass rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center text-xs font-semibold text-secondary-foreground">
                            {worker?.avatar}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-foreground">{worker?.name}</p>
                            <p className="text-xs text-muted-foreground">{worker?.role} · {a.assignedHours}h assigned</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {a.confidence && (
                            <span className="text-xs text-muted-foreground">Confidence: <span className="text-foreground font-medium">{a.confidence}%</span></span>
                          )}
                          <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                            a.approvalStatus === 'approved' ? 'bg-success/15 text-success' :
                            a.approvalStatus === 'pending' ? 'bg-warning/15 text-warning' :
                            'bg-destructive/15 text-destructive'
                          }`}>
                            {a.approvalStatus}
                          </span>
                        </div>
                      </div>
                      {a.reasoning && (
                        <div className="flex flex-wrap gap-1.5">
                          {a.reasoning.map((r, i) => (
                            <span key={i} className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">{r}</span>
                          ))}
                        </div>
                      )}
                      {a.approvalStatus === 'pending' && (
                        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                          <button className="text-xs font-medium bg-success/15 text-success px-3 py-1.5 rounded-md hover:bg-success/25 transition-colors">
                            ✓ Approve
                          </button>
                          <button className="text-xs font-medium bg-primary/15 text-primary px-3 py-1.5 rounded-md hover:bg-primary/25 transition-colors">
                            Change Worker
                          </button>
                          <button className="text-xs font-medium bg-warning/15 text-warning px-3 py-1.5 rounded-md hover:bg-warning/25 transition-colors">
                            Split Task
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
