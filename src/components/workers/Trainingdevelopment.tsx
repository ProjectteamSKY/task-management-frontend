import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { PlusIcon, PencilIcon, XIcon, CheckIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TrainingStatus = 'upcoming' | 'in_progress' | 'completed';

export interface TrainingSession {
  id:          string;
  title:       string;
  provider:    string;
  category:    string;
  status:      TrainingStatus;
  startDate:   string;
  endDate:     string;
  progress:    number; // 0–100
  notes:       string;
}

export interface SkillGoal {
  id:       string;
  goal:     string;
  progress: number; // 0–100
  dueDate:  string;
}

interface TrainingDevelopmentProps {
  initialSessions?: TrainingSession[];
  initialGoals?:    SkillGoal[];
  onChange?:        (sessions: TrainingSession[], goals: SkillGoal[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES = ['Technical', 'Safety', 'Leadership', 'Compliance', 'Soft Skills', 'Other'];

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const STATUS_STYLES: Record<TrainingStatus, string> = {
  upcoming:    'bg-primary/15 text-primary',
  in_progress: 'bg-warning/15 text-warning',
  completed:   'bg-success/15 text-success',
};

const STATUS_LABELS: Record<TrainingStatus, string> = {
  upcoming:    'Upcoming',
  in_progress: 'In Progress',
  completed:   'Completed',
};

const emptySession: Omit<TrainingSession, 'id'> = {
  title: '', provider: '', category: CATEGORIES[0],
  status: 'upcoming', startDate: '', endDate: '',
  progress: 0, notes: '',
};

const emptyGoal: Omit<SkillGoal, 'id'> = {
  goal: '', progress: 0, dueDate: '',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() { return Math.random().toString(36).slice(2, 9); }

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ─── Progress Bar ─────────────────────────────────────────────────────────────

function ProgressBar({ value, color = 'bg-primary' }: { value: number; color?: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-secondary rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
      <span className="text-[10px] text-muted-foreground shrink-0 w-7 text-right">{value}%</span>
    </div>
  );
}

// ─── Training Form ────────────────────────────────────────────────────────────

function TrainingForm({
  initial, onSave, onCancel, saveLabel = 'Add Training',
}: {
  initial:    Omit<TrainingSession, 'id'>;
  onSave:     (data: Omit<TrainingSession, 'id'>) => void;
  onCancel:   () => void;
  saveLabel?: string;
}) {
  const [form,   setForm]   = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  }

  function handleSave() {
    const next: typeof errors = {};
    if (!form.title.trim())     next.title     = 'Title is required';
    if (!form.provider.trim())  next.provider  = 'Provider is required';
    if (!form.startDate)        next.startDate = 'Start date is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(form);
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-4 border border-border/50">
      <div className="grid grid-cols-2 gap-3">
        {/* Title */}
        <div className="col-span-2">
          <label className="text-xs text-muted-foreground mb-1.5 block">Training title</label>
          <Input placeholder="e.g. Advanced Electrical Safety" value={form.title}
            onChange={e => setField('title', e.target.value)} />
          {errors.title && <p className="text-[11px] text-destructive mt-1">{errors.title}</p>}
        </div>

        {/* Provider */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Provider / Institution</label>
          <Input placeholder="e.g. OSHA Training Institute" value={form.provider}
            onChange={e => setField('provider', e.target.value)} />
          {errors.provider && <p className="text-[11px] text-destructive mt-1">{errors.provider}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
          <select value={form.category} onChange={e => setField('category', e.target.value)} className={selectCls}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Status */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
          <select value={form.status}
            onChange={e => setField('status', e.target.value as TrainingStatus)}
            className={selectCls}>
            {(Object.keys(STATUS_LABELS) as TrainingStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>

        {/* Progress */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Progress ({form.progress}%)</label>
          <input type="range" min={0} max={100} step={5} value={form.progress}
            onChange={e => setField('progress', Number(e.target.value))}
            className="w-full accent-primary" />
        </div>

        {/* Start date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Start date</label>
          <input type="date" value={form.startDate}
            onChange={e => setField('startDate', e.target.value)} className={selectCls} />
          {errors.startDate && <p className="text-[11px] text-destructive mt-1">{errors.startDate}</p>}
        </div>

        {/* End date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">End date <span className="text-muted-foreground/60">(optional)</span></label>
          <input type="date" value={form.endDate}
            onChange={e => setField('endDate', e.target.value)} className={selectCls} />
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Notes <span className="text-muted-foreground/60">(optional)</span></label>
        <textarea rows={2} placeholder="Any additional notes…" value={form.notes}
          onChange={e => setField('notes', e.target.value)}
          className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Training Card ────────────────────────────────────────────────────────────

function TrainingCard({
  session, onEdit, onDelete,
}: {
  session:  TrainingSession;
  onEdit:   (id: string, data: Omit<TrainingSession, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) return (
    <TrainingForm
      initial={{ title: session.title, provider: session.provider, category: session.category,
        status: session.status, startDate: session.startDate, endDate: session.endDate,
        progress: session.progress, notes: session.notes }}
      onSave={data => { onEdit(session.id, data); setEditing(false); }}
      onCancel={() => setEditing(false)}
      saveLabel="Save Changes"
    />
  );

  const progressColor =
    session.status === 'completed' ? 'bg-success' :
    session.progress >= 60         ? 'bg-warning'  : 'bg-primary';

  return (
    <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3 group relative">
      {/* Actions */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => setEditing(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors">
          <PencilIcon size={11} className="text-muted-foreground" />
        </button>
        <button onClick={() => setConfirming(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors">
          <XIcon size={11} className="text-muted-foreground" />
        </button>
      </div>

      {/* Title + badges */}
      <div className="pr-14">
        <p className="text-sm font-semibold text-foreground leading-tight">{session.title}</p>
        <p className="text-[11px] text-muted-foreground mt-0.5">{session.provider}</p>
      </div>

      <div className="flex flex-wrap gap-1.5">
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[session.status]}`}>
          {STATUS_LABELS[session.status]}
        </span>
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
          {session.category}
        </span>
      </div>

      {/* Progress */}
      <ProgressBar value={session.progress} color={progressColor} />

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Start</p>
          <p className="text-foreground">{formatDate(session.startDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">End</p>
          <p className="text-foreground">{formatDate(session.endDate)}</p>
        </div>
      </div>

      {session.notes && (
        <p className="text-[11px] text-muted-foreground border-t border-border/40 pt-2 line-clamp-2">
          {session.notes}
        </p>
      )}

      {/* Delete overlay */}
      {confirming && (
        <div className="absolute inset-0 rounded-xl bg-background/85 backdrop-blur-sm flex items-center justify-center gap-3">
          <p className="text-xs text-foreground font-medium">Remove this training?</p>
          <button onClick={() => onDelete(session.id)}
            className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity">
            Remove
          </button>
          <button onClick={() => setConfirming(false)}
            className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Goal Form ────────────────────────────────────────────────────────────────

function GoalForm({
  initial, onSave, onCancel, saveLabel = 'Add Goal',
}: {
  initial:    Omit<SkillGoal, 'id'>;
  onSave:     (data: Omit<SkillGoal, 'id'>) => void;
  onCancel:   () => void;
  saveLabel?: string;
}) {
  const [form,  setForm]  = useState(initial);
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.goal.trim()) { setError('Goal description is required'); return; }
    onSave(form);
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-3 border border-border/50">
      <div>
        <label className="text-xs text-muted-foreground mb-1.5 block">Skill goal</label>
        <Input placeholder="e.g. Master advanced circuit design techniques"
          value={form.goal} onChange={e => { setForm(p => ({ ...p, goal: e.target.value })); setError(''); }} />
        {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Progress ({form.progress}%)</label>
          <input type="range" min={0} max={100} step={5} value={form.progress}
            onChange={e => setForm(p => ({ ...p, progress: Number(e.target.value) }))}
            className="w-full accent-primary" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Due date <span className="text-muted-foreground/60">(optional)</span></label>
          <input type="date" value={form.dueDate}
            onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} className={selectCls} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
          Cancel
        </button>
        <button type="button" onClick={handleSave}
          className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Goal Row ─────────────────────────────────────────────────────────────────

function GoalRow({
  goal, onEdit, onDelete,
}: {
  goal:     SkillGoal;
  onEdit:   (id: string, data: Omit<SkillGoal, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) return (
    <GoalForm
      initial={{ goal: goal.goal, progress: goal.progress, dueDate: goal.dueDate }}
      onSave={data => { onEdit(goal.id, data); setEditing(false); }}
      onCancel={() => setEditing(false)}
      saveLabel="Save Changes"
    />
  );

  const isComplete = goal.progress >= 100;

  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/40 rounded-xl border border-border/40 group relative">
      {/* Completion circle */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
        isComplete ? 'bg-success border-success' : 'border-border'
      }`}>
        {isComplete && <CheckIcon size={10} className="text-white" />}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
          <p className={`text-sm font-medium flex-1 ${isComplete ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
            {goal.goal}
          </p>
          {goal.dueDate && (
            <span className="text-[10px] text-muted-foreground shrink-0">
              Due {formatDate(goal.dueDate)}
            </span>
          )}
        </div>
        <ProgressBar
          value={goal.progress}
          color={isComplete ? 'bg-success' : goal.progress >= 60 ? 'bg-warning' : 'bg-primary'}
        />
      </div>

      {/* Actions */}
      {!confirming && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button onClick={() => setEditing(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors">
            <PencilIcon size={11} className="text-muted-foreground" />
          </button>
          <button onClick={() => setConfirming(true)}
            className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors">
            <XIcon size={11} className="text-muted-foreground" />
          </button>
        </div>
      )}
      {confirming && (
        <div className="flex items-center gap-2 shrink-0">
          <p className="text-[11px] text-foreground">Delete?</p>
          <button onClick={() => onDelete(goal.id)}
            className="text-[11px] px-2 py-0.5 rounded bg-destructive text-destructive-foreground hover:opacity-90">
            Yes
          </button>
          <button onClick={() => setConfirming(false)}
            className="text-[11px] px-2 py-0.5 rounded bg-secondary text-secondary-foreground hover:bg-secondary/70">
            No
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main: TrainingDevelopment ────────────────────────────────────────────────

export default function TrainingDevelopment({
  initialSessions = [], initialGoals = [], onChange,
}: TrainingDevelopmentProps) {
  const [sessions,     setSessions]     = useState<TrainingSession[]>(initialSessions);
  const [goals,        setGoals]        = useState<SkillGoal[]>(initialGoals);
  const [showAddTrain, setShowAddTrain] = useState(false);
  const [showAddGoal,  setShowAddGoal]  = useState(false);
  const [activeFilter, setActiveFilter] = useState<'all' | TrainingStatus>('all');

  function updateSessions(updated: TrainingSession[]) {
    setSessions(updated); onChange?.(updated, goals);
  }
  function updateGoals(updated: SkillGoal[]) {
    setGoals(updated); onChange?.(sessions, updated);
  }

  function addSession(data: Omit<TrainingSession, 'id'>) {
    updateSessions([...sessions, { ...data, id: genId() }]);
    setShowAddTrain(false);
  }
  function editSession(id: string, data: Omit<TrainingSession, 'id'>) {
    updateSessions(sessions.map(s => s.id === id ? { ...data, id } : s));
  }
  function deleteSession(id: string) {
    updateSessions(sessions.filter(s => s.id !== id));
  }

  function addGoal(data: Omit<SkillGoal, 'id'>) {
    updateGoals([...goals, { ...data, id: genId() }]);
    setShowAddGoal(false);
  }
  function editGoal(id: string, data: Omit<SkillGoal, 'id'>) {
    updateGoals(goals.map(g => g.id === id ? { ...data, id } : g));
  }
  function deleteGoal(id: string) {
    updateGoals(goals.filter(g => g.id !== id));
  }

  const filteredSessions = activeFilter === 'all'
    ? sessions
    : sessions.filter(s => s.status === activeFilter);

  const completedCount  = sessions.filter(s => s.status === 'completed').length;
  const upcomingCount   = sessions.filter(s => s.status === 'upcoming').length;
  const inProgressCount = sessions.filter(s => s.status === 'in_progress').length;
  const goalsComplete   = goals.filter(g => g.progress >= 100).length;

  return (
    <div className="space-y-5">

      {/* ── Summary strip ── */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Upcoming',    value: upcomingCount,   color: 'text-primary'     },
          { label: 'In Progress', value: inProgressCount, color: 'text-warning'     },
          { label: 'Completed',   value: completedCount,  color: 'text-success'     },
          { label: 'Goals Done',  value: `${goalsComplete}/${goals.length}`, color: 'text-foreground' },
        ].map(stat => (
          <div key={stat.label} className="glass rounded-xl p-4 text-center">
            <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── Training Sessions ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Training Sessions</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">{sessions.length} session{sessions.length !== 1 ? 's' : ''}</p>
          </div>
          <div className="flex items-center gap-2">
            {/* Filter pills */}
            <div className="flex gap-1">
              {(['all', 'upcoming', 'in_progress', 'completed'] as const).map(f => (
                <button key={f} onClick={() => setActiveFilter(f)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg transition-colors ${
                    activeFilter === f
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-secondary text-muted-foreground hover:text-foreground'
                  }`}>
                  {f === 'all' ? 'All' : f === 'in_progress' ? 'In Progress' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
            {!showAddTrain && (
              <button onClick={() => setShowAddTrain(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
                <PlusIcon size={13} /> Add Training
              </button>
            )}
          </div>
        </div>

        {showAddTrain && (
          <div className="mb-4">
            <TrainingForm initial={emptySession} onSave={addSession} onCancel={() => setShowAddTrain(false)} />
          </div>
        )}

        {filteredSessions.length === 0 && !showAddTrain ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 text-lg">📚</div>
            <p className="text-sm text-muted-foreground">
              {activeFilter === 'all' ? 'No training sessions yet' : `No ${activeFilter.replace('_', ' ')} sessions`}
            </p>
            {activeFilter === 'all' && (
              <button onClick={() => setShowAddTrain(true)}
                className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors">
                Add the first session
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filteredSessions.map(session => (
              <TrainingCard key={session.id} session={session} onEdit={editSession} onDelete={deleteSession} />
            ))}
          </div>
        )}
      </div>

      {/* ── Skill-building Goals ── */}
      <div className="glass rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Skill-building Goals</h3>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {goalsComplete} of {goals.length} completed
            </p>
          </div>
          {!showAddGoal && (
            <button onClick={() => setShowAddGoal(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
              <PlusIcon size={13} /> Add Goal
            </button>
          )}
        </div>

        {showAddGoal && (
          <div className="mb-4">
            <GoalForm initial={emptyGoal} onSave={addGoal} onCancel={() => setShowAddGoal(false)} />
          </div>
        )}

        {goals.length === 0 && !showAddGoal ? (
          <div className="flex flex-col items-center justify-center py-10 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 text-lg">🎯</div>
            <p className="text-sm text-muted-foreground">No skill goals set yet</p>
            <button onClick={() => setShowAddGoal(true)}
              className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors">
              Add the first goal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {goals.map(goal => (
              <GoalRow key={goal.id} goal={goal} onEdit={editGoal} onDelete={deleteGoal} />
            ))}
          </div>
        )}
      </div>

    </div>
  );
}