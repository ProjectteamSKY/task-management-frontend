import { useState, useEffect } from 'react';
import { XIcon } from '@/components/icons/Icons';
import { taskService, TaskCreatePayload, Task } from '@/services/taskService';
import { projectService, Project } from '@/services/projectService';

interface CreateTaskModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const STATUSES = ['backlog', 'todo', 'in_progress', 'review', 'done', 'pending', 'blocked'];
const PRIORITIES = ['low', 'medium', 'high', 'critical'];

const defaultForm: TaskCreatePayload = {
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  task_type: 'GENERAL',
  estimated_hours: 1,
  project_id: null,
  start_date: '',
  end_date: '',
  depends_on: [],
};

export default function CreateTaskModal({ onClose, onCreated }: CreateTaskModalProps) {
  const [form, setForm] = useState<TaskCreatePayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof TaskCreatePayload, string>>>({});
  const [apiError, setApiError] = useState('');

  const [projects, setProjects] = useState<Project[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [projectsError, setProjectsError] = useState('');

  const [tasks, setTasks] = useState<Task[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [depSearch, setDepSearch] = useState('');

  useEffect(() => {
    const fetchProjects = async () => {
      setProjectsLoading(true);
      setProjectsError('');
      try {
        const data = await projectService.getProjects();
        setProjects(data);
      } catch {
        setProjectsError('Failed to load projects');
      } finally {
        setProjectsLoading(false);
      }
    };

    const fetchTasks = async () => {
      setTasksLoading(true);
      try {
        const data = await taskService.getTasks();
        setTasks(data);
      } finally {
        setTasksLoading(false);
      }
    };

    fetchProjects();
    fetchTasks();
  }, []);

  const set = (field: keyof TaskCreatePayload, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const toggleDependency = (taskId: number) => {
    const already = form.depends_on.includes(taskId);
    const newDeps = already
      ? form.depends_on.filter(id => id !== taskId)
      : [...form.depends_on, taskId];

    const hasIncomplete = newDeps.some(id => {
      const t = tasks.find(t => t.id === id);
      return t && t.status !== 'done' && t.status !== 'completed';
    });

    setForm(prev => ({
      ...prev,
      depends_on: newDeps,
      status: newDeps.length === 0
        ? 'todo'
        : hasIncomplete
        ? 'blocked'
        : prev.status === 'blocked'
        ? 'todo'
        : prev.status,
    }));
    setErrors(prev => ({ ...prev, depends_on: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs: Partial<Record<keyof TaskCreatePayload, string>> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.estimated_hours || form.estimated_hours < 1) errs.estimated_hours = 'Must be at least 1 hour';
    if (form.start_date && form.end_date && form.end_date < form.start_date)
      errs.end_date = 'End date must be after start date';
    return errs;
  };

  const handleSubmit = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setApiError('');
    try {
      const newTask = await taskService.createTask({
        ...form,
        project_id: form.project_id || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });

      if (form.depends_on.length > 0) {
        await Promise.all(
          form.depends_on.map(dep_id => taskService.addDependency(newTask.id, dep_id))
        );
      }

      onCreated?.();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredTasks = tasks.filter(t =>
    t.title.toLowerCase().includes(depSearch.toLowerCase())
  );

  const isDepIncomplete = (t: Task) =>
    t.status !== 'done' && t.status !== 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 glass z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Create Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in the details below</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
            <XIcon size={16} className="text-muted-foreground" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">

          {apiError && (
            <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-4 py-3 rounded-lg">
              {apiError}
            </div>
          )}

          <Field label="Title" error={errors.title} required>
            <input
              type="text"
              value={form.title}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. Fix login bug"
              className={inputCls(!!errors.title)}
            />
          </Field>

          <Field label="Description" error={errors.description} required>
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe what needs to be done..."
              className={inputCls(!!errors.description) + ' resize-none'}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status">
              <select
                value={form.status}
                onChange={e => set('status', e.target.value)}
                className={inputCls()}
              >
                {STATUSES.map(s => (
                  <option key={s} value={s}>{s.replace('_', ' ')}</option>
                ))}
              </select>
              {form.status === 'blocked' && form.depends_on.length > 0 && (
                <p className="text-[11px] text-amber-500 mt-1">
                  ⚠ Auto-set — has incomplete dependencies
                </p>
              )}
            </Field>

            <Field label="Priority">
              <select
                value={form.priority}
                onChange={e => set('priority', e.target.value)}
                className={inputCls()}
              >
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <Field label="Task Type" hint="e.g. GENERAL, BUG_FIX, MEETING">
            <input
              type="text"
              value={form.task_type}
              onChange={e => set('task_type', e.target.value.toUpperCase())}
              placeholder="e.g. GENERAL"
              className={inputCls()}
            />
          </Field>

          <Field label="Project" hint="optional">
            {projectsLoading ? (
              <div className={`${inputCls()} flex items-center gap-2 text-muted-foreground`}>
                <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                <span className="text-xs">Loading projects...</span>
              </div>
            ) : projectsError ? (
              <div className={`${inputCls(true)} text-destructive text-xs`}>{projectsError}</div>
            ) : (
              <select
                value={form.project_id ?? ''}
                onChange={e => set('project_id', e.target.value ? parseInt(e.target.value) : null)}
                className={inputCls()}
              >
                <option value="">— No project —</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
          </Field>

          <Field label="Estimated Hours" error={errors.estimated_hours} required>
            <input
              type="number"
              min={1}
              value={form.estimated_hours}
              onChange={e => set('estimated_hours', parseInt(e.target.value) || 1)}
              className={inputCls(!!errors.estimated_hours)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Start Date" hint="optional">
              <input
                type="date"
                value={form.start_date ?? ''}
                onChange={e => set('start_date', e.target.value)}
                className={inputCls()}
              />
            </Field>
            <Field label="End Date" error={errors.end_date} hint="optional">
              <input
                type="date"
                value={form.end_date ?? ''}
                onChange={e => set('end_date', e.target.value)}
                className={inputCls(!!errors.end_date)}
              />
            </Field>
          </div>

          {/* Depends On */}
          <Field label="Depends On" hint="optional — task will be blocked until these are done">
            <div className="rounded-lg border border-border bg-secondary/50 overflow-hidden">

              {/* Search */}
              <div className="px-3 py-2 border-b border-border">
                <input
                  type="text"
                  value={depSearch}
                  onChange={e => setDepSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
                />
              </div>

              {/* Task list */}
              <div className="max-h-36 overflow-y-auto scrollbar-thin">
                {tasksLoading ? (
                  <div className="flex items-center gap-2 px-3 py-3 text-muted-foreground">
                    <span className="w-3 h-3 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                    <span className="text-xs">Loading tasks...</span>
                  </div>
                ) : filteredTasks.length === 0 ? (
                  <p className="text-xs text-muted-foreground px-3 py-3">No tasks found</p>
                ) : (
                  filteredTasks.map(t => {
                    const selected = form.depends_on.includes(t.id);
                    const incomplete = isDepIncomplete(t);
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleDependency(t.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-secondary
                          ${selected ? 'text-primary' : 'text-foreground'}`}
                      >
                        <span className="truncate">{t.title}</span>
                        <span className={`ml-2 text-[10px] px-1.5 py-0.5 rounded-full border shrink-0
                          ${selected && incomplete
                            ? 'bg-amber-500/10 border-amber-500/30 text-amber-500'
                            : selected
                            ? 'bg-primary/10 border-primary/30 text-primary'
                            : 'border-border text-muted-foreground'}`}>
                          {t.status.replace('_', ' ')}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Selected pills */}
            {form.depends_on.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.depends_on.map(id => {
                  const t = tasks.find(t => t.id === id);
                  const incomplete = t ? isDepIncomplete(t) : false;
                  return (
                    <span
                      key={id}
                      className={`flex items-center gap-1 text-[11px] border px-2 py-0.5 rounded-full
                        ${incomplete
                          ? 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                          : 'bg-primary/10 text-primary border-primary/20'}`}
                    >
                      {t?.title}
                      <button
                        type="button"
                        onClick={() => toggleDependency(id)}
                        className="hover:text-destructive transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </Field>

        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border flex items-center justify-end gap-3 sticky bottom-0 glass">
          <button
            onClick={onClose}
            className="text-sm text-muted-foreground px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-5 py-2 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {loading
              ? <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              : <span className="text-base leading-none">+</span>
            }
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

function inputCls(hasError = false) {
  return `w-full bg-secondary/50 text-sm text-foreground placeholder:text-muted-foreground 
    rounded-lg px-3 py-2 outline-none border transition-colors
    ${hasError ? 'border-destructive focus:border-destructive' : 'border-border focus:border-primary'}`;
}

function Field({ label, children, error, hint, required }: {
  label: string; children: React.ReactNode;
  error?: string; hint?: string; required?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-1">
        {label}
        {required && <span className="text-destructive">*</span>}
        {hint && <span className="normal-case text-[10px] text-muted-foreground/60">({hint})</span>}
      </label>
      {children}
      {error && <p className="text-[11px] text-destructive">{error}</p>}
    </div>
  );
}