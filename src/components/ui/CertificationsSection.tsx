import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PlusIcon, CheckIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Certification {
  id: string;
  name: string;
  category: string;
  expiryDate: string; // ISO date string YYYY-MM-DD
}

interface CertificationsSectionProps {
  initialCerts?: Certification[];
  onChange?: (certs: Certification[]) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const CERT_CATEGORIES = ['Safety', 'Compliance', 'Technical', 'Professional', 'Other'];

const emptyCert: Omit<Certification, 'id'> = { name: '', category: CERT_CATEGORIES[0], expiryDate: '' };

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function getCertStatus(expiryDate: string): 'valid' | 'expiring' | 'expired' {
  const today    = new Date();
  const expiry   = new Date(expiryDate);
  const diffDays = (expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays < 0)   return 'expired';
  if (diffDays <= 30) return 'expiring';
  return 'valid';
}

const CERT_STATUS_STYLES = {
  valid:    'bg-success/15 text-success',
  expiring: 'bg-warning/15 text-warning',
  expired:  'bg-destructive/15 text-destructive',
};

const CERT_STATUS_LABELS = {
  valid:    'Valid',
  expiring: 'Expiring Soon',
  expired:  'Expired',
};

// ─── Cert Form (inline) ───────────────────────────────────────────────────────

function CertForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Omit<Certification, 'id'>;
  onSave:   (data: Omit<Certification, 'id'>) => void;
  onCancel: () => void;
}) {
  const [form, setForm]     = useState(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof typeof form, string>>>({});

  function handleSave() {
    const next: typeof errors = {};
    if (!form.name.trim()) next.name       = 'Certification name is required';
    if (!form.expiryDate)  next.expiryDate = 'Expiry date is required';
    setErrors(next);
    if (Object.keys(next).length) return;
    onSave(form);
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-3 border border-border/50">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Certification name</label>
          <Input
            placeholder="e.g. OSHA 30-Hour"
            value={form.name}
            onChange={e => { setForm(f => ({ ...f, name: e.target.value })); setErrors(p => ({ ...p, name: undefined })); }}
          />
          {errors.name && <p className="text-[11px] text-destructive mt-1">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">Category</label>
          <select
            value={form.category}
            onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
            className={selectCls}
          >
            {CERT_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>
      <div className="w-1/2">
        <label className="text-xs text-muted-foreground mb-1.5 block">Expiry date</label>
        <input
          type="date"
          value={form.expiryDate}
          onChange={e => { setForm(f => ({ ...f, expiryDate: e.target.value })); setErrors(p => ({ ...p, expiryDate: undefined })); }}
          className={selectCls}
        />
        {errors.expiryDate && <p className="text-[11px] text-destructive mt-1">{errors.expiryDate}</p>}
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
          Save Certification
        </button>
      </div>
    </div>
  );
}

// ─── Main: CertificationsSection ─────────────────────────────────────────────

export default function CertificationsSection({ initialCerts = [], onChange }: CertificationsSectionProps) {
  const [certs,       setCerts]       = useState<Certification[]>(initialCerts);
  const [showAddCert, setShowAddCert] = useState(false);

  function addCert(data: Omit<Certification, 'id'>) {
    const updated = [...certs, { ...data, id: genId() }];
    setCerts(updated);
    onChange?.(updated);
    setShowAddCert(false);
  }

  return (
    <div className="glass rounded-xl p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Certifications</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {certs.length} certification{certs.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        {!showAddCert && (
          <button
            onClick={() => setShowAddCert(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            <PlusIcon size={13} />
            Add Certification
          </button>
        )}
      </div>

      {/* Add cert form */}
      {showAddCert && (
        <div className="mb-4">
          <CertForm
            initial={emptyCert}
            onSave={addCert}
            onCancel={() => setShowAddCert(false)}
          />
        </div>
      )}

      {/* Empty state */}
      {certs.length === 0 && !showAddCert ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <CheckIcon size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No certifications added yet</p>
          <button
            onClick={() => setShowAddCert(true)}
            className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
          >
            Add the first certification
          </button>
        </div>
      ) : (
        /* Certs table */
        <Table>
          <TableHeader>
            <TableRow className="bg-secondary/30 hover:bg-secondary/30">
              <TableHead className="text-[10px] uppercase tracking-wider">Certification</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Category</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Expiry Date</TableHead>
              <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {certs.map(cert => {
              const status = getCertStatus(cert.expiryDate);
              return (
                <TableRow key={cert.id}>
                  <TableCell>
                    <p className="text-sm text-foreground font-medium">{cert.name}</p>
                  </TableCell>
                  <TableCell>
                    <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md">
                      {cert.category}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {cert.expiryDate}
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${CERT_STATUS_STYLES[status]}`}>
                      {CERT_STATUS_LABELS[status]}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </div>
  );
}