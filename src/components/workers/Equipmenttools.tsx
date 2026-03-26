import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { PlusIcon, PencilIcon, XIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Equipment {
  id:           string;
  name:         string;
  equipmentId:  string;
  category:     string;
  assignedDate: string;
  returnDate:   string;
  condition:    'Good' | 'Fair' | 'Poor';
}

interface EquipmentToolsProps {
  initialEquipment?: Equipment[];
  onChange?:         (equipment: Equipment[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES  = ['Vehicle', 'Tool', 'Device', 'Safety Gear', 'Machinery', 'Other'];
const CONDITIONS  = ['Good', 'Fair', 'Poor'] as const;

const emptyEquipment: Omit<Equipment, 'id'> = {
  name:         '',
  equipmentId:  '',
  category:     CATEGORIES[0],
  assignedDate: '',
  returnDate:   '',
  condition:    'Good',
};

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const CONDITION_STYLES: Record<Equipment['condition'], string> = {
  Good: 'bg-success/15 text-success',
  Fair: 'bg-warning/15 text-warning',
  Poor: 'bg-destructive/15 text-destructive',
};

const CATEGORY_ICONS: Record<string, string> = {
  Vehicle:     '🚗',
  Tool:        '🔧',
  Device:      '📱',
  'Safety Gear': '🦺',
  Machinery:   '⚙️',
  Other:       '📦',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatDate(iso: string): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ─── Equipment Form (inline) ──────────────────────────────────────────────────

function EquipmentForm({
  initial,
  onSave,
  onCancel,
  saveLabel = 'Add Equipment',
}: {
  initial:   Omit<Equipment, 'id'>;
  onSave:    (data: Omit<Equipment, 'id'>) => void;
  onCancel:  () => void;
  saveLabel?: string;
}) {
  const [form,   setForm]   = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function setField<K extends keyof typeof form>(key: K, value: typeof form[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  }

  function handleSave() {
    const next: typeof errors = {};
    if (!form.name.trim())        next.name        = 'Equipment name is required';
    if (!form.equipmentId.trim()) next.equipmentId = 'Equipment ID is required';
    if (!form.assignedDate)       next.assignedDate = 'Assigned date is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(form);
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-4 border border-border/50">
      <div className="grid grid-cols-2 gap-3">
        {/* Name */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Equipment name</label>
          <Input
            placeholder="e.g. Power Drill"
            value={form.name}
            onChange={e => setField('name', e.target.value)}
          />
          {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* Equipment ID */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Equipment ID</label>
          <Input
            placeholder="e.g. EQ-2024-001"
            value={form.equipmentId}
            onChange={e => setField('equipmentId', e.target.value)}
          />
          {errors.equipmentId && <p className="text-[11px] text-destructive mt-1">{errors.equipmentId}</p>}
        </div>

        {/* Category */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
          <select
            value={form.category}
            onChange={e => setField('category', e.target.value)}
            className={selectCls}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Condition */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Condition</label>
          <select
            value={form.condition}
            onChange={e => setField('condition', e.target.value as Equipment['condition'])}
            className={selectCls}
          >
            {CONDITIONS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>

        {/* Assigned date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Assigned date</label>
          <input
            type="date"
            value={form.assignedDate}
            onChange={e => setField('assignedDate', e.target.value)}
            className={selectCls}
          />
          {errors.assignedDate && <p className="text-[11px] text-destructive mt-1">{errors.assignedDate}</p>}
        </div>

        {/* Return date */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Return date <span className="text-muted-foreground/60">(optional)</span></label>
          <input
            type="date"
            value={form.returnDate}
            onChange={e => setField('returnDate', e.target.value)}
            className={selectCls}
          />
        </div>
      </div>

      {/* Actions */}
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
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Equipment Card ───────────────────────────────────────────────────────────

function EquipmentCard({
  item,
  onEdit,
  onDelete,
}: {
  item:     Equipment;
  onEdit:   (id: string, data: Omit<Equipment, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [confirming, setConfirming] = useState(false);

  if (editing) {
    return (
      <EquipmentForm
        initial={{ name: item.name, equipmentId: item.equipmentId, category: item.category,
                   assignedDate: item.assignedDate, returnDate: item.returnDate, condition: item.condition }}
        onSave={data => { onEdit(item.id, data); setEditing(false); }}
        onCancel={() => setEditing(false)}
        saveLabel="Save Changes"
      />
    );
  }

  return (
    <div className="bg-secondary/50 rounded-xl p-4 flex flex-col gap-3 group relative">

      {/* Action buttons */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setEditing(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors"
          title="Edit"
        >
          <PencilIcon size={11} className="text-muted-foreground" />
        </button>
        <button
          onClick={() => setConfirming(true)}
          className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors"
          title="Remove"
        >
          <XIcon size={11} className="text-muted-foreground" />
        </button>
      </div>

      {/* Top row: icon + name + ID */}
      <div className="flex items-start gap-3 pr-14">
        <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-base shrink-0">
          {CATEGORY_ICONS[item.category] ?? '📦'}
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground leading-tight">{item.name}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">{item.equipmentId}</p>
        </div>
      </div>

      {/* Badges row */}
      <div className="flex flex-wrap gap-1.5">
        <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
          {item.category}
        </span>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CONDITION_STYLES[item.condition]}`}>
          {item.condition}
        </span>
      </div>

      {/* Dates */}
      <div className="grid grid-cols-2 gap-2 text-[11px]">
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Assigned</p>
          <p className="text-foreground">{formatDate(item.assignedDate)}</p>
        </div>
        <div>
          <p className="text-muted-foreground uppercase tracking-wider text-[9px] mb-0.5">Return</p>
          <p className="text-foreground">{formatDate(item.returnDate)}</p>
        </div>
      </div>

      {/* Delete confirmation overlay */}
      {confirming && (
        <div className="absolute inset-0 rounded-xl bg-background/85 backdrop-blur-sm flex items-center justify-center gap-3">
          <p className="text-xs text-foreground font-medium">Remove this equipment?</p>
          <button
            onClick={() => onDelete(item.id)}
            className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
          >
            Remove
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main: EquipmentTools ─────────────────────────────────────────────────────

export default function EquipmentTools({ initialEquipment = [], onChange }: EquipmentToolsProps) {
  const [equipment,   setEquipment]   = useState<Equipment[]>(initialEquipment);
  const [showAddForm, setShowAddForm] = useState(false);

  function update(updated: Equipment[]) {
    setEquipment(updated);
    onChange?.(updated);
  }

  function handleAdd(data: Omit<Equipment, 'id'>) {
    update([...equipment, { ...data, id: genId() }]);
    setShowAddForm(false);
  }

  function handleEdit(id: string, data: Omit<Equipment, 'id'>) {
    update(equipment.map(e => e.id === id ? { ...data, id } : e));
  }

  function handleDelete(id: string) {
    update(equipment.filter(e => e.id !== id));
  }

  // Summary counts
  const goodCount = equipment.filter(e => e.condition === 'Good').length;
  const fairCount = equipment.filter(e => e.condition === 'Fair').length;
  const poorCount = equipment.filter(e => e.condition === 'Poor').length;

  return (
    <div className="glass rounded-xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Equipment & Tools</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {equipment.length} item{equipment.length !== 1 ? 's' : ''} assigned
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Condition summary pills */}
          {equipment.length > 0 && (
            <div className="flex gap-1.5">
              {goodCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-success/15 text-success font-medium">
                  {goodCount} Good
                </span>
              )}
              {fairCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-warning/15 text-warning font-medium">
                  {fairCount} Fair
                </span>
              )}
              {poorCount > 0 && (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-destructive/15 text-destructive font-medium">
                  {poorCount} Poor
                </span>
              )}
            </div>
          )}

          {!showAddForm && (
            <button
              onClick={() => setShowAddForm(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              <PlusIcon size={13} />
              Assign Equipment
            </button>
          )}
        </div>
      </div>

      {/* Add form */}
      {showAddForm && (
        <div className="mb-5">
          <EquipmentForm
            initial={emptyEquipment}
            onSave={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {equipment.length === 0 && !showAddForm ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 text-lg">
            🔧
          </div>
          <p className="text-sm text-muted-foreground">No equipment assigned yet</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
          >
            Assign the first item
          </button>
        </div>
      ) : (
        /* Equipment grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {equipment.map(item => (
            <EquipmentCard
              key={item.id}
              item={item}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}