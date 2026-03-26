import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { XIcon } from '@/components/icons/Icons';
import SkillsInput, { Capability } from '../components/ui/skillsInput'; 

export interface WorkerFormData {
  name: string;
  role: string;
  department: string;
  email: string;
  status: 'active' | 'on_leave' | 'inactive';
  dailyCap: string;
  capabilities: Capability[]; // ← reuses the exported type
}

interface AddWorkerModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: WorkerFormData) => void;
  /** When provided the modal operates in edit mode */
  initialData?: WorkerFormData;
}

const DEPARTMENTS = ['Construction', 'Engineering', 'QA', 'Field Service', 'Management'];

const STATUS_OPTIONS: { value: WorkerFormData['status']; label: string }[] = [
  { value: 'active',   label: 'Active'   },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
];

const emptyForm: WorkerFormData = {
  name:         '',
  role:         '',
  department:   DEPARTMENTS[0],
  email:        '',
  status:       'active',
  dailyCap:     '8',
  capabilities: [{ name: '', proficiency: 3 }],
};

export default function AddWorkerModal({ open, onClose, onSubmit, initialData }: AddWorkerModalProps) {
  const isEditMode = Boolean(initialData);

  const [form, setForm]     = useState<WorkerFormData>(initialData ?? emptyForm);
  const [errors, setErrors] = useState<Partial<Record<keyof WorkerFormData, string>>>({});

  useEffect(() => {
    if (open) {
      setForm(initialData ?? emptyForm);
      setErrors({});
    }
  }, [open, initialData]);

  if (!open) return null;

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.name.trim())  next.name  = 'Name is required';
    if (!form.role.trim())  next.role  = 'Role is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = 'Invalid email address';
    if (!form.dailyCap || isNaN(Number(form.dailyCap)) || Number(form.dailyCap) <= 0)
      next.dailyCap = 'Enter a valid number of hours';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    onSubmit(form);
    onClose();
  }

  function handleClose() {
    setErrors({});
    onClose();
  }

  function setField<K extends keyof WorkerFormData>(key: K, value: WorkerFormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  const initials = form.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="glass w-full max-w-lg max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-fade-in"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                {initials || 'WF'}
              </div>
              <div>
                <h2 className="text-base font-semibold text-foreground">
                  {isEditMode ? 'Edit Worker' : 'Add Worker'}
                </h2>
                <p className="text-xs text-muted-foreground">
                  {isEditMode ? 'Update the details below' : 'Fill in the details below'}
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
            >
              <XIcon size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Basic Info */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                  Basic information
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Full name</label>
                    <Input
                      placeholder="e.g. Ahmed Hassan"
                      value={form.name}
                      onChange={e => setField('name', e.target.value)}
                    />
                    {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Role</label>
                      <Input
                        placeholder="e.g. Electrician"
                        value={form.role}
                        onChange={e => setField('role', e.target.value)}
                      />
                      {errors.role && <p className="text-[11px] text-destructive mt-1">{errors.role}</p>}
                    </div>
                    <div>
                      <label className="text-xs text-muted-foreground mb-1.5 block">Department</label>
                      <select
                        value={form.department}
                        onChange={e => setField('department', e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
                    <Input
                      type="email"
                      placeholder="e.g. ahmed@company.com"
                      value={form.email}
                      onChange={e => setField('email', e.target.value)}
                    />
                    {errors.email && <p className="text-[11px] text-destructive mt-1">{errors.email}</p>}
                  </div>
                </div>
              </div>

              {/* Work Settings */}
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 font-medium">
                  Work settings
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Status</label>
                    <select
                      value={form.status}
                      onChange={e => setField('status', e.target.value as WorkerFormData['status'])}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {STATUS_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground mb-1.5 block">Daily cap (hours)</label>
                    <Input
                      type="number"
                      min="1"
                      max="24"
                      placeholder="8"
                      value={form.dailyCap}
                      onChange={e => setField('dailyCap', e.target.value)}
                    />
                    {errors.dailyCap && <p className="text-[11px] text-destructive mt-1">{errors.dailyCap}</p>}
                  </div>
                </div>
              </div>

              {/* ✅ Skills — standalone reusable SkillsInput component */}
              <SkillsInput
                capabilities={form.capabilities}
                onChange={caps => setField('capabilities', caps)}
              />

            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border/50 shrink-0">
              <button
                type="button"
                onClick={handleClose}
                className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="text-sm px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                {isEditMode ? 'Save Changes' : 'Add Worker'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}