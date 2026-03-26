const API_BASE = 'http://127.0.0.1:8000';

export interface ScheduleSlot {
  id: string;
  workerId: string;
  taskId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationUnits: number;        // ← ADDED: 1 unit = 30 min (from DB duration_units)
  status: 'allocated' | 'leave' | 'blocked' | 'available';
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Task {
  id: string;
  title: string;
}

export interface ScheduleData {
  slots: ScheduleSlot[];
  workers: Worker[];
  tasks: Task[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Now counts in 30-min units and converts to hours
export function getWorkedHours(slots: ScheduleSlot[], workerId: string, date: string): number {
  const totalUnits = slots
    .filter(s => s.workerId === workerId && s.date === date && s.status === 'allocated')
    .reduce((sum, s) => sum + s.durationUnits, 0); // ← FIXED: sum units, not slot count
  return totalUnits / 2; // 2 units = 1 hour
}

export function isOnLeave(slots: ScheduleSlot[], workerId: string, date: string): boolean {
  return slots.some(
    s => s.workerId === workerId && s.date === date && s.status === 'leave',
  );
}

export function getWorkerWorkload(
  slots: ScheduleSlot[],
  workerId: string,
  date: string,
  totalHours = 8,
): number {
  const worked = getWorkedHours(slots, workerId, date);
  return Math.round((worked / totalHours) * 100);
}

// ── Transformers ─────────────────────────────────────────────────────────────

function toScheduleSlot(raw: unknown): ScheduleSlot {
  const r = raw as Record<string, unknown>;
  return {
    id:            String(r.id),
    workerId:      String(r.worker_id),
    taskId:        r.task_id ? String(r.task_id) : undefined,
    date:          r.date as string,
    startTime:     (r.start_time as string)?.slice(0, 5),
    endTime:       (r.end_time as string)?.slice(0, 5),
    durationUnits: Number(r.duration_units ?? 2), // ← ADDED: fallback 2 = 1 hour
    status:        r.status as ScheduleSlot['status'],
  };
}

function toWorker(raw: unknown): Worker {
  const r = raw as Record<string, unknown>;
  return {
    id:     String(r.id),
    name:   r.name as string,
    role:   r.role as string,
    avatar: (r.name as string)
      .split(' ')
      .map((n: string) => n[0])
      .join(''),
  };
}

function toTask(raw: unknown): Task {
  const r = raw as Record<string, unknown>;
  return {
    id:    String(r.id),
    title: r.title as string,
  };
}

// ── Fetchers ─────────────────────────────────────────────────────────────────

async function fetchJson(url: string, label: string): Promise<unknown[]> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${label} fetch failed: ${res.status}`);
  return res.json() as Promise<unknown[]>;
}

export async function fetchScheduleData(): Promise<ScheduleData> {
  const [schedulesRaw, workersRaw, tasksRaw] = await Promise.all([
    fetchJson(`${API_BASE}/schedule/`, 'Schedule'),
    fetchJson(`${API_BASE}/workers/`,  'Workers'),
    fetchJson(`${API_BASE}/tasks/`,    'Tasks'),
  ]);

  return {
    slots:   schedulesRaw.map(toScheduleSlot),
    workers: workersRaw.map(toWorker),
    tasks:   tasksRaw.map(toTask),
  };
}