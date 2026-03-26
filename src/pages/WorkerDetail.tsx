import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workers, workerPerformance, tasks, getOverallWorkload, workerNotes } from '@/data/mockData';
import { ChevronRightIcon, StarIcon, PencilIcon, PlusIcon } from '@/components/icons/Icons';
import AddWorkerModal,      { WorkerFormData }  from '@/modal/AddWorkerModal';
import WorkerOverview                           from '@/components/workers/WorkerOverview';
import TaskHistory                              from '@/components/workers/TaskHistory';
import SkillsAndCerts                           from '@/components/workers/SkillsAndCerts';
import AvailabilityAndLeave                     from '@/components/workers/AvailabilityAndLeave';
import PerformanceDetail                        from '@/components/workers/PerformanceDetail';
import AssignTasksPanel                         from '@/components/workers/AssignTasksPanel';
import DailyView                                from '@/components/workers/DailyView';
import WorkerNotes                              from '@/components/workers/Workernotes';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'history' | 'skills' | 'availability' | 'performance' | 'daily' | 'notes';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',     label: 'Overview'             },
  { key: 'history',      label: 'Task History'         },
  { key: 'skills',       label: 'Skills & Certs'       },
  { key: 'availability', label: 'Availability & Leave' },
  { key: 'performance',  label: 'Performance'          },
  { key: 'daily',        label: 'Daily View'           },
  { key: 'notes',        label: 'Notes'                },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();
  const worker  = workers.find(w => w.id === id);

  const [activeTab,    setActiveTab]    = useState<Tab>('overview');
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);

  if (!worker) return <div className="text-foreground">Worker not found</div>;

  const perf        = workerPerformance.find(p => p.workerId === worker.id);
  const workerTasks = tasks.filter(t => t.assignedWorkers.includes(worker.id));
  const workload    = getOverallWorkload(worker.id);

  // Notes for this worker
  const initialNotes = workerNotes.filter(n => n.workerId === worker.id)
    .map(({ workerId: _wid, ...rest }) => rest); // strip workerId before passing in

  const workerToFormData = (): WorkerFormData => ({
    name:         worker.name,
    role:         worker.role,
    department:   worker.department,
    email:        worker.email,
    status:       worker.status as WorkerFormData['status'],
    dailyCap:     String(worker.dailyCapacityHours),
    capabilities: worker.capabilities.map(c => ({ name: c.name, proficiency: c.proficiency })),
  });

  const initialSkills = worker.capabilities.map((c, i) => ({
    id:          String(i),
    name:        c.name,
    category:    'Technical',
    proficiency: c.proficiency,
  }));

  function handleAssign(taskId: string, assigned: boolean) {
    console.log(`Task ${taskId} ${assigned ? 'assigned to' : 'unassigned from'} ${worker.name}`);
  }

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/workers" className="hover:text-foreground transition-colors">Workers</Link>
        <ChevronRightIcon size={14} />
        <span className="text-foreground">{worker.name}</span>
      </div>

      {/* ── Profile header ── */}
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

        {/* Stats + action buttons */}
        <div className="flex flex-col items-end gap-3 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAssignOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
            >
              <PlusIcon size={13} />
              Assign Tasks
            </button>
            <button
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 hover:text-foreground transition-colors"
            >
              <PencilIcon size={13} />
              Edit
            </button>
          </div>

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
      <div className="flex items-center gap-1 border-b border-border/50 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
              activeTab === tab.key
                ? 'text-foreground'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}

            {/* Task count badge on Task History tab */}
            {tab.key === 'history' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === 'history'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {workerTasks.length}
              </span>
            )}

            {/* Notes count badge on Notes tab */}
            {tab.key === 'notes' && initialNotes.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                activeTab === 'notes'
                  ? 'bg-primary/15 text-primary'
                  : 'bg-secondary text-muted-foreground'
              }`}>
                {initialNotes.length}
              </span>
            )}

            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'overview' && (
        <WorkerOverview worker={worker} perf={perf} workerTasks={workerTasks} workload={workload} />
      )}
      {activeTab === 'history' && (
        <TaskHistory workerId={worker.id} />
      )}
      {activeTab === 'skills' && (
        <SkillsAndCerts
          initialSkills={initialSkills}
          initialCerts={[]}
          onSkillsChange={updated => console.log('Skills updated:', updated)}
          onCertsChange={updated  => console.log('Certs updated:',  updated)}
        />
      )}
      {activeTab === 'availability' && (
        <AvailabilityAndLeave onChange={data => console.log('Availability updated:', data)} />
      )}
      {activeTab === 'performance' && perf && (
        <PerformanceDetail perf={perf} />
      )}
      {activeTab === 'performance' && !perf && (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">No performance data available for this worker.</p>
        </div>
      )}
      {activeTab === 'daily' && (
        <DailyView workerId={worker.id} />
      )}

      {/* Notes tab */}
      {activeTab === 'notes' && (
        <WorkerNotes
          workerId={worker.id}
          initialNotes={initialNotes}
          onChange={updated => console.log('Notes updated:', updated)}
        />
      )}

      {/* ── Edit Modal ── */}
      <AddWorkerModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={data => console.log('Updated worker payload:', data)}
        initialData={workerToFormData()}
      />

      {/* ── Assign Tasks Panel ── */}
      <AssignTasksPanel
        open={isAssignOpen}
        worker={{ id: worker.id, name: worker.name, dailyCapacityHours: worker.dailyCapacityHours }}
        onClose={() => setIsAssignOpen(false)}
        onAssign={handleAssign}
      />
    </div>
  );
}