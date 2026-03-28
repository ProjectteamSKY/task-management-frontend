import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { SearchIcon, StarIcon, PlusIcon } from '@/components/icons/Icons';
import AddWorkerModal, { WorkerFormData } from '@/modal/AddWorkerModal';
import {
  workerService,
  capabilityService,
  type NormalisedWorker,
  type NormalisedCapability,
} from '@/services/workerService';
import { assignmentService } from '@/services/taskassignmentService';
import { taskService }       from '@/services/taskService';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WorkerStats {
  workloadPct:    number;   // 0-100
  assignedHours:  number;
  assignedCount:  number;
  capabilities:   NormalisedCapability[];
}

const statusStyles: Record<string, string> = {
  active:   'bg-success/15 text-success',
  on_leave: 'bg-warning/15 text-warning',
  inactive: 'bg-destructive/15 text-destructive',
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function Workers() {
  const [workers,      setWorkers]      = useState<NormalisedWorker[]>([]);
  const [statsMap,     setStatsMap]     = useState<Record<string, WorkerStats>>({});
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [search,       setSearch]       = useState('');
  const [deptFilter,   setDeptFilter]   = useState('all');
  const [isModalOpen,  setIsModalOpen]  = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ── Fetch everything on mount ─────────────────────────────────────
  useEffect(() => {
    setLoading(true);

    Promise.all([
      workerService.getWorkers(),
      assignmentService.getAssignments(),
      taskService.getTasks(),
    ])
      .then(([fetchedWorkers, rawAssignments, rawTasks]) => {
        setWorkers(fetchedWorkers);

        // Build a taskId → estimatedHours lookup
        const taskHours: Record<string, number> = {};
        rawTasks.forEach((t: any) => {
          taskHours[String(t.id)] = t.estimated_hours ?? 0;
        });

        // Fetch capabilities for all workers in parallel
        return Promise.all(
          fetchedWorkers.map(w =>
            capabilityService.getCapabilities(Number(w.id))
              .then(caps => ({ workerId: w.id, caps }))
              .catch(() => ({ workerId: w.id, caps: [] as NormalisedCapability[] }))
          )
        ).then(allCaps => ({ fetchedWorkers, rawAssignments, taskHours, allCaps }));
      })
      .then(({ fetchedWorkers, rawAssignments, taskHours, allCaps }) => {
        // Build stats map per worker
        const map: Record<string, WorkerStats> = {};

        fetchedWorkers.forEach(worker => {
          // Assignments for this worker
          const workerAssignments = rawAssignments.filter(
            (a: any) => String(a.worker_id) === worker.id,
          );

          const assignedCount = workerAssignments.length;
          const assignedHours = workerAssignments.reduce(
            (sum: number, a: any) => sum + (taskHours[String(a.task_id)] ?? a.allocated_hours ?? 0),
            0,
          );

          // Weekly capacity = daily cap × 5 days
          const weeklyCapacity = worker.dailyCapacityHours * 5;
          const workloadPct    = weeklyCapacity > 0
            ? Math.min(100, Math.round((assignedHours / weeklyCapacity) * 100))
            : 0;

          // Capabilities for this worker
          const capEntry = allCaps.find(c => c.workerId === worker.id);

          map[worker.id] = {
            workloadPct,
            assignedHours,
            assignedCount,
            capabilities: capEntry?.caps ?? [],
          };
        });

        setStatsMap(map);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // ── Derived ───────────────────────────────────────────────────────
  const departments = ['all', ...Array.from(new Set(workers.map(w => w.department)))];

  const filtered = workers.filter(w => {
    const matchSearch =
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || w.department === deptFilter;
    return matchSearch && matchDept;
  });

  // ── Add worker ────────────────────────────────────────────────────
  async function handleAddWorker(data: WorkerFormData) {
    setIsSubmitting(true);
    try {
      const created = await workerService.createWorker({
        name:                 data.name,
        email:                data.email,
        role:                 data.role,
        department:           data.department,
        status:               data.status,
        daily_capacity_hours: Number(data.dailyCap),
        avatar:               data.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2),
      });

      const caps = data.capabilities.filter(c => c.name.trim());
      if (caps.length > 0) {
        await capabilityService.bulkCreate(
          Number(created.id),
          caps.map(c => ({ capability: c.name, proficiency: c.proficiency })),
        );
      }

      setWorkers(prev => [created, ...prev]);
      setStatsMap(prev => ({
        ...prev,
        [created.id]: {
          workloadPct:   0,
          assignedHours: 0,
          assignedCount: 0,
          capabilities:  caps.map((c, i) => ({
            id:         i,
            workerId:   created.id,
            capability: c.name,
            proficiency: c.proficiency,
          })),
        },
      }));
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed to add worker:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  // ── Loading / error ───────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-destructive">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workers</h1>
          <p className="text-muted-foreground text-sm mt-1">{workers.length} workers in the system</p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/workers/compare"
            className="text-sm px-4 py-2 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:text-foreground transition-colors font-medium"
          >
            Compare Workers
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            disabled={isSubmitting}
            className="flex items-center gap-2 text-sm px-4 py-2 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium disabled:opacity-60"
          >
            <PlusIcon size={15} />
            Add Worker
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-64">
          <SearchIcon size={15} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search workers..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <div className="flex gap-1.5">
          {departments.map(d => (
            <button
              key={d}
              onClick={() => setDeptFilter(d)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
                deptFilter === d
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>
      </div>

      {/* Worker grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(worker => {
          const stats = statsMap[worker.id] ?? {
            workloadPct: 0, assignedHours: 0, assignedCount: 0, capabilities: [],
          };
          const { workloadPct, assignedHours, assignedCount, capabilities } = stats;

          return (
            <Link
              key={worker.id}
              to={`/workers/${worker.id}`}
              className="glass rounded-xl p-5 hover:border-primary/30 transition-all duration-200 group block"
            >
              {/* Avatar + name + status */}
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-sm font-bold text-secondary-foreground shrink-0 group-hover:gradient-primary group-hover:text-primary-foreground transition-all">
                  {worker.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground truncate">{worker.name}</h3>
                    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${statusStyles[worker.status]}`}>
                      {worker.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">{worker.role} · {worker.department}</p>
                </div>
              </div>

              {/* Workload bar */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Workload</span>
                  <span className={`text-xs font-medium ${
                    workloadPct > 80 ? 'text-destructive' :
                    workloadPct > 60 ? 'text-warning'     : 'text-success'
                  }`}>
                    {workloadPct}%
                  </span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      workloadPct > 80 ? 'bg-destructive' :
                      workloadPct > 60 ? 'bg-warning'     : 'bg-success'
                    }`}
                    style={{ width: `${workloadPct}%` }}
                  />
                </div>
              </div>

              {/* Capability chips */}
              {capabilities.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {capabilities.slice(0, 3).map(c => (
                    <span
                      key={c.id}
                      className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md flex items-center gap-1"
                    >
                      {c.capability}
                      <span className="text-primary/60">· {c.proficiency}</span>
                    </span>
                  ))}
                  {capabilities.length > 3 && (
                    <span className="text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-md">
                      +{capabilities.length - 3} more
                    </span>
                  )}
                </div>
              )}

              {/* Assignment summary */}
              <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                <span>{assignedCount} task{assignedCount !== 1 ? 's' : ''}</span>
                <span>{assignedHours}h assigned</span>
                <span>{worker.dailyCapacityHours}h/day cap</span>
              </div>
            </Link>
          );
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm text-muted-foreground">No workers match your search.</p>
            <button
              onClick={() => { setSearch(''); setDeptFilter('all'); }}
              className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Add Worker Modal */}
      <AddWorkerModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleAddWorker}
      />
    </div>
  );
}