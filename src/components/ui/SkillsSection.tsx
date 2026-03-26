import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { PlusIcon, PencilIcon, XIcon, CheckIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Skill {
  id: string;
  name: string;
  category: string;
  proficiency: number; // 1–5
}

interface SkillsSectionProps {
  initialSkills?: Skill[];
  onChange?: (skills: Skill[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const SKILL_CATEGORIES = ['Technical', 'Safety', 'Management', 'Quality', 'Field', 'Other'];

const emptySkill: Omit<Skill, 'id'> = { name: '', category: SKILL_CATEGORIES[0], proficiency: 3 };

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

// ─── Proficiency Dots ─────────────────────────────────────────────────────────

export function ProficiencyDots({
  value,
  onChange,
  readonly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readonly?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(level =>
        readonly ? (
          <div
            key={level}
            className={`w-2.5 h-2.5 rounded-full ${level <= value ? 'bg-primary' : 'bg-muted'}`}
          />
        ) : (
          <button
            key={level}
            type="button"
            onClick={() => onChange?.(level)}
            className={`w-5 h-5 rounded-full border transition-colors ${
              level <= value
                ? 'bg-primary border-primary'
                : 'bg-transparent border-border hover:border-primary/50'
            }`}
          />
        ),
      )}
    </div>
  );
}

// ─── Skill Form (inline) ──────────────────────────────────────────────────────

function SkillForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Skill, 'id'>;
  onSave: (data: Omit<Skill, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');

  function handleSave() {
    if (!form.name.trim()) { setError('Skill name is required'); return; }
    onSave(form);
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-3 border border-border/50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Skill name</label>
          <Input
            placeholder="e.g. Electrical Wiring"
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setError(''); }}
          />
          {error && <p className="text-[11px] text-destructive mt-1">{error}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className={selectCls}
          >
            {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-2 block">Proficiency level</label>
        <ProficiencyDots value={form.proficiency} onChange={v => setForm(f => ({ ...f, proficiency: v }))} />
        <p className="text-[10px] text-muted-foreground mt-1.5">
          {['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][form.proficiency]}
        </p>
      </div>
      <div className="flex justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
        >
          Save Skill
        </button>
      </div>
    </div>
  );
}

// ─── Main: SkillsSection ──────────────────────────────────────────────────────

export default function SkillsSection({ initialSkills = [], onChange }: SkillsSectionProps) {
  const [skills, setSkills] = useState<Skill[]>(initialSkills);
  const [showAddSkill,    setShowAddSkill]    = useState(false);
  const [editingSkillId,  setEditingSkillId]  = useState<string | null>(null);
  const [deletingSkillId, setDeletingSkillId] = useState<string | null>(null);

  function update(updated: Skill[]) {
    setSkills(updated);
    onChange?.(updated);
  }

  function addSkill(data: Omit<Skill, 'id'>) {
    update([...skills, { ...data, id: genId() }]);
    setShowAddSkill(false);
  }

  function saveSkill(id: string, data: Omit<Skill, 'id'>) {
    update(skills.map(s => s.id === id ? { ...data, id } : s));
    setEditingSkillId(null);
  }

  function deleteSkill(id: string) {
    update(skills.filter(s => s.id !== id));
    setDeletingSkillId(null);
  }

  return (
    <div className="glass rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Skills</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {skills.length} skill{skills.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {!showAddSkill && (
          <button
            onClick={() => { setShowAddSkill(true); setEditingSkillId(null); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            <PlusIcon size={13} />
            Add Skill
          </button>
        )}
      </div>

      {/* Add skill form */}
      {showAddSkill && (
        <div className="mb-4">
          <SkillForm
            initial={emptySkill}
            onSave={addSkill}
            onCancel={() => setShowAddSkill(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {skills.length === 0 && !showAddSkill ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <CheckIcon size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No skills added yet</p>
          <button
            onClick={() => setShowAddSkill(true)}
            className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
          >
            Add the first skill
          </button>
        </div>
      ) : (
        /* Skills grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {skills.map(skill => (
            <div key={skill.id}>
              {editingSkillId === skill.id ? (
                <SkillForm
                  initial={{ name: skill.name, category: skill.category, proficiency: skill.proficiency }}
                  onSave={data => saveSkill(skill.id, data)}
                  onCancel={() => setEditingSkillId(null)}
                />
              ) : (
                <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3 group relative">
                  {/* Action buttons */}
                  <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => { setEditingSkillId(skill.id); setShowAddSkill(false); }}
                      className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors"
                      title="Edit skill"
                    >
                      <PencilIcon size={11} className="text-muted-foreground" />
                    </button>
                    {deletingSkillId === skill.id ? (
                      <>
                        <button
                          onClick={() => deleteSkill(skill.id)}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-destructive/15 hover:bg-destructive/30 transition-colors"
                          title="Confirm delete"
                        >
                          <CheckIcon size={11} className="text-destructive" />
                        </button>
                        <button
                          onClick={() => setDeletingSkillId(null)}
                          className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors"
                          title="Cancel"
                        >
                          <XIcon size={11} className="text-muted-foreground" />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setDeletingSkillId(skill.id)}
                        className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors"
                        title="Delete skill"
                      >
                        <XIcon size={11} className="text-muted-foreground hover:text-destructive" />
                      </button>
                    )}
                  </div>

                  {/* Skill info */}
                  <div>
                    <p className="text-sm font-semibold text-foreground pr-14">{skill.name}</p>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md mt-1 inline-block">
                      {skill.category}
                    </span>
                  </div>

                  <div>
                    <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider">
                      Proficiency
                    </p>
                    <div className="flex items-center gap-2">
                      <ProficiencyDots value={skill.proficiency} readonly />
                      <span className="text-[11px] text-muted-foreground">
                        {['', 'Beginner', 'Basic', 'Intermediate', 'Advanced', 'Expert'][skill.proficiency]}
                      </span>
                    </div>
                  </div>

                  {/* Delete confirmation overlay */}
                  {deletingSkillId === skill.id && (
                    <div className="absolute inset-0 rounded-xl bg-background/80 backdrop-blur-sm flex items-center justify-center gap-3">
                      <p className="text-xs text-foreground font-medium">Delete this skill?</p>
                      <button
                        onClick={() => deleteSkill(skill.id)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
                      >
                        Delete
                      </button>
                      <button
                        onClick={() => setDeletingSkillId(null)}
                        className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}