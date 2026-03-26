import { useState } from 'react';
import { workers } from '@/data/mockData';

// ─── Types ────────────────────────────────────────────────────────────────────

interface SplitSlot {
  id: string;
  workerId: string;
  allocatedHours: number;
}

interface SplitTaskModalProps {
  taskId: string;
  taskTitle: string;
  totalHours: number;
  requiredCapability: string;
  onClose: () => void;
  onConfirm: (slots: SplitSlot[]) => void;
}

// ─── Available workers with capacity info ─────────────────────────────────────

const workerAvailability: Record<string, number> = {
  w1: 18,
  w2: 24,
  w3: 32,
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

let slotCounter = 1;
function makeSlot(workerId = ''): SplitSlot {
  return { id: `slot_${slotCounter++}`, workerId, allocatedHours: 0 };
}

function totalAllocated(slots: SplitSlot[]) {
  return slots.reduce((s, sl) => s + (sl.allocatedHours || 0), 0);
}

function HoursInput({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm flex items-center justify-center"
      >−</button>
      <input
        type="number"
        min={0}
        max={max}
        value={value || ''}
        onChange={e => onChange(Math.min(max, Math.max(0, Number(e.target.value))))}
        className="w-14 text-center text-sm font-medium bg-secondary border border-border rounded px-1 py-0.5 text-foreground focus:outline-none focus:border-primary"
        placeholder="0"
      />
      <span className="text-xs text-muted-foreground">h</span>
      <button
        onClick={() => onChange(Math.min(max, value + 1))}
        className="w-6 h-6 rounded border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors text-sm flex items-center justify-center"
      >+</button>
    </div>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SplitTaskModal({
  taskTitle,
  totalHours,
  requiredCapability,
  onClose,
  onConfirm,
}: SplitTaskModalProps) {
  const [slots, setSlots] = useState<SplitSlot[]>([makeSlot(), makeSlot()]);

  const allocated = totalAllocated(slots);
  const remaining = totalHours - allocated;
  const isValid = allocated === totalHours && slots.every(s => s.workerId && s.allocatedHours > 0);
  const filledPct = Math.min(100, Math.round((allocated / totalHours) * 100));

  function addSlot() {
    setSlots(prev => [...prev, makeSlot()]);
  }

  function removeSlot(id: string) {
    setSlots(prev => prev.filter(s => s.id !== id));
  }

  function updateSlot(id: string, patch: Partial<SplitSlot>) {
    setSlots(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s));
  }

  function autoDistribute() {
    const count = slots.length;
    const base = Math.floor(totalHours / count);
    const rem = totalHours % count;
    setSlots(prev =>
      prev.map((s, i) => ({ ...s, allocatedHours: base + (i === 0 ? rem : 0) }))
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 animate-fade-in">
      <div className="bg-background border border-border rounded-2xl shadow-2xl w-[560px] max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <h2 className="text-base font-bold text-foreground">Split Task</h2>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-[360px] truncate">{taskTitle}</p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground border border-border">
                {totalHours}h total
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                {requiredCapability}
              </span>
            </div>
          </div>
          <button onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-lg leading-none mt-0.5">
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div className="px-6 py-3 bg-secondary/20 border-b border-border shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-muted-foreground">Hours allocated</span>
            <div className="flex items-center gap-2">
              <span className={`text-[11px] font-medium tabular-nums
                ${remaining === 0 ? 'text-success' : remaining < 0 ? 'text-destructive' : 'text-foreground'}`}>
                {allocated}h / {totalHours}h
              </span>
              {remaining !== 0 && (
                <span className={`text-[11px] ${remaining > 0 ? 'text-warning' : 'text-destructive'}`}>
                  ({remaining > 0 ? `${remaining}h unassigned` : `${Math.abs(remaining)}h over`})
                </span>
              )}
            </div>
          </div>
          <div className="h-2 rounded-full bg-secondary overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-300
                ${remaining === 0 ? 'bg-success' : remaining < 0 ? 'bg-destructive' : 'bg-primary'}`}
              style={{ width: `${filledPct}%` }}
            />
          </div>
        </div>

        {/* Slots */}
        <div className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">

          {slots.map((slot, idx) => {
            const worker = workers.find(w => w.id === slot.workerId);
            const avail = slot.workerId ? (workerAvailability[slot.workerId] ?? 8) : null;
            const overCapacity = avail !== null && slot.allocatedHours > avail;

            return (
              <div key={slot.id}
                className={`rounded-xl border p-4 transition-colors
                  ${overCapacity ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-secondary/20'}`}>

                <div className="flex items-center gap-4">
                  {/* Slot number */}
                  <span className="text-[11px] font-bold text-muted-foreground w-6 shrink-0 text-center">
                    #{idx + 1}
                  </span>

                  {/* Worker picker */}
                  <div className="flex-1">
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Worker
                    </label>
                    <select
                      value={slot.workerId}
                      onChange={e => updateSlot(slot.id, { workerId: e.target.value })}
                      className="w-full bg-secondary border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary appearance-none cursor-pointer"
                    >
                      <option value="">Select worker…</option>
                      {workers.map(w => {
                        const alreadyUsed = slots.some(s => s.id !== slot.id && s.workerId === w.id);
                        return (
                          <option key={w.id} value={w.id} disabled={alreadyUsed}>
                            {w.name} — {w.role} ({workerAvailability[w.id] ?? 8}h free)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Hours input */}
                  <div>
                    <label className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium block mb-1">
                      Hours
                    </label>
                    <HoursInput
                      value={slot.allocatedHours}
                      max={totalHours}
                      onChange={h => updateSlot(slot.id, { allocatedHours: h })}
                    />
                  </div>

                  {/* Remove */}
                  {slots.length > 2 && (
                    <button
                      onClick={() => removeSlot(slot.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors text-base mt-4"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Worker info row */}
                {worker && (
                  <div className="mt-2.5 flex items-center gap-4 pl-10">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-[10px] flex items-center justify-center font-medium">
                        {worker.avatar}
                      </div>
                      <span className="text-[11px] text-muted-foreground">{worker.department}</span>
                    </div>
                    {avail !== null && (
                      <span className={`text-[11px] ${overCapacity ? 'text-destructive' : 'text-success'}`}>
                        {overCapacity
                          ? `⚠ Exceeds available ${avail}h`
                          : `✓ ${avail}h available`}
                      </span>
                    )}
                    {slot.allocatedHours > 0 && (
                      <span className="text-[11px] text-muted-foreground ml-auto">
                        {Math.round((slot.allocatedHours / totalHours) * 100)}% of task
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {/* Add worker slot */}
          <button
            onClick={addSlot}
            disabled={slots.length >= workers.length}
            className="w-full py-2.5 rounded-xl border border-dashed border-border text-[12px] text-muted-foreground
              hover:border-primary hover:text-primary hover:bg-primary/5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add another worker
          </button>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-border shrink-0 flex items-center justify-between bg-secondary/10">
          <button
            onClick={autoDistribute}
            className="text-xs font-medium text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border hover:bg-secondary transition-colors"
          >
            ⚖ Auto-distribute
          </button>
          <div className="flex gap-2">
            <button onClick={onClose}
              className="px-4 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              Cancel
            </button>
            <button
              disabled={!isValid}
              onClick={() => onConfirm(slots)}
              className="px-4 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Confirm split
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}