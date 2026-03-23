import { useState } from 'react';
import { tasks, workers, taskAssignments } from '@/data/mockData';
import { Task, TaskStatus } from '@/types';
import TaskCard from '@/components/kanban/TaskCard';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

const columns: { status: TaskStatus; label: string; accent: string }[] = [
  { status: 'backlog', label: 'Backlog', accent: 'bg-muted-foreground' },
  { status: 'todo', label: 'To Do', accent: 'bg-primary' },
  { status: 'in_progress', label: 'In Progress', accent: 'bg-warning' },
  { status: 'review', label: 'Review', accent: 'bg-purple-400' },
  { status: 'done', label: 'Done', accent: 'bg-success' },
];

export default function KanbanBoard() {
  const [taskList, setTaskList] = useState(tasks);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [draggedTask, setDraggedTask] = useState<string | null>(null);

  const handleDragStart = (taskId: string) => setDraggedTask(taskId);

  const handleDrop = (status: TaskStatus) => {
    if (!draggedTask) return;
    setTaskList(prev => prev.map(t => t.id === draggedTask ? { ...t, status } : t));
    setDraggedTask(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Kanban Board</h1>
        <p className="text-muted-foreground text-sm mt-1">Drag tasks between columns to update status</p>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
        {columns.map(col => {
          const colTasks = taskList.filter(t => t.status === col.status);
          return (
            <div
              key={col.status}
              className="min-w-[280px] w-[280px] flex-shrink-0"
              onDragOver={e => e.preventDefault()}
              onDrop={() => handleDrop(col.status)}
            >
              <div className="flex items-center gap-2 mb-3 px-1">
                <span className={`w-2 h-2 rounded-full ${col.accent}`} />
                <h3 className="text-sm font-semibold text-foreground">{col.label}</h3>
                <span className="text-xs text-muted-foreground bg-secondary rounded-full px-2 py-0.5 ml-auto">{colTasks.length}</span>
              </div>
              <div className="space-y-2 min-h-[200px] rounded-xl bg-secondary/30 p-2">
                {colTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onDragStart={() => handleDragStart(task.id)}
                    onClick={() => setSelectedTask(task)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
    </div>
  );
}
