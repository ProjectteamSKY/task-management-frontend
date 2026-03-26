import { useState, useMemo } from 'react';
import { tasks } from '@/data/mockData';
import { SearchIcon, StarIcon, ClockIcon } from '@/components/icons/Icons';
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from '@/components/ui/table';

// ─── Types & constants ────────────────────────────────────────────────────────

type SortKey = 'dueDate' | 'priority' | 'status' | 'estimatedHours' | 'quality';
type SortDir = 'asc' | 'desc';

const PRIORITY_RANK: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };

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

const qualityColor = (q: number) =>
  q >= 4.5 ? 'text-success' : q >= 3.5 ? 'text-warning' : 'text-destructive';

const inputCls =
  'flex h-9 rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground ' +
  'ring-offset-background focus-visible:outline-none focus-visible:ring-2 ' +
  'focus-visible:ring-ring focus-visible:ring-offset-2';

// ─── Column definitions ───────────────────────────────────────────────────────

const COLUMNS: { label: string; sortKey: SortKey | null }[] = [
  { label: 'Task',              sortKey: null              },
  { label: 'Status',            sortKey: 'status'          },
  { label: 'Priority',          sortKey: 'priority'        },
  { label: 'Due Date',          sortKey: 'dueDate'         },
  { label: 'Hours (est / act)', sortKey: 'estimatedHours'  },
  { label: 'Quality',           sortKey: 'quality'         },
];

// ─── Component ────────────────────────────────────────────────────────────────

interface TaskHistoryProps {
  workerId: string;
}

export default function TaskHistory({ workerId }: TaskHistoryProps) {
  const [search,         setSearch]         = useState('');
  const [statusFilter,   setStatusFilter]   = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dateFrom,       setDateFrom]       = useState('');
  const [dateTo,         setDateTo]         = useState('');
  const [sortKey,        setSortKey]        = useState<SortKey>('dueDate');
  const [sortDir,        setSortDir]        = useState<SortDir>('desc');

  const workerTasks = tasks.filter(t => t.assignedWorkers.includes(workerId));

  const filtered = useMemo(() => {
    let list = [...workerTasks];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        t => t.title.toLowerCase().includes(q) ||
             (t.description ?? '').toLowerCase().includes(q),
      );
    }
    if (statusFilter   !== 'all') list = list.filter(t => t.status   === statusFilter);
    if (priorityFilter !== 'all') list = list.filter(t => t.priority === priorityFilter);
    if (dateFrom) list = list.filter(t => t.dueDate >= dateFrom);
    if (dateTo)   list = list.filter(t => t.dueDate <= dateTo);

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'dueDate')        cmp = a.dueDate.localeCompare(b.dueDate);
      if (sortKey === 'priority')       cmp = (PRIORITY_RANK[a.priority] ?? 0) - (PRIORITY_RANK[b.priority] ?? 0);
      if (sortKey === 'status')         cmp = a.status.localeCompare(b.status);
      if (sortKey === 'estimatedHours') cmp = a.estimatedHours - b.estimatedHours;
      if (sortKey === 'quality')        cmp = (a.qualityScore ?? 0) - (b.qualityScore ?? 0);
      return sortDir === 'asc' ? cmp : -cmp;
    });

    return list;
  }, [workerTasks, search, statusFilter, priorityFilter, dateFrom, dateTo, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  }

  function clearAll() {
    setSearch('');
    setStatusFilter('all');
    setPriorityFilter('all');
    setDateFrom('');
    setDateTo('');
  }

  const hasActiveFilters =
    search || statusFilter !== 'all' || priorityFilter !== 'all' || dateFrom || dateTo;

  const SortArrow = ({ k }: { k: SortKey }) =>
    sortKey === k ? (
      <span className="ml-1 text-primary">{sortDir === 'asc' ? '↑' : '↓'}</span>
    ) : (
      <span className="ml-1 text-muted-foreground/30">↕</span>
    );

  return (
    <div className="space-y-4">
      {/* ── Filter bar ── */}
      <div className="glass rounded-xl p-4 space-y-3">
        {/* Row 1 — search, status, priority, result count */}
        <div className="flex flex-wrap items-center gap-2">
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

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={inputCls + ' w-36'}
          >
            <option value="all">All statuses</option>
            <option value="done">Done</option>
            <option value="in_progress">In Progress</option>
            <option value="review">Review</option>
            <option value="todo">To Do</option>
            <option value="backlog">Backlog</option>
          </select>

          <select
            value={priorityFilter}
            onChange={e => setPriorityFilter(e.target.value)}
            className={inputCls + ' w-36'}
          >
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

        {/* Row 2 — date range */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-muted-foreground">Due date</span>
          <input
            type="date"
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
            className={inputCls + ' w-40'}
          />
          <span className="text-[11px] text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
            className={inputCls + ' w-40'}
          />
          {hasActiveFilters && (
            <button
              onClick={clearAll}
              className="text-[11px] text-primary hover:text-primary/70 transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      {/* ── Table ── */}
      <div className="glass rounded-xl overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
              <ClockIcon size={18} className="text-muted-foreground" />
            </div>
            <p className="text-sm text-muted-foreground">No tasks match your filters</p>
            <button
              onClick={clearAll}
              className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <div className="max-h-[480px] overflow-y-auto scrollbar-thin">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/30 hover:bg-secondary/30">
                  {COLUMNS.map(({ label, sortKey: key }) => (
                    <TableHead
                      key={label}
                      onClick={() => key && toggleSort(key)}
                      className={`text-[10px] uppercase tracking-wider select-none ${
                        key ? 'cursor-pointer hover:text-foreground transition-colors' : ''
                      }`}
                    >
                      {label}
                      {key && <SortArrow k={key} />}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>

              <TableBody>
                {filtered.map(t => (
                  <TableRow key={t.id}>
                    {/* Task name + description */}
                    <TableCell className="max-w-[220px]">
                      <p className="text-sm text-foreground font-medium truncate">{t.title}</p>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">
                          {t.description}
                        </p>
                      )}
                    </TableCell>

                    {/* Status */}
                    <TableCell>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${STATUS_STYLES[t.status] ?? ''}`}>
                        {t.status.replace('_', ' ')}
                      </span>
                    </TableCell>

                    {/* Priority */}
                    <TableCell>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${PRIORITY_STYLES[t.priority] ?? ''}`}>
                        {t.priority}
                      </span>
                    </TableCell>

                    {/* Due date */}
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      {t.dueDate}
                    </TableCell>

                    {/* Hours est / actual */}
                    <TableCell>
                      <div className="flex items-center gap-1 text-xs">
                        <span className="text-foreground">{t.estimatedHours}h</span>
                        {t.actualHours != null && (
                          <>
                            <span className="text-muted-foreground/40">/</span>
                            <span className={
                              t.actualHours > t.estimatedHours ? 'text-destructive' :
                              t.actualHours < t.estimatedHours ? 'text-success'     :
                                                                  'text-muted-foreground'
                            }>
                              {t.actualHours}h
                            </span>
                          </>
                        )}
                      </div>
                    </TableCell>

                    {/* Quality */}
                    <TableCell>
                      {t.qualityScore != null ? (
                        <div className="flex items-center gap-1">
                          <StarIcon size={11} className={qualityColor(t.qualityScore)} />
                          <span className={`text-xs font-medium ${qualityColor(t.qualityScore)}`}>
                            {t.qualityScore.toFixed(1)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-[11px] text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  );
}