import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { PencilIcon, CheckIcon, XIcon } from '@/components/icons/Icons';
import { workerService } from '@/services/workerService';

export interface EmergencyContactData {
  fullName:     string;
  relationship: string;
  phone:        string;
  email:        string;
  address:      string;
}

interface EmergencyContactProps {
  workerId: number;
}

const RELATIONSHIPS = ['Spouse', 'Parent', 'Sibling', 'Child', 'Friend', 'Other'];

const emptyContact: EmergencyContactData = {
  fullName:     '',
  relationship: RELATIONSHIPS[0],
  phone:        '',
  email:        '',
  address:      '',
};

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{label}</p>
      <p className="text-sm text-foreground">
        {value || <span className="text-muted-foreground italic">Not provided</span>}
      </p>
    </div>
  );
}

export default function EmergencyContact({ workerId }: EmergencyContactProps) {
  const [data,       setData]       = useState<EmergencyContactData>(emptyContact);
  const [editing,    setEditing]    = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [form,       setForm]       = useState<EmergencyContactData>(emptyContact);
  const [errors,     setErrors]     = useState<Partial<Record<keyof EmergencyContactData, string>>>({});
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  useEffect(() => {
    workerService.getEmergencyContact(workerId)
      .then(contact => {
        // contact is null when none exists (404 or null body with 200)
        if (contact && contact.fullName) {
          const mapped: EmergencyContactData = {
            fullName:     contact.fullName,
            relationship: contact.relationship || RELATIONSHIPS[0],
            phone:        contact.phone,
            email:        contact.email,
            address:      contact.address,
          };
          setData(mapped);
          setForm(mapped);
        } else {
          setEditing(true);
        }
      })
      .catch(() => setError('Failed to load emergency contact'))
      .finally(() => setLoading(false));
  }, [workerId]);

  function setField<K extends keyof EmergencyContactData>(key: K, value: string) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.phone.trim())    next.phone    = 'Phone number is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSave() {
    if (!validate()) return;
    try {
      await workerService.upsertEmergencyContact(workerId, {
        full_name:    form.fullName,
        relationship: form.relationship,
        phone:        form.phone,
        email:        form.email    || undefined,
        address:      form.address  || undefined,
      });
      setData(form);
      setEditing(false);
      setError('');
    } catch {
      setError('Failed to save emergency contact');
    }
  }

  function handleCancel() {
    setForm(data);
    setErrors({});
    setEditing(false);
  }

  async function handleDelete() {
    try {
      await workerService.deleteEmergencyContact(workerId);
      setData(emptyContact);
      setForm(emptyContact);
      setConfirming(false);
      setEditing(true);
      setError('');
    } catch {
      setError('Failed to delete emergency contact');
    }
  }

  const hasData  = data.fullName.trim() !== '';
  const initials = data.fullName
    .split(' ').filter(Boolean).slice(0, 2)
    .map(n => n[0].toUpperCase()).join('');

  if (loading) return <p className="text-xs text-muted-foreground p-5">Loading…</p>;

  return (
    <div className="glass rounded-xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Emergency Contact</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Person to contact in case of emergency
          </p>
        </div>
        {!editing && hasData && !confirming && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
            >
              <PencilIcon size={13} />
              Edit
            </button>
            <button
              onClick={() => setConfirming(true)}
              className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors"
              title="Delete contact"
            >
              <XIcon size={13} className="text-muted-foreground" />
            </button>
          </div>
        )}
      </div>

      {error && <p className="text-xs text-destructive mb-3">{error}</p>}

      {/* Delete confirmation */}
      {confirming && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-3 mb-4">
          <p className="text-xs text-foreground flex-1">Delete this emergency contact?</p>
          <button
            onClick={handleDelete}
            className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
          >
            Delete
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}

      {/* Edit form */}
      {editing ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Full name</label>
              <Input
                placeholder="e.g. Sarah Hassan"
                value={form.fullName}
                onChange={e => setField('fullName', e.target.value)}
              />
              {errors.fullName && <p className="text-[11px] text-destructive mt-1">{errors.fullName}</p>}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Relationship</label>
              <select
                value={form.relationship}
                onChange={e => setField('relationship', e.target.value)}
                className={selectCls}
              >
                {RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Phone number</label>
              <Input
                placeholder="e.g. +1 555 000 1234"
                value={form.phone}
                onChange={e => setField('phone', e.target.value)}
              />
              {errors.phone && <p className="text-[11px] text-destructive mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email</label>
              <Input
                type="email"
                placeholder="e.g. sarah@email.com"
                value={form.email}
                onChange={e => setField('email', e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-muted-foreground mb-1.5 block">Address</label>
            <Input
              placeholder="e.g. 123 Main St, City, Country"
              value={form.address}
              onChange={e => setField('address', e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-1">
            {hasData && (
              <button
                type="button"
                onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              type="button"
              onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              Save Contact
            </button>
          </div>
        </div>

      ) : hasData && !confirming ? (
        <div className="space-y-5">
          <div className="flex items-center gap-4 p-4 bg-secondary/40 rounded-xl border border-border/40">
            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground shrink-0">
              {initials || '?'}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{data.fullName}</p>
              <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md mt-1 inline-block">
                {data.relationship}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-6 gap-y-4">
            <FieldRow label="Phone"   value={data.phone}   />
            <FieldRow label="Email"   value={data.email}   />
            <FieldRow label="Address" value={data.address} />
          </div>
        </div>

      ) : !confirming ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <CheckIcon size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No emergency contact added yet</p>
          <button
            onClick={() => setEditing(true)}
            className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
          >
            Add emergency contact
          </button>
        </div>
      ) : null}
    </div>
  );
}