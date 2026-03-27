import { useState } from 'react';
import { XIcon } from '@/components/icons/Icons';
import { projectService, ProjectCreatePayload } from '@/services/projectService';

interface CreateProjectModalProps {
  onClose: () => void;
  onCreated?: () => void;
}

const STATUSES = ['active', 'inactive', 'completed', 'on_hold'];

const defaultForm: ProjectCreatePayload = {
  name: '',
  description: '',
  start_date: '',
  end_date: '',
  status: 'active',
};

export default function CreateProjectModal({ onClose, onCreated }: CreateProjectModalProps) {
  const [form, setForm] = useState<ProjectCreatePayload>(defaultForm);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof ProjectCreatePayload, string>>>({});
  const [apiError, setApiError] = useState('');

  const set = (field: keyof ProjectCreatePayload, value: any) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
    setApiError('');
  };

  const validate = () => {
    const errs: Partial<Record<keyof ProjectCreatePayload, string>> = {};
    if (!form.name.trim()) errs.name = 'Name is required';
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
      await projectService.createProject({
        ...form,
        description: form.description || null,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
      });
      onCreated?.();
      onClose();
    } catch (err: any) {
      setApiError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <div className="relative glass rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto scrollbar-thin shadow-2xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 glass z-10">
          <div>
            <h2 className="text-base font-semibold text-foreground">Create Project</h2>
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

          <Field label="Name" error={errors.name} required>
            <input
              type="text"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              placeholder="e.g. Website Redesign"
              className={inputCls(!!errors.name)}
            />
          </Field>

          <Field label="Description" hint="optional">
            <textarea
              rows={3}
              value={form.description ?? ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe the project..."
              className={inputCls() + ' resize-none'}
            />
          </Field>

          <Field label="Status">
            <select value={form.status} onChange={e => set('status', e.target.value)} className={inputCls()}>
              {STATUSES.map(s => (
                <option key={s} value={s}>{s.replace('_', ' ')}</option>
              ))}
            </select>
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
            {loading ? 'Creating...' : 'Create Project'}
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