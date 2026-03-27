import { useState, useEffect } from 'react';
import { SearchIcon, ClockIcon } from '@/components/icons/Icons';
import { projectService, Project } from '@/services/projectService';
import CreateProjectModal from '@/modal/CreateProject';

const statusStyles: Record<string, string> = {
  active:    'bg-success/15 text-success',
  inactive:  'bg-muted text-muted-foreground',
  completed: 'bg-primary/15 text-primary',
  on_hold:   'bg-warning/15 text-warning',
};

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreate, setShowCreate] = useState(false);

  const fetchProjects = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await projectService.getProjects();
      setProjects(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, []);

  const filtered = projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? 'Loading...' : `${projects.length} projects total`}
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-primary text-primary-foreground text-sm font-medium px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
        >
          <span className="text-lg leading-none">+</span>
          Create Project
        </button>
      </div>

      {/* API Error */}
      {error && (
        <div className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={fetchProjects} className="underline ml-4">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-2 bg-secondary/50 rounded-lg px-3 py-2 w-64">
          <SearchIcon size={15} className="text-muted-foreground" />
          <input
            type="text"
            placeholder="Search projects..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="text-xs bg-secondary text-secondary-foreground px-3 py-2 rounded-lg outline-none"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="completed">Completed</option>
          <option value="on_hold">On Hold</option>
        </select>
      </div>

      {/* Table */}
      <div className="glass rounded-xl overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Project</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Status</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Start Date</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">End Date</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Tasks</th>
                <th className="text-[10px] uppercase tracking-wider text-muted-foreground p-4 text-left font-medium">Workers</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={6} className="p-10 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground text-sm">
                      <span className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin" />
                      Loading projects...
                    </div>
                  </td>
                </tr>
              )}

              {!loading && filtered.map(project => (
                <tr
                  key={project.id}
                  className="border-b border-border/50 hover:bg-secondary/30 cursor-pointer transition-colors"
                >
                  <td className="p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">{project.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">
                        {project.description ?? '—'}
                      </p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full ${statusStyles[project.status] ?? 'bg-secondary text-muted-foreground'}`}>
                      {project.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">{project.start_date ?? '—'}</td>
                  <td className="p-4 text-sm text-muted-foreground">{project.end_date ?? '—'}</td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {(project as any).task_count ?? '—'}
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {(project as any).worker_count ?? '—'}
                  </td>
                </tr>
              ))}

              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-10 text-center text-sm text-muted-foreground">
                    No projects found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <CreateProjectModal
          onClose={() => setShowCreate(false)}
          onCreated={fetchProjects}
        />
      )}
    </div>
  );
}