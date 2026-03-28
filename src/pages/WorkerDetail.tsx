import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { workers, workerPerformance, tasks, getOverallWorkload, workerNotes, emergencyContacts, workerEquipment, workerTrainingSessions, workerSkillGoals, workerShiftSchedules  } from '@/data/mockData';
import { ChevronRightIcon, StarIcon, PencilIcon, PlusIcon } from '@/components/icons/Icons';
import AddWorkerModal,      { WorkerFormData }  from '@/modal/AddWorkerModal';
import WorkerOverview                           from '@/components/workers/WorkerOverview';
import TaskHistory                              from '@/components/workers/TaskHistory';
import SkillsAndCerts                           from '@/components/workers/SkillsAndCerts';
import AvailabilityAndLeave                     from '@/components/workers/AvailabilityAndLeave';
import AssignTasksPanel                         from '@/components/workers/AssignTasksPanel';
import DailyView                                from '@/components/workers/DailyView';
import WorkerNotes                              from '@/components/workers/Workernotes';
import EmergencyContact                         from '@/components/workers/Emergencycontact';
import EquipmentTools                           from '@/components/workers/Equipmenttools';
import TrainingDevelopment                      from '@/components/workers/Trainingdevelopment';
import ShiftSchedulePlanner                     from '@/components/workers/Shiftscheduleplanner';
import {
  workerService,
  capabilityService,
  type NormalisedWorker,
  type NormalisedCapability,
} from '@/services/workerService';
import { taskService }       from '@/services/taskService';
import { assignmentService } from '@/services/taskassignmentService';

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'overview' | 'history' | 'skills' | 'availability' | 'performance' | 'daily' | 'notes' | 'emergency' | 'equipment' | 'training' | 'shift';

const TABS: { key: Tab; label: string }[] = [
  { key: 'overview',     label: 'Overview'             },
  { key: 'history',      label: 'Task History'         },
  { key: 'skills',       label: 'Skills & Certs'       },
  { key: 'availability', label: 'Availability & Leave' },
  { key: 'performance',  label: 'Performance'          },
  { key: 'daily',        label: 'Daily View'           },
  { key: 'notes',        label: 'Notes'                },
  { key: 'emergency',    label: 'Emergency Contact'    },
  { key: 'equipment',    label: 'Equipment & Tools'    },
  { key: 'training',     label: 'Training & Dev'       },
  { key: 'shift',        label: 'Shift Planner'        },
];

interface NormalisedTask {
  id:             string;
  title:          string;
  description:    string;
  status:         string;
  priority:       string;
  estimatedHours: number;
  startDate:      string;
  dueDate:        string;
}

interface NormalisedAssignment {
  id:             string;
  taskId:         string;
  workerId:       string;
  allocatedHours: number;
  assignedDate:   string;
  status:         string;
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normaliseTask(t: any): NormalisedTask {
  return {
    id:             String(t.id),
    title:          t.title          ?? '',
    description:    t.description    ?? '',
    status:         t.status         ?? 'todo',
    priority:       t.priority       ?? 'medium',
    estimatedHours: t.estimated_hours ?? 0,
    startDate:      t.start_date     ?? '',
    dueDate:        t.end_date       ?? t.due_date ?? '',
  };
}

function normaliseAssignment(a: any): NormalisedAssignment {
  return {
    id:             String(a.id),
    taskId:         String(a.task_id),
    workerId:       String(a.worker_id),
    allocatedHours: a.allocated_hours ?? 0,
    assignedDate:   a.assigned_date   ?? '',
    status:         a.status          ?? 'active',
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function WorkerDetail() {
  const { id } = useParams<{ id: string }>();

  // ── Core worker state ─────────────────────────────────────────────
  const [worker,       setWorker]       = useState<NormalisedWorker | null>(null);
  const [capabilities, setCapabilities] = useState<NormalisedCapability[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState<string | null>(null);

  // ── Tasks + assignments state ─────────────────────────────────────
  const [allTasks,    setAllTasks]    = useState<NormalisedTask[]>([]);
  const [assignments, setAssignments] = useState<NormalisedAssignment[]>([]);

  // ── UI state ──────────────────────────────────────────────────────
  const [activeTab,    setActiveTab]    = useState<Tab>('overview');
  const [isEditOpen,   setIsEditOpen]   = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isSaving,     setIsSaving]     = useState(false);
  const [scheduleKey,  setScheduleKey]  = useState(0);

  // ── Fetch worker + capabilities ───────────────────────────────────
  useEffect(() => {
    if (!id) return;                          // ← guard: no id, no fetch
    setLoading(true);
    Promise.all([
      workerService.getWorker(Number(id)),
      capabilityService.getCapabilities(Number(id)),
    ])
      .then(([w, caps]) => {
        setWorker(w);
        setCapabilities(caps);
        setError(null);
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Fetch tasks + assignments ─────────────────────────────────────
  useEffect(() => {
    Promise.all([
      taskService.getTasks(),
      assignmentService.getAssignments(),
    ])
      .then(([rawTasks, rawAssignments]) => {
        setAllTasks(rawTasks.map(normaliseTask));
        setAssignments(rawAssignments.map(normaliseAssignment));
      })
      .catch(err => console.error('Failed to load tasks/assignments:', err));
  }, []);

  // ── Assign / unassign a task ──────────────────────────────────────
  const handleAssign = useCallback(async (taskId: string, assign: boolean): Promise<void> => {
    if (!worker) return;

    if (assign) {
      const created = await assignmentService.createAssignment({
        task_id:         Number(taskId),
        worker_id:       Number(worker.id),
        allocated_hours: allTasks.find(t => t.id === taskId)?.estimatedHours ?? 1,
        assigned_date:   new Date().toISOString().slice(0, 10),
        status:          'active',
      });
      setAssignments(prev => [...prev, normaliseAssignment(created)]);
    } else {
      const existing = assignments.find(
        a => a.taskId === taskId && a.workerId === worker.id,
      );
      if (existing) {
        await assignmentService.deleteAssignment(Number(existing.id));
        setAssignments(prev => prev.filter(a => a.id !== existing.id));
      }
    }

    setScheduleKey(k => k + 1);
  }, [worker, assignments, allTasks]);

  // ── Edit worker submit ────────────────────────────────────────────
  async function handleEditSubmit(data: WorkerFormData) {
    if (!worker) return;
    setIsSaving(true);
    try {
      const updated = await workerService.updateWorker(Number(worker.id), {
        name:                 data.name,
        email:                data.email,
        role:                 data.role,
        department:           data.department,
        status:               data.status,
        daily_capacity_hours: Number(data.dailyCap),
      });

      const caps = data.capabilities.filter(c => c.name.trim());
      const newCaps = await capabilityService.replaceAll(
        Number(worker.id),
        caps.map(c => ({ capability: c.name, proficiency: c.proficiency })),
      );

      setWorker(updated);
      setCapabilities(newCaps);
      setIsEditOpen(false);
    } catch (err) {
      console.error('Failed to save worker:', err);
    } finally {
      setIsSaving(false);
    }
  }

  // ── Map worker state → modal's WorkerFormData ─────────────────────
  function workerToFormData(): WorkerFormData {
    if (!worker) return {
      name: '', role: '', department: '', email: '',
      status: 'active', dailyCap: '8', capabilities: [],
    };
    return {
      name:         worker.name,
      role:         worker.role,
      department:   worker.department,
      email:        worker.email,
      status:       worker.status as WorkerFormData['status'],
      dailyCap:     String(worker.dailyCapacityHours),
      capabilities: capabilities.map(c => ({
        name:        c.capability,
        proficiency: c.proficiency,
      })),
    };
  }

  // ── Loading ───────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // ── Error / missing worker ────────────────────────────────────────
  if (error || !worker) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <p className="text-sm text-destructive">{error ?? 'Worker not found'}</p>
        <button
          onClick={() => window.location.reload()}
          className="text-xs px-4 py-2 rounded-lg bg-primary text-primary-foreground"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Everything below this line is safe: worker is guaranteed non-null ──

  const workerId = Number(worker.id); // single source of truth — always a valid number

  const initialSkills = capabilities.map((c, i) => ({
    id:          String(i),
    name:        c.capability,
    category:    'Technical',
    proficiency: c.proficiency,
  }));

  const workerTasks = allTasks.filter(t =>
    assignments.some(a => a.taskId === t.id && a.workerId === worker.id)
  );

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

          {/* Capabilities chips */}
          <div className="flex flex-wrap gap-2 mt-3">
            {capabilities.map(c => (
              <div key={c.id} className="flex items-center gap-1.5 text-xs bg-secondary rounded-md px-2.5 py-1.5">
                <span className="text-foreground font-medium">{c.capability}</span>
                <div className="flex gap-0.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full ${i < c.proficiency ? 'bg-primary' : 'bg-muted'}`} />
                  ))}
                </div>
              </div>
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
          </div>
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="flex items-center gap-1 border-b border-border/50 overflow-x-auto tab-scrollbar">
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
            {activeTab === tab.key && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full" />
            )}
          </button>
        ))}
      </div>

      {/* ── Tab content ── */}
      {activeTab === 'overview' && (
        <WorkerOverview
          worker={worker}
          workerTasks={workerTasks}
          workload={0}
          perf={undefined}
          scheduleKey={scheduleKey}
        />
      )}

      {activeTab === 'history' && (
        <TaskHistory workerId={worker.id} />
      )}

      {activeTab === 'skills' && (
        <SkillsAndCerts
          workerId={workerId}
          initialSkills={initialSkills}
          initialCerts={[]}
          onCertsChange={updated => console.log('Certs updated:', updated)}
        />
      )}

      {activeTab === 'availability' && (
        <AvailabilityAndLeave workerId={workerId} />
      )}

      {activeTab === 'performance' && (
        <div className="glass rounded-xl p-12 flex flex-col items-center justify-center text-center">
          <p className="text-sm text-muted-foreground">No performance data available.</p>
        </div>
      )}

      {activeTab === 'daily' && (
        <DailyView workerId={worker.id} />
      )}

      {activeTab === 'notes' && (
        <WorkerNotes
          workerId={worker.id}
          initialNotes={[]}
          onChange={updated => console.log('Notes updated:', updated)}
        />
      )}

      {/* ← KEY FIX: only mount EmergencyContact once workerId is a valid number.
           The `key` prop ensures it remounts cleanly if the user navigates
           between worker detail pages without a full unmount.             */}
      {activeTab === 'emergency' && workerId && (
        <EmergencyContact
          key={workerId}
          workerId={workerId}
          initialData={emergencyContacts.find(c => c.workerId === worker.id)}
          onChange={data => console.log('Emergency contact updated:', data)}
        />
      )}

      {activeTab === 'equipment' && workerId && (
        <EquipmentTools
          key={workerId}
          workerId={workerId}
          initialEquipment={workerEquipment.filter(e => e.workerId === worker.id)}
          onChange={updated => console.log('Equipment updated:', updated)}
        />
      )}

      {activeTab === 'training' && workerId && (
        <TrainingDevelopment
          key={workerId}
          workerId={workerId}
          initialSessions={workerTrainingSessions.filter(t => t.workerId === worker.id)}
          initialGoals={workerSkillGoals.filter(g => g.workerId === worker.id)}
          onChange={(sessions, goals) => console.log('Training updated:', sessions, goals)}
        />
      )}

      {activeTab === 'shift' && workerId && (
        <ShiftSchedulePlanner
          key={workerId}
          workerId={workerId}
          initialSchedule={workerShiftSchedules.find(s => s.workerId === worker.id)}
          onChange={schedule => console.log('Shift updated:', schedule)}
        />
      )}

      {/* ── Edit Modal ── */}
      <AddWorkerModal
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleEditSubmit}
        initialData={workerToFormData()}
      />

      {/* ── Assign Tasks Panel ── */}
      {isAssignOpen && (
        <AssignTasksPanel
          open={isAssignOpen}
          worker={{
            id:                 worker.id,
            name:               worker.name,
            dailyCapacityHours: worker.dailyCapacityHours,
          }}
          allTasks={allTasks}
          assignments={assignments}
          onClose={() => setIsAssignOpen(false)}
          onAssign={handleAssign}
        />
      )}
    </div>
  );
}