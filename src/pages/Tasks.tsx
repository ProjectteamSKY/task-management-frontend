import { useState, useEffect } from 'react';
import { Task } from '@/types';
import { SearchIcon, ClockIcon } from '@/components/icons/Icons';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';
import CreateTaskModal from '@/modal/Createtask';
import { taskService } from '@/services/taskService';

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
  pending: 'bg-orange-500/15 text-orange-400',
};

export default function Tasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const fetchTasks = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await taskService.getTasks();
      setTasks(data);
    } catch (err: unknown) {
      const error = err as Error;
      setError(error.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? 'Loading...' : `${tasks.length} tasks total`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="text-lg leading-none">+--</span>
          Create Task
        </button>
      </div>

      {/* API Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchTasks} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-64">
          <SearchIcon size={15} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg outline-none"
        >
          <option value="all">All Status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
          <option value="pending">Pending</option>
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg outline-none"
        >
          <option value="all">All Priority</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Task</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Status</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Priority</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Type</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Hours</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Start</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">End</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="p-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Loading tasks...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map(task => (
                <tr
                  key={task.id}
                  onClick={() => setSelectedTask(task)}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{task.title}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{task.description}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusStyles[task.status] ?? 'bg-secondary text-muted-foreground'}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${priorityStyles[task.priority] ?? 'bg-secondary text-muted-foreground'}`}>
                      {task.priority}
                    </span>
                  </td>
                  {/* <td className="p-4">
                    <span className="text-[11px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">
                      {task.task_type?.replace('_', ' ') ?? '—'}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-foreground">
                    <div className="flex items-center gap-1">
                      <ClockIcon size={13} className="text-muted-foreground" />
                      {task.estimated_hours}h
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{task.start_date ?? '—'}</td>
                  <td className="p-4 text-sm text-muted-foreground">{task.end_date ?? '—'}</td> */}
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-10 text-center text-sm text-muted-foreground">
                    No tasks found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTask && (
        <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />
      )}
      {showCreate && (
        <CreateTaskModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchTasks}
        />
      )}
    </div>
  );
}