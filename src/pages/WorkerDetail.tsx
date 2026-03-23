import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  workers,
  workerPerformance,
  tasks,
  scheduleSlots,
  getOverallWorkload,
} from '@/data/mockData';
import {
  ChevronRightIcon,
  StarIcon,
  SearchIcon,
  PencilIcon,
  ClockIcon,
} from '@/components/icons/Icons';
import AddWorkerModal, { WorkerFormData } from '@/modal/AddWorkerModal';

// ─── Constants ────────────────────────────────────────────────────────────────

const TIME_SLOTS = ['09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];
const DATES      = ['2026-03-10','2026-03-11','2026-03-12','2026-03-13','2026-03-14'];

const PRIORITY_STYLES: Record<string, string> = {
  critical: 'bg-destructive/15 text-destructive',
  high:     'bg-orange-500/15 text-orange-400',
  medium:   'bg-warning/15 text-warning',
  low:      'bg-secondary text-muted-foreground',
};

const STATUS_STYLES: Record<string, string> = {
  done:        'bg-success/15 text-success',
  in_progress: 'bg-warning/15 text-warning',
  review:      'bg-primary/15 text-primary',
  todo:        'bg-secondary text-muted-foreground',
  backlog:     'bg-secondary text-muted-foreground',
};

const PRIORITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

type SortKey = 'completedDate' | 'priority' | 'status' | 'estimatedHours' | 'quality';
type SortDir = 'asc' | 'desc';
type Tab     = 'overview' | 'history';

const qualityColor = (q: number) =>
  q >= 4.5 ? 'text-success' : q >= 3.5 ? 'text-warning' : 'text-destructive';

const inputCls =
  'flex h-9 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Task History Tab ─────────────────────────────────────────────────────────

function TaskHistoryTab({ workerId }: { workerId: string }) {
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [sortKey,        setSortKey]        = useState<SortKey>('completedDate');
  const [sortDir,        setSortDir]        = useState<SortDir>('desc');

  const workerTasks = tasks.filter(t => t.assignedWorkers.includes(workerId));

  const filtered = useMemo(() => {
    let list = [...workerTasks];
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter   !== 'all') list = list.filter(t => t.status   === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
    if (dateFrom) list = list.filter(t => t.dueDate >= dateFrom);
    if (dateTo)   list = list.filter(t => t.dueDate <= dateTo);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'completedDate')   cmp = a.dueDate.localeCompare(b.dueDate);
      if (sortKey === 'priority')        cmp = (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0);
      if (sortKey === 'status')          cmp = a.status.localeCompare(b.status);
      if (sortKey === 'estimatedHours')  cmp = a.estimatedHours - b.estimatedHours;
      if (sortKey === 'quality')         cmp = (a.qualityScore ?? 0) - (b.qualityScore ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [workerTasks, search, statusFilter, priorityFilter, dateFrom, dateTo, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function clearAll() {
    setSearch(''); setStatusFilter('all'); setPriorityFilter('all');
    setDateFrom(''); setDateTo('');
  }

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k
      ? <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
      : <span className="ml-1 text-muted-foreground/30">↕</span>;

  const COL_HEADERS: [string, SortKey | null][] = [
    ['Task',             null],
    ['Status',           'status'],
    ['Priority',         'priority'],
    ['Due Date',         'completedDate'],
    ['Hours (est / act)','estimatedHours'],
    ['Quality',          'quality'],
  ];

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Search */}
          <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-56">
            <SearchIcon size={13} className="text-muted-foreground shrink-0" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground outline-none w-full"
            />
          </div>

          {/* Status */}
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputCls + ' w-36'}>
            <option value="all">All statuses</option>
            <option value="done">Done</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="todo">To Do</option>
            <option value="backlog">Backlog</option>
          </select>

          {/* Priority */}
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)} className={inputCls + ' w-36'}>
            <option value="all">All priorities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <span className="ml-auto text-[11px] text-muted-foreground">
            {filtered.length} task{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* Date range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Due date</span>
          <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className={inputCls + ' w-40'} />
          <span className="text-[11px] text-muted-foreground">to</span>
          <input type="date" value={dateTo}   onChange={e => setDateTo(e.target.value)}   className={inputCls + ' w-40'} />
          {(dateFrom || dateTo || search || statusFilter !== 'all' || priorityFilter !== 'all') && (
            <button onClick={clearAll} className="text-[11px] text-primary hover:text-primary/70 transition-colors">
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="glass rounded-xl overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-2.5 border-b border-border/50 bg-secondary/30">
          {COL_HEADERS.map(([label, key]) => (
            <button
              key={label}
              onClick={() => key && toggleSort(key)}
              className={`text-[10px] uppercase tracking-wider text-left font-medium transition-colors ${
                key
                  ? 'text-muted-foreground hover:text-foreground cursor-pointer'
                  : 'text-muted-foreground cursor-default'
              }`}
            >
              {label}
              {key && <SortArrow k={key} />}
            </button>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
              <ClockIcon size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No tasks match your filters</p>
            <button onClick={clearAll} className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors">
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="divide-y divide-border/30 max-h-[480px] overflow-y-auto scrollbar-thin">
            {filtered.map((t, idx) => (
              <div
                key={t.id}
                className={`grid grid-cols-[2fr_1fr_1fr_1fr_1fr_1fr] gap-3 px-4 py-3 items-center transition-colors hover:bg-secondary/30 ${
                  idx % 2 !== 0 ? 'bg-secondary/10' : ''
                }`}
              >
                {/* Name + description */}
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{t.title}</p>
                  {t.description && (
                    <p className="text-[11px] text-muted-foreground truncate mt-0.5">{t.description}</p>
                  )}
                </div>

                {/* Status */}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${STATUS_STYLES[t.status] ?? ''}`}>
                  {t.status.replace('_', ' ')}
                </span>

                {/* Priority */}
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full w-fit ${PRIORITY_STYLES[t.priority] ?? ''}`}>
                  {t.priority}
                </span>

                {/* Due date */}
                <p className="text-xs text-muted-foreground">{t.dueDate}</p>

                {/* Hours */}
                <div className="flex items-center gap-1 text-xs">
                  <span className="text-foreground">{t.estimatedHours}h</span>
                  {t.actualHours != null && (
                    <>
                      <span className="text-muted-foreground/40">/</span>
                      <span className={
                        t.actualHours > t.estimatedHours ? 'text-destructive' :
                        t.actualHours < t.estimatedHours ? 'text-success' :
                        'text-muted-foreground'
                      }>
                        {t.actualHours}h
                      </span>
                    </>
                  )}
                </div>

                {/* Quality */}
                <div className="flex items-center gap-1">
                  {t.qualityScore != null ? (
                    <>
                      <StarIcon size={11} className={qualityColor(t.qualityScore)} />
                      <span className={`text-xs font-medium ${qualityColor(t.qualityScore)}`}>
                        {t.qualityScore.toFixed(1)}
                      </span>
                    </>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/40">—</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────

function OverviewTab({
  worker, perf, workerTasks, workload,
}: {
  worker: any; perf: any; workerTasks: typeof tasks; workload: number;
}) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {perf && (
          <div className="glass rounded-xl p-5">
            <h3 className="text-sm font-semibold text-foreground mb-4">Performance</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ['Tasks Completed', perf.tasksCompleted,                    'text-foreground'],
                ['Avg Completion',  `${perf.avgCompletionTime}h`,           'text-foreground'],
                ['On-Time Rate',    `${Math.round(perf.onTimeRate * 100)}%`,'text-success'   ],
                ['Quality Score',   `${perf.qualityScore}/5`,               'text-foreground'],
              ].map(([label, value, color]) => (
                <div key={label as string} className="bg-secondary/50 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass rounded-xl p-5">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Assigned Tasks ({workerTasks.length})
          </h3>
          <div className="space-y-2 max-h-[250px] overflow-y-auto scrollbar-thin">
            {workerTasks.map(t => (
              <div key={t.id} className="flex items-center gap-3 bg-secondary/50 rounded-lg p-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-foreground truncate">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.estimatedHours}h · {t.priority}</p>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? ''}`}>
                  {t.status.replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Schedule grid */}
      <div className="glass rounded-xl p-5">
        <h3 className="text-sm font-semibold text-foreground mb-4">Weekly Schedule</h3>
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-2 text-left">Date</th>
                {TIME_SLOTS.map(s => (
                  <th key={s} className="text-[10px] text-muted-foreground p-2 text-center font-normal">{s}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DATES.map(date => {
                const daySlots = scheduleSlots.filter(s => s.workerId === worker.id && s.date === date);
                return (
                  <tr key={date}>
                    <td className="text-xs text-foreground p-2 font-medium whitespace-nowrap">{date.slice(5)}</td>
                    {TIME_SLOTS.map(time => {
                      const slot   = daySlots.find(s => s.startTime === time);
                      const status = slot?.status || 'available';
                      const task   = slot?.taskId ? tasks.find(t => t.id === slot.taskId) : null;
                      return (
                        <td key={time} className="p-1">
                          <div
                            title={task ? task.title : status}
                            className={`h-8 rounded-md flex items-center justify-center text-[9px] font-medium cursor-default transition-colors ${
                              status === 'allocated' ? 'slot-allocated' :
                              status === 'leave'     ? 'slot-leave'     :
                              status === 'blocked'   ? 'slot-blocked'   :
                                                       'slot-available'
                            }`}
                          >
                            {status === 'allocated' ? '█' : status === 'leave' ? 'L' : '░'}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="flex gap-4 mt-3 text-[10px] text-muted-foreground">
          {[['slot-allocated','Allocated'],['slot-available','Available'],['slot-leave','Leave'],['slot-blocked','Blocked']].map(([cls, label]) => (
            <span key={label} className="flex items-center gap-1.5">
              <span className={`w-3 h-3 rounded ${cls}`} /> {label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const worker = workers.find(w => w.id === id);

  const [activeTab,  setActiveTab]  = useState<Tab>('overview');
  const [isEditOpen, setIsEditOpen] = useState(false);

  if (!worker) return <div className="text-foreground">Worker not found</div>;

  const perf        = workerPerformance.find(p => p.workerId === worker.id);
  const workerTasks = tasks.filter(t => t.assignedWorkers.includes(worker.id));
  const workload    = getOverallWorkload(worker.id);

  const workerToFormData = (): WorkerFormData => ({
    name:         worker.name,
    role:         worker.role,
    department:   worker.department,
    email:        worker.email,
    status:       worker.status as WorkerFormData['status'],
    dailyCap:     String(worker.dailyCapacityHours),
    capabilities: worker.capabilities.map(c => ({ name: c.name, proficiency: c.proficiency })),
  });

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'overview', label: 'Overview' },
    { key: 'history',  label: 'Task History', count: workerTasks.length },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/workers" className="hover:text-foreground transition-colors">Workers</Link>
        <ChevronRightIcon size={14} />
        <span className="text-foreground">{worker.name}</span>
      </div>

      {/* Profile header */}
      <div className="glass rounded-xl p-6 flex items-start gap-6">
        <div className="w-16 h-16 rounded-xl gradient-primary flex items-center justify-center text-xl font-bold text-primary-foreground shrink-0">
          {worker.avatar}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-foreground">{worker.name}</h1>
            <span className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
              worker.status === 'active' ? 'bg-success/15 text-success' : 'bg-warning/15 text-warning'
            }`}>
              {worker.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            {worker.role} · {worker.department} · {worker.email}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {worker.capabilities.map(c => (
              <div key={c.name} className="flex items-center gap-1.5 text-xs bg-secondary rounded-md px-2.5 py-1.5">
                <span className="text-foreground font-medium">{c.name}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < c.proficiency ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {worker.specializations.map(s => (
              <span key={s} className="text-[10px] bg-accent/15 text-accent px-2 py-0.5 rounded-md">{s}</span>
            ))}
          </div>
        </div>

        {/* Stats + Edit */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <button
            onClick={() => setIsEditOpen(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
          >
            <PencilIcon size={13} />
            Edit
          </button>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{worker.dailyCapacityHours}h</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Daily Cap</p>
            </div>
            <div className="text-center">
              <p className={`text-2xl font-bold ${
                workload > 80 ? 'text-destructive' : workload > 60 ? 'text-warning' : 'text-success'
              }`}>{workload}%</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Workload</p>
            </div>
            {perf && (
              <div className="text-center">
                <p className="text-2xl font-bold text-foreground flex items-center gap-1">
                  <StarIcon size={16} className="text-warning" />
                  {perf.qualityScore}
                </p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Quality</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/50">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count != null && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === tab.key
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {tab.count}
              </span>
            )}
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'overview' ? (
        <OverviewTab worker={worker} perf={perf} workerTasks={workerTasks} workload={workload} />
      ) : (
        <TaskHistoryTab workerId={worker.id} />
      )}

      {/* Edit Worker Modal */}
      <AddWorkerModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={data => console.log('Updated worker payload:', data)}
        initialData={workerToFormData()}
      />
    </div>
  );
}