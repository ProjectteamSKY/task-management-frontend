import { useState } from 'react';
import { workers, workerPerformance, getOverallWorkload } from '@/data/mockData';
import { Worker } from '@/types';
import { Link } from 'react-router-dom';
import { SearchIcon, FilterIcon, StarIcon } from '@/components/icons/Icons';

const statusStyles: Record<string, string> = {
  active: 'bg-success/15 text-success',
  on_leave: 'bg-warning/15 text-warning',
  inactive: 'bg-destructive/15 text-destructive',
};

export default function Workers() {
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');

  const departments = ['all', ...Array.from(new Set(workers.map(w => w.department)))];

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) || w.role.toLowerCase().includes(search.toLowerCase());
    const matchDept = deptFilter === 'all' || w.department === deptFilter;
    return matchSearch && matchDept;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workers</h1>
          <p className="text-muted-foreground text-sm mt-1">{workers.length} workers in the system</p>
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
                deptFilter === d ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
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
          const perf = workerPerformance.find(p => p.workerId === worker.id);
          const workload = getOverallWorkload(worker.id);

          return (
            <Link key={worker.id} to={`/workers/${worker.id}`} className="glass rounded-xl p-5 hover:border-primary/30 transition-all duration-200 group block">
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

              {/* Workload */}
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Workload</span>
                  <span className={`text-xs font-medium ${workload > 80 ? 'text-destructive' : workload > 60 ? 'text-warning' : 'text-success'}`}>{workload}%</span>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${workload > 80 ? 'bg-destructive' : workload > 60 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${workload}%` }}
                  />
                </div>
              </div>

              {/* Capabilities */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {worker.capabilities.slice(0, 3).map(c => (
                  <span key={c.name} className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-md flex items-center gap-1">
                    {c.name}
                    <span className="text-primary/60">·{c.proficiency}</span>
                  </span>
                ))}
              </div>

              {/* Performance */}
              {perf && (
                <div className="mt-3 flex items-center gap-4 text-[11px] text-muted-foreground">
                  <span>{perf.tasksCompleted} tasks</span>
                  <span>{Math.round(perf.onTimeRate * 100)}% on-time</span>
                  <span className="flex items-center gap-0.5"><StarIcon size={11} /> {perf.qualityScore}</span>
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
