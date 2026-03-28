import { useState, useEffect } from 'react';
import { PencilIcon, CheckIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ShiftType = 'Morning' | 'Evening' | 'Night' | 'Rotating';
export type DayKey    = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ShiftSchedule {
  shiftType:     ShiftType;
  workingDays:   DayKey[];
  startTime:     string; // HH:MM
  endTime:       string; // HH:MM
  breakDuration: number; // minutes
}

interface ShiftSchedulePlannerProps {
  initialSchedule?: ShiftSchedule;
  onChange?:        (schedule: ShiftSchedule) => void;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL_DAYS: DayKey[]    = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const SHIFT_TYPES: ShiftType[] = ['Morning', 'Evening', 'Night', 'Rotating'];
const BREAK_OPTIONS          = [0, 15, 30, 45, 60, 90];

const SHIFT_PRESETS: Record<ShiftType, Partial<ShiftSchedule>> = {
  Morning:  { startTime: '06:00', endTime: '14:00', workingDays: ['Mon','Tue','Wed','Thu','Fri'] },
  Evening:  { startTime: '14:00', endTime: '22:00', workingDays: ['Mon','Tue','Wed','Thu','Fri'] },
  Night:    { startTime: '22:00', endTime: '06:00', workingDays: ['Mon','Tue','Wed','Thu','Fri'] },
  Rotating: { startTime: '09:00', endTime: '17:00', workingDays: ['Mon','Tue','Wed','Thu','Fri'] },
};

const SHIFT_STYLES: Record<ShiftType, { bg: string; text: string; icon: string }> = {
  Morning:  { bg: 'bg-warning/15',  text: 'text-warning',  icon: '🌅' },
  Evening:  { bg: 'bg-primary/15',  text: 'text-primary',  icon: '🌆' },
  Night:    { bg: 'bg-secondary',   text: 'text-foreground', icon: '🌙' },
  Rotating: { bg: 'bg-success/15',  text: 'text-success',  icon: '🔄' },
};

const defaultSchedule: ShiftSchedule = {
  shiftType:     'Morning',
  workingDays:   ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
  startTime:     '09:00',
  endTime:       '17:00',
  breakDuration: 30,
};

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function calcWorkHours(start: string, end: string, breakMins: number): string {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let mins = (eh * 60 + em) - (sh * 60 + sm);
  if (mins < 0) mins += 24 * 60; // overnight shift
  mins -= breakMins;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

// ─── Day Toggle ───────────────────────────────────────────────────────────────

function DayToggle({
  day, active, onClick,
}: { day: DayKey; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-10 h-10 rounded-xl text-xs font-semibold transition-all ${
        active
          ? 'gradient-primary text-primary-foreground shadow-sm'
          : 'bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground'
      }`}
    >
      {day}
    </button>
  );
}

// ─── Shift Type Card ──────────────────────────────────────────────────────────

function ShiftTypeCard({
  type, active, onClick,
}: { type: ShiftType; active: boolean; onClick: () => void }) {
  const style = SHIFT_STYLES[type];
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
        active
          ? 'border-primary bg-primary/10'
          : 'border-border bg-secondary/40 hover:border-primary/40'
      }`}
    >
      <span className="text-xl">{style.icon}</span>
      <span className={`text-xs font-medium ${active ? 'text-primary' : 'text-foreground'}`}>{type}</span>
    </button>
  );
}

// ─── Main: ShiftSchedulePlanner ───────────────────────────────────────────────

export default function ShiftSchedulePlanner({
  initialSchedule, onChange,
}: ShiftSchedulePlannerProps) {
  const [schedule, setSchedule] = useState<ShiftSchedule>(initialSchedule ?? defaultSchedule);
  const [editing,  setEditing]  = useState(!initialSchedule);
  const [form,     setForm]     = useState<ShiftSchedule>(schedule);
  const [errors,   setErrors]   = useState<Partial<Record<keyof ShiftSchedule, string>>>({});

  useEffect(() => {
    if (initialSchedule) {
      setSchedule(initialSchedule);
      setForm(initialSchedule);
      setEditing(false);
    }
  }, [initialSchedule]);

  function setField<K extends keyof ShiftSchedule>(key: K, value: ShiftSchedule[K]) {
    setForm(p => ({ ...p, [key]: value }));
    if (errors[key]) setErrors(p => ({ ...p, [key]: undefined }));
  }

  function applyPreset(type: ShiftType) {
    const preset = SHIFT_PRESETS[type];
    setForm(p => ({ ...p, shiftType: type, ...preset }));
  }

  function toggleDay(day: DayKey) {
    setForm(p => ({
      ...p,
      workingDays: p.workingDays.includes(day)
        ? p.workingDays.filter(d => d !== day)
        : [...p.workingDays, day],
    }));
  }

  function validate(): boolean {
    const next: typeof errors = {};
    if (form.workingDays.length === 0) next.workingDays = 'Select at least one working day';
    if (!form.startTime) next.startTime = 'Start time is required';
    if (!form.endTime)   next.endTime   = 'End time is required';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSave() {
    if (!validate()) return;
    setSchedule(form);
    onChange?.(form);
    setEditing(false);
  }

  function handleCancel() {
    setForm(schedule);
    setErrors({});
    setEditing(false);
  }

  const workHours   = calcWorkHours(schedule.startTime, schedule.endTime, schedule.breakDuration);
  const shiftStyle  = SHIFT_STYLES[schedule.shiftType];

  return (
    <div className="space-y-4">

      {/* ── Summary card (read mode) ── */}
      {!editing && (
        <div className="glass rounded-xl p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Current Shift Pattern</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Active schedule for this worker</p>
            </div>
            <button onClick={() => setEditing(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
              <PencilIcon size={13} /> Edit Schedule
            </button>
          </div>

          {/* Shift type banner */}
          <div className={`flex items-center gap-3 p-4 rounded-xl mb-4 ${shiftStyle.bg}`}>
            <span className="text-2xl">{shiftStyle.icon}</span>
            <div>
              <p className={`text-sm font-bold ${shiftStyle.text}`}>{schedule.shiftType} Shift</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {schedule.startTime} – {schedule.endTime} · {workHours} net work
              </p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-xl font-bold text-foreground">{workHours}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Per day</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-secondary/40 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{schedule.workingDays.length}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Days/week</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">{schedule.breakDuration}m</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Break</p>
            </div>
            <div className="bg-secondary/40 rounded-xl p-3 text-center">
              <p className="text-lg font-bold text-foreground">
                {(() => {
                  const [sh, sm] = schedule.startTime.split(':').map(Number);
                  const [eh, em] = schedule.endTime.split(':').map(Number);
                  let mins = (eh * 60 + em) - (sh * 60 + sm);
                  if (mins < 0) mins += 24 * 60;
                  mins -= schedule.breakDuration;
                  const hPerDay = mins / 60;
                  return `${(hPerDay * schedule.workingDays.length).toFixed(0)}h`;
                })()}
              </p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Hrs/week</p>
            </div>
          </div>

          {/* Working days */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Working days</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(day => (
                <div key={day} className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-semibold ${
                  schedule.workingDays.includes(day)
                    ? 'gradient-primary text-primary-foreground'
                    : 'bg-secondary/40 text-muted-foreground/40'
                }`}>
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Edit form ── */}
      {editing && (
        <div className="glass rounded-xl p-5 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Shift & Schedule Planner</h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">Define the recurring weekly shift pattern</p>
            </div>
          </div>

          {/* Shift type selector */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Shift type</p>
            <div className="grid grid-cols-4 gap-2">
              {SHIFT_TYPES.map(type => (
                <ShiftTypeCard
                  key={type}
                  type={type}
                  active={form.shiftType === type}
                  onClick={() => applyPreset(type)}
                />
              ))}
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">
              Selecting a type auto-fills suggested times — you can adjust below.
            </p>
          </div>

          {/* Working days */}
          <div>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 font-medium">Working days</p>
            <div className="flex gap-1.5 flex-wrap">
              {ALL_DAYS.map(day => (
                <DayToggle
                  key={day}
                  day={day}
                  active={form.workingDays.includes(day)}
                  onClick={() => toggleDay(day)}
                />
              ))}
            </div>
            {errors.workingDays && <p className="text-[11px] text-destructive mt-1">{errors.workingDays}</p>}
          </div>

          {/* Times + break */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Start time</label>
              <input type="time" value={form.startTime}
                onChange={e => setField('startTime', e.target.value)} className={selectCls} />
              {errors.startTime && <p className="text-[11px] text-destructive mt-1">{errors.startTime}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">End time</label>
              <input type="time" value={form.endTime}
                onChange={e => setField('endTime', e.target.value)} className={selectCls} />
              {errors.endTime && <p className="text-[11px] text-destructive mt-1">{errors.endTime}</p>}
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Break duration</label>
              <select value={form.breakDuration}
                onChange={e => setField('breakDuration', Number(e.target.value))} className={selectCls}>
                {BREAK_OPTIONS.map(b => (
                  <option key={b} value={b}>{b === 0 ? 'No break' : `${b} minutes`}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Live preview */}
          {form.startTime && form.endTime && (
            <div className="bg-secondary/40 rounded-xl p-3 flex items-center gap-3 border border-border/40">
              <CheckIcon size={14} className="text-success shrink-0" />
              <p className="text-xs text-foreground">
                <span className="font-medium">{form.workingDays.join(', ') || '—'}</span>
                {' · '}
                {form.startTime} – {form.endTime}
                {' · '}
                <span className="text-primary font-medium">
                  {calcWorkHours(form.startTime, form.endTime, form.breakDuration)} net
                </span>
                {form.breakDuration > 0 && (
                  <span className="text-muted-foreground"> (incl. {form.breakDuration}m break)</span>
                )}
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-1">
            {initialSchedule && (
              <button type="button" onClick={handleCancel}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors">
                Cancel
              </button>
            )}
            <button type="button" onClick={handleSave}
              className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium">
              Save Schedule
            </button>
          </div>
        </div>
      )}
    </div>
  );
}