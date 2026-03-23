import { useState } from 'react';
import { tasks, workers, taskAssignments } from '@/data/mockData';
import { Task } from '@/types';
import { SearchIcon, FilterIcon, ClockIcon, LinkIcon } from '@/components/icons/Icons';
import TaskDetailModal from '@/components/tasks/TaskDetailModal';

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

export default function Tasks() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

  const filtered = tasks.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || t.status === statusFilter;
    const matchPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    return matchSearch && matchStatus && matchPriority;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
        <p className="text-muted-foreground text-sm mt-1">{tasks.length} tasks total</p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-64">
          <SearchIcon size={15} className="text-muted-foreground" />
          <input type="text" placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg outline-none">
          <option value="all">All Status</option>
          <option value="backlog">Backlog</option>
          <option value="todo">To Do</option>
          <option value="in_progress">In Progress</option>
          <option value="review">Review</option>
          <option value="done">Done</option>
        </select>
        <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg outline-none">
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
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Assigned</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Hours</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Due</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(task => {
                const assigned = workers.filter(w => task.assignedWorkers.includes(w.id));
                return (
                  <tr key={task.id} onClick={() => setSelectedTask(task)}
                    className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors">
                    <td className="p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">{task.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{task.description}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusStyles[task.status]}`}>
                        {task.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${priorityStyles[task.priority]}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex -space-x-1.5">
                        {assigned.map(w => (
                          <div key={w.id} className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center text-[10px] font-medium text-secondary-foreground" title={w.name}>
                            {w.avatar}
                          </div>
                        ))}
                        {assigned.length === 0 && <span className="text-xs text-muted-foreground">Unassigned</span>}
                      </div>
                    </td>
                    <td className="p-4 text-sm text-foreground flex items-center gap-1"><ClockIcon size={13} className="text-muted-foreground" /> {task.estimatedHours}h</td>
                    <td className="p-4 text-sm text-muted-foreground">{task.dueDate}</td>
                    <td className="p-4">
                      {task.source === 'slack' ? (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded"># slack</span>
                      ) : (
                        <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded">manual</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedTask && <TaskDetailModal task={selectedTask} onClose={() => setSelectedTask(null)} />}
    </div>
  );
}
