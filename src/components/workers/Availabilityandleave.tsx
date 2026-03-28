import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';
import { PlusIcon, XIcon, ClockIcon } from '@/components/icons/Icons';
import { workerAvailabilityService, WorkerAvailability } from '@/services/workerAvailability';

// ─── Types ────────────────────────────────────────────────────────────────────

type LeaveType = 'Annual Leave' | 'Sick Leave' | 'Public Holiday' | 'Training' | 'Other';

interface LeaveRequest {
  id: string;
  type: LeaveType;
  fromDate: string;
  toDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface BlockedSlot {
  id: string;
  date: string;
  fromTime: string;
  toTime: string;
  reason: string;
}

interface RecurringUnavailability {
  id: string;
  dayOfWeek: number;
  reason: string;
}

interface DayAvailability {
  id: number | null;
  enabled: boolean;
  startHour: string;
  endHour: string;
}

type WeeklyAvailability = Record<string, DayAvailability>;

interface AvailabilityAndLeaveProps {
  workerId: number | undefined;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const DAY_ABBR     = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const LEAVE_TYPES: LeaveType[] = [
  'Annual Leave', 'Sick Leave', 'Public Holiday', 'Training', 'Other',
];

const HOURS = Array.from({ length: 24 }, (_, i) =>
  `${String(i).padStart(2, '0')}:00`,
);

const DEFAULT_WEEKLY: WeeklyAvailability = Object.fromEntries(
  DAYS_OF_WEEK.map(day => [
    day,
    { id: null, enabled: !['Saturday', 'Sunday'].includes(day), startHour: '09:00', endHour: '17:00' },
  ]),
);

const LEAVE_STATUS_STYLES: Record<LeaveRequest['status'], string> = {
  pending:  'bg-warning/15 text-warning',
  approved: 'bg-success/15 text-success',
  rejected: 'bg-destructive/15 text-destructive',
};

const LEAVE_TYPE_STYLES: Record<LeaveType, string> = {
  'Annual Leave':   'bg-blue-500/10 text-blue-400',
  'Sick Leave':     'bg-red-500/10 text-red-400',
  'Public Holiday': 'bg-purple-500/10 text-purple-400',
  'Training':       'bg-teal-500/10 text-teal-400',
  'Other':          'bg-secondary text-muted-foreground',
};

const selectCls =
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ' +
  'text-foreground ring-offset-background focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

const smallSelectCls =
  'flex h-8 rounded-md border border-input bg-background px-2 py-1 text-xs ' +
  'text-foreground ring-offset-background focus-visible:outline-none ' +
  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

function daysBetween(from: string, to: string) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.round(ms / (1000 * 60 * 60 * 24)) + 1);
}

// ─── Shape converters (API rows → UI state) ───────────────────────────────────

function rowsToWeekly(rows: WorkerAvailability[]): WeeklyAvailability {
  const base = { ...DEFAULT_WEEKLY };
  rows.forEach(row => {
    const day = DAYS_OF_WEEK[row.day_of_week!];
    if (day) {
      base[day] = {
        id:        row.id,
        enabled:   row.is_enabled ?? true,
        startHour: row.start_time?.slice(0, 5) ?? '09:00',
        endHour:   row.end_time?.slice(0, 5)   ?? '17:00',
      };
    }
  });
  return base;
}

function rowsToLeaves(rows: WorkerAvailability[]): LeaveRequest[] {
  return rows.map(r => ({
    id:       String(r.id),
    type:     (r.leave_type as LeaveType) ?? 'Other',
    fromDate: r.from_date ?? '',
    toDate:   r.to_date   ?? '',
    reason:   r.reason    ?? '',
    status:   (r.approval_status as LeaveRequest['status']) ?? 'pending',
  }));
}

function rowsToBlocked(rows: WorkerAvailability[]): BlockedSlot[] {
  return rows.map(r => ({
    id:       String(r.id),
    date:     r.from_date ?? '',
    fromTime: r.start_time?.slice(0, 5) ?? '09:00',
    toTime:   r.end_time?.slice(0, 5)   ?? '17:00',
    reason:   r.reason ?? '',
  }));
}

function rowsToRecurring(rows: WorkerAvailability[]): RecurringUnavailability[] {
  return rows.map(r => ({
    id:        String(r.id),
    dayOfWeek: r.day_of_week ?? 0,
    reason:    r.reason ?? '',
  }));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({
  title, subtitle, action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {subtitle && <p className="text-[11px] text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ label, onAdd }: { label: string; onAdd: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center">
      <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center mb-2.5">
        <ClockIcon size={15} className="text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">Nothing here yet</p>
      <button
        onClick={onAdd}
        className="mt-1.5 text-xs text-primary hover:text-primary/70 transition-colors"
      >
        {label}
      </button>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AvailabilityAndLeave({ workerId }: AvailabilityAndLeaveProps) {
  const [weekly,    setWeekly]    = useState<WeeklyAvailability>(DEFAULT_WEEKLY);
  const [leaves,    setLeaves]    = useState<LeaveRequest[]>([]);
  const [blocked,   setBlocked]   = useState<BlockedSlot[]>([]);
  const [recurring, setRecurring] = useState<RecurringUnavailability[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);

  // form visibility
  const [showLeaveForm,     setShowLeaveForm]     = useState(false);
  const [showBlockForm,     setShowBlockForm]      = useState(false);
  const [showRecurringForm, setShowRecurringForm]  = useState(false);

  // ── Load all on mount ──────────────────────────────────────────────────────

  useEffect(() => {
    // Guard: do nothing until we have a valid workerId
    if (!workerId) return;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const rows = await workerAvailabilityService.getAvailability(workerId);
        setWeekly(rowsToWeekly(rows.filter(r => r.status === 'available')));
        setLeaves(rowsToLeaves(rows.filter(r => r.status === 'leave')));
        setBlocked(rowsToBlocked(rows.filter(r => r.status === 'blocked')));
        setRecurring(rowsToRecurring(rows.filter(r => r.status === 'recurring')));
      } catch (e: any) {
        setError(e.message ?? 'Failed to load availability');
      } finally {
        setLoading(false);
      }
    })();
  }, [workerId]);

  // ── Weekly: toggle day ─────────────────────────────────────────────────────

  async function toggleDay(day: string) {
    if (!workerId) return;
    const d = weekly[day];
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    // Optimistic update
    setWeekly(prev => ({ ...prev, [day]: { ...d, enabled: !d.enabled } }));
    try {
      if (d.id) {
        await workerAvailabilityService.updateAvailability(workerId, d.id, { is_enabled: !d.enabled });
      } else {
        const row = await workerAvailabilityService.createAvailability(workerId, {
          status:      'available',
          day_of_week: dayIndex,
          start_time:  d.startHour,
          end_time:    d.endHour,
          is_enabled:  !d.enabled,
        });
        setWeekly(prev => ({ ...prev, [day]: { ...prev[day], id: row.id } }));
      }
    } catch {
      // rollback
      setWeekly(prev => ({ ...prev, [day]: d }));
    }
  }

  // ── Weekly: change hours ───────────────────────────────────────────────────

  async function setDayHour(day: string, field: 'startHour' | 'endHour', value: string) {
    if (!workerId) return;
    const d = weekly[day];
    const dayIndex = DAYS_OF_WEEK.indexOf(day);
    setWeekly(prev => ({ ...prev, [day]: { ...d, [field]: value } }));
    try {
      const payload = {
        start_time: field === 'startHour' ? value : d.startHour,
        end_time:   field === 'endHour'   ? value : d.endHour,
      };
      if (d.id) {
        await workerAvailabilityService.updateAvailability(workerId, d.id, payload);
      } else {
        const row = await workerAvailabilityService.createAvailability(workerId, {
          status: 'available', day_of_week: dayIndex, is_enabled: true, ...payload,
        });
        setWeekly(prev => ({ ...prev, [day]: { ...prev[day], id: row.id } }));
      }
    } catch {
      setWeekly(prev => ({ ...prev, [day]: d }));
    }
  }

  // ── Leave: submit ──────────────────────────────────────────────────────────

  const emptyLeave: Omit<LeaveRequest, 'id' | 'status'> = {
    type: 'Annual Leave', fromDate: '', toDate: '', reason: '',
  };
  const [leaveForm,   setLeaveForm]   = useState(emptyLeave);
  const [leaveErrors, setLeaveErrors] = useState<Partial<Record<keyof typeof emptyLeave, string>>>({});
  const [leaveLoading, setLeaveLoading] = useState(false);

  async function submitLeave() {
    if (!workerId) return;
    const errs: typeof leaveErrors = {};
    if (!leaveForm.fromDate) errs.fromDate = 'Required';
    if (!leaveForm.toDate)   errs.toDate   = 'Required';
    else if (leaveForm.toDate < leaveForm.fromDate) errs.toDate = 'Must be after start date';
    setLeaveErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      setLeaveLoading(true);
      const row = await workerAvailabilityService.createAvailability(workerId, {
        status:     'leave',
        leave_type: leaveForm.type,
        from_date:  leaveForm.fromDate,
        to_date:    leaveForm.toDate,
        reason:     leaveForm.reason,
      });
      setLeaves(prev => [...prev, {
        id:       String(row.id),
        type:     (row.leave_type as LeaveType) ?? leaveForm.type,
        fromDate: row.from_date ?? leaveForm.fromDate,
        toDate:   row.to_date   ?? leaveForm.toDate,
        reason:   row.reason    ?? leaveForm.reason,
        status:   'pending',
      }]);
      setLeaveForm(emptyLeave);
      setShowLeaveForm(false);
    } catch (e: any) {
      setLeaveErrors({ fromDate: e.message ?? 'Failed to submit' });
    } finally {
      setLeaveLoading(false);
    }
  }

  async function deleteLeave(id: string) {
    if (!workerId) return;
    setLeaves(prev => prev.filter(l => l.id !== id));
    try {
      await workerAvailabilityService.deleteAvailability(workerId, Number(id));
    } catch {
      // silently refetch on failure is also an option; here we leave optimistic removal
    }
  }

  // ── Blocked: submit ────────────────────────────────────────────────────────

  const emptyBlock: Omit<BlockedSlot, 'id'> = {
    date: '', fromTime: '09:00', toTime: '17:00', reason: '',
  };
  const [blockForm,    setBlockForm]    = useState(emptyBlock);
  const [blockErrors,  setBlockErrors]  = useState<Partial<Record<keyof typeof emptyBlock, string>>>({});
  const [blockLoading, setBlockLoading] = useState(false);

  async function submitBlock() {
    if (!workerId) return;
    const errs: typeof blockErrors = {};
    if (!blockForm.date)                        errs.date    = 'Required';
    if (blockForm.toTime <= blockForm.fromTime) errs.toTime  = 'Must be after start time';
    setBlockErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      setBlockLoading(true);
      const row = await workerAvailabilityService.createAvailability(workerId, {
        status:     'blocked',
        from_date:  blockForm.date,
        start_time: blockForm.fromTime,
        end_time:   blockForm.toTime,
        reason:     blockForm.reason,
      });
      setBlocked(prev => [...prev, {
        id:       String(row.id),
        date:     row.from_date             ?? blockForm.date,
        fromTime: row.start_time?.slice(0, 5) ?? blockForm.fromTime,
        toTime:   row.end_time?.slice(0, 5)   ?? blockForm.toTime,
        reason:   row.reason                ?? blockForm.reason,
      }]);
      setBlockForm(emptyBlock);
      setShowBlockForm(false);
    } catch (e: any) {
      setBlockErrors({ date: e.message ?? 'Failed to add block' });
    } finally {
      setBlockLoading(false);
    }
  }

  async function deleteBlock(id: string) {
    if (!workerId) return;
    setBlocked(prev => prev.filter(b => b.id !== id));
    try {
      await workerAvailabilityService.deleteAvailability(workerId, Number(id));
    } catch {}
  }

  // ── Recurring: submit ──────────────────────────────────────────────────────

  const emptyRecurring: Omit<RecurringUnavailability, 'id'> = { dayOfWeek: 6, reason: '' };
  const [recurringForm,    setRecurringForm]    = useState(emptyRecurring);
  const [recurringLoading, setRecurringLoading] = useState(false);

  async function submitRecurring() {
    if (!workerId) return;
    try {
      setRecurringLoading(true);
      const row = await workerAvailabilityService.createAvailability(workerId, {
        status:      'recurring',
        day_of_week: recurringForm.dayOfWeek,
        reason:      recurringForm.reason,
      });
      setRecurring(prev => [...prev, {
        id:        String(row.id),
        dayOfWeek: row.day_of_week ?? recurringForm.dayOfWeek,
        reason:    row.reason      ?? recurringForm.reason,
      }]);
      setRecurringForm(emptyRecurring);
      setShowRecurringForm(false);
    } catch {} finally {
      setRecurringLoading(false);
    }
  }

  async function deleteRecurring(id: string) {
    if (!workerId) return;
    setRecurring(prev => prev.filter(r => r.id !== id));
    try {
      await workerAvailabilityService.deleteAvailability(workerId, Number(id));
    } catch {}
  }

  // ── Loading / error states ─────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">

      {/* ══ 1. Weekly Availability Grid ═══════════════════════════════════════ */}
      <div className="glass rounded-xl p-5">
        <SectionHeader
          title="Weekly Availability"
          subtitle="Set the default working hours for each day"
        />
        <div className="space-y-2">
          {DAYS_OF_WEEK.map(day => {
            const d = weekly[day];
            return (
              <div
                key={day}
                className={`flex items-center gap-4 rounded-lg px-4 py-3 transition-colors ${
                  d.enabled ? 'bg-secondary/50' : 'bg-secondary/20 opacity-60'
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${
                    d.enabled ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all duration-200"
                    style={{ left: d.enabled ? 'calc(100% - 18px)' : '2px' }}
                  />
                </button>

                <span className="text-sm font-medium text-foreground w-24 shrink-0">{day}</span>

                {d.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <select
                      value={d.startHour}
                      onChange={e => setDayHour(day, 'startHour', e.target.value)}
                      className={smallSelectCls + ' w-24'}
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-xs text-muted-foreground">to</span>
                    <select
                      value={d.endHour}
                      onChange={e => setDayHour(day, 'endHour', e.target.value)}
                      className={smallSelectCls + ' w-24'}
                    >
                      {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                    </select>
                    <span className="text-[11px] text-muted-foreground ml-1">
                      {(() => {
                        const hrs = parseInt(d.endHour) - parseInt(d.startHour);
                        return hrs > 0 ? `${hrs}h` : '';
                      })()}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Unavailable</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ══ 2. Leave Requests ═════════════════════════════════════════════════ */}
      <div className="glass rounded-xl p-5">
        <SectionHeader
          title="Leave Requests"
          subtitle={`${leaves.length} request${leaves.length !== 1 ? 's' : ''}`}
          action={
            !showLeaveForm ? (
              <button
                onClick={() => setShowLeaveForm(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <PlusIcon size={13} />
                Add Request
              </button>
            ) : null
          }
        />

        {showLeaveForm && (
          <div className="bg-secondary/40 rounded-xl p-4 mb-4 space-y-3 border border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Leave type</label>
                <select
                  value={leaveForm.type}
                  onChange={e => setLeaveForm(f => ({ ...f, type: e.target.value as LeaveType }))}
                  className={selectCls}
                >
                  {LEAVE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Reason (optional)</label>
                <Input
                  placeholder="Brief description..."
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">From date</label>
                <input
                  type="date"
                  value={leaveForm.fromDate}
                  onChange={e => { setLeaveForm(f => ({ ...f, fromDate: e.target.value })); setLeaveErrors(p => ({ ...p, fromDate: undefined })); }}
                  className={selectCls}
                />
                {leaveErrors.fromDate && <p className="text-[11px] text-destructive mt-1">{leaveErrors.fromDate}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">To date</label>
                <input
                  type="date"
                  value={leaveForm.toDate}
                  onChange={e => { setLeaveForm(f => ({ ...f, toDate: e.target.value })); setLeaveErrors(p => ({ ...p, toDate: undefined })); }}
                  className={selectCls}
                />
                {leaveErrors.toDate && <p className="text-[11px] text-destructive mt-1">{leaveErrors.toDate}</p>}
              </div>
            </div>
            {leaveForm.fromDate && leaveForm.toDate && leaveForm.toDate >= leaveForm.fromDate && (
              <p className="text-[11px] text-muted-foreground">
                Duration: {daysBetween(leaveForm.fromDate, leaveForm.toDate)} day{daysBetween(leaveForm.fromDate, leaveForm.toDate) !== 1 ? 's' : ''}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowLeaveForm(false); setLeaveErrors({}); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitLeave}
                disabled={leaveLoading}
                className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
              >
                {leaveLoading ? 'Submitting…' : 'Submit Request'}
              </button>
            </div>
          </div>
        )}

        {leaves.length === 0 && !showLeaveForm ? (
          <EmptyState label="Add a leave request" onAdd={() => setShowLeaveForm(true)} />
        ) : leaves.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                <TableHead className="text-[10px] uppercase tracking-wider">Type</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">From</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">To</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Days</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Reason</TableHead>
                <TableHead className="text-[10px] uppercase tracking-wider">Status</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaves.map(l => (
                <TableRow key={l.id}>
                  <TableCell>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LEAVE_TYPE_STYLES[l.type]}`}>
                      {l.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{l.fromDate}</TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">{l.toDate}</TableCell>
                  <TableCell className="text-xs text-foreground">{daysBetween(l.fromDate, l.toDate)}d</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                    {l.reason || '—'}
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${LEAVE_STATUS_STYLES[l.status]}`}>
                      {l.status.charAt(0).toUpperCase() + l.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <button
                      onClick={() => deleteLeave(l.id)}
                      className="w-6 h-6 rounded-md flex items-center justify-center hover:bg-destructive/15 transition-colors ml-auto"
                      title="Remove request"
                    >
                      <XIcon size={12} className="text-muted-foreground hover:text-destructive" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* ══ 3. Blocked Hours ══════════════════════════════════════════════════ */}
      <div className="glass rounded-xl p-5">
        <SectionHeader
          title="Blocked Hours"
          subtitle={`${blocked.length} block${blocked.length !== 1 ? 's' : ''} set`}
          action={
            !showBlockForm ? (
              <button
                onClick={() => setShowBlockForm(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <PlusIcon size={13} />
                Block Hours
              </button>
            ) : null
          }
        />

        {showBlockForm && (
          <div className="bg-secondary/40 rounded-xl p-4 mb-4 space-y-3 border border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Date</label>
                <input
                  type="date"
                  value={blockForm.date}
                  onChange={e => { setBlockForm(f => ({ ...f, date: e.target.value })); setBlockErrors(p => ({ ...p, date: undefined })); }}
                  className={selectCls}
                />
                {blockErrors.date && <p className="text-[11px] text-destructive mt-1">{blockErrors.date}</p>}
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Reason (optional)</label>
                <Input
                  placeholder="e.g. Client meeting"
                  value={blockForm.reason}
                  onChange={e => setBlockForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">From time</label>
                <select
                  value={blockForm.fromTime}
                  onChange={e => setBlockForm(f => ({ ...f, fromTime: e.target.value }))}
                  className={selectCls}
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">To time</label>
                <select
                  value={blockForm.toTime}
                  onChange={e => { setBlockForm(f => ({ ...f, toTime: e.target.value })); setBlockErrors(p => ({ ...p, toTime: undefined })); }}
                  className={selectCls}
                >
                  {HOURS.map(h => <option key={h} value={h}>{h}</option>)}
                </select>
                {blockErrors.toTime && <p className="text-[11px] text-destructive mt-1">{blockErrors.toTime}</p>}
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowBlockForm(false); setBlockErrors({}); }}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitBlock}
                disabled={blockLoading}
                className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
              >
                {blockLoading ? 'Adding…' : 'Add Block'}
              </button>
            </div>
          </div>
        )}

        {blocked.length === 0 && !showBlockForm ? (
          <EmptyState label="Block specific hours" onAdd={() => setShowBlockForm(true)} />
        ) : blocked.length > 0 && (
          <div className="space-y-2">
            {blocked.map(b => (
              <div key={b.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg px-4 py-2.5">
                <div className="w-2 h-2 rounded-full bg-destructive/70 shrink-0" />
                <span className="text-xs font-medium text-foreground whitespace-nowrap">{b.date}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {b.fromTime} – {b.toTime}
                </span>
                {b.reason && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <span className="text-xs text-muted-foreground truncate">{b.reason}</span>
                  </>
                )}
                <button
                  onClick={() => deleteBlock(b.id)}
                  className="ml-auto w-6 h-6 rounded-md flex items-center justify-center hover:bg-destructive/15 transition-colors shrink-0"
                  title="Remove block"
                >
                  <XIcon size={12} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ 4. Recurring Unavailability ═══════════════════════════════════════ */}
      <div className="glass rounded-xl p-5">
        <SectionHeader
          title="Recurring Unavailability"
          subtitle={`${recurring.length} rule${recurring.length !== 1 ? 's' : ''} set`}
          action={
            !showRecurringForm ? (
              <button
                onClick={() => setShowRecurringForm(true)}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
              >
                <PlusIcon size={13} />
                Add Rule
              </button>
            ) : null
          }
        />

        {showRecurringForm && (
          <div className="bg-secondary/40 rounded-xl p-4 mb-4 space-y-3 border border-border/50">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Day of week</label>
                <select
                  value={recurringForm.dayOfWeek}
                  onChange={e => setRecurringForm(f => ({ ...f, dayOfWeek: Number(e.target.value) }))}
                  className={selectCls}
                >
                  {DAY_ABBR.map((d, i) => <option key={d} value={i}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">Reason (optional)</label>
                <Input
                  placeholder="e.g. Standing team meeting"
                  value={recurringForm.reason}
                  onChange={e => setRecurringForm(f => ({ ...f, reason: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowRecurringForm(false)}
                className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={submitRecurring}
                disabled={recurringLoading}
                className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
              >
                {recurringLoading ? 'Adding…' : 'Add Rule'}
              </button>
            </div>
          </div>
        )}

        {recurring.length === 0 && !showRecurringForm ? (
          <EmptyState label="Add a recurring rule" onAdd={() => setShowRecurringForm(true)} />
        ) : recurring.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {recurring.map(r => (
              <div
                key={r.id}
                className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2"
              >
                <span className="text-xs font-medium text-foreground">
                  Every {DAY_ABBR[r.dayOfWeek]}
                </span>
                {r.reason && (
                  <>
                    <span className="text-muted-foreground/30 text-xs">·</span>
                    <span className="text-xs text-muted-foreground">{r.reason}</span>
                  </>
                )}
                <button
                  onClick={() => deleteRecurring(r.id)}
                  className="w-5 h-5 rounded-md flex items-center justify-center hover:bg-destructive/15 transition-colors ml-1"
                  title="Remove rule"
                >
                  <XIcon size={11} className="text-muted-foreground" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}