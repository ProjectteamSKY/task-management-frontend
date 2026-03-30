const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface ScheduleSlot {
  id: string;
  workerId: string;
  taskId?: string;
  date: string;
  startTime: string;
  endTime?: string;
  durationUnits: number;
  status: 'allocated' | 'leave' | 'blocked' | 'available';
  // Enriched fields from API join
  workerName?: string;
  workerRole?: string;
  taskTitle?: string;
  taskPriority?: string | null;
  taskType?: string;
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

export function getWorkedHours(slots: ScheduleSlot[], workerId: string, date: string): number {
  const totalUnits = slots
    .filter(s => s.workerId === workerId && s.date === date && s.status === 'allocated')
    .reduce((sum, s) => sum + s.durationUnits, 0);
  return totalUnits / 2;
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
    date:          (r.date ?? r.start_date) as string,          // handles both column names
    startTime:     (r.start_time as string)?.slice(0, 5),
    endTime:       (r.end_time as string)?.slice(0, 5),
    durationUnits: Number(r.duration_units ?? 2),
    status:        (r.status as ScheduleSlot['status']) ?? 'allocated',
    // Enriched join fields
    workerName:    r.worker_name as string | undefined,
    workerRole:    r.worker_role as string | undefined,
    taskTitle:     r.task_title as string | undefined,
    taskPriority:  r.task_priority as string | null | undefined,
    taskType:      r.task_type as string | undefined,
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

// ── Mutations ─────────────────────────────────────────────────────────────────

export interface CreateScheduleSlotPayload {
  worker_id:      number;
  task_id:        number;
  date:           string;
  start_time:     string;
  end_time:       string;
  duration_units: number;
  status?:        string;
}

export async function createScheduleSlot(
  payload: CreateScheduleSlotPayload,
): Promise<ScheduleSlot> {
  const fd = new FormData();
  fd.append('worker_id',  String(payload.worker_id));
  fd.append('task_id',    String(payload.task_id));
  fd.append('date',       payload.date);
  fd.append('start_time', payload.start_time);
  fd.append('end_time',   payload.end_time);
  fd.append('status',     payload.status ?? 'allocated');
  // duration_units intentionally omitted — backend doesn't accept it

  const res = await fetch(`${API_BASE}/schedule/`, {
    method: 'POST',
    body:   fd,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    console.error('Schedule 422 detail:', JSON.stringify(err?.detail, null, 2));
    throw new Error(`Schedule slot creation failed: ${res.status}`);
  }
  return toScheduleSlot(await res.json());
}
export async function deleteScheduleSlot(slotId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/schedule/${slotId}/`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error(`Schedule slot deletion failed: ${res.status}`);
}