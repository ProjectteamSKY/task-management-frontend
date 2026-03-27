const WORKER_BASE = 'http://127.0.0.1:8000/workers';
const CAP_BASE    = 'http://127.0.0.1:8000/workers';   // /workers/{id}/capabilities

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      fd.append(key, String(val));
    }
  });
  return fd;
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkerCreatePayload {
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  avatar?: string;
  daily_capacity_hours: number;
}

export interface WorkerUpdatePayload {
  name?: string;
  email?: string;
  role?: string;
  department?: string;
  status?: string;
  daily_capacity_hours?: number;
}

export interface NormalisedWorker {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  avatar: string;
  dailyCapacityHours: number;
}

export interface CapabilityItem {
  capability: string;
  proficiency: number;
}

export interface NormalisedCapability {
  id: number;
  workerId: string;
  capability: string;
  proficiency: number;
}

// ─── Normalisers ──────────────────────────────────────────────────────────────

function normaliseWorker(w: any): NormalisedWorker {
  return {
    id:                 String(w.id),
    name:               w.name,
    email:              w.email ?? '',
    role:               w.role ?? '',
    department:         w.department ?? '',
    status:             w.status ?? 'active',
    avatar:             w.avatar ?? w.name?.slice(0, 2).toUpperCase() ?? '??',
    dailyCapacityHours: w.daily_capacity_hours ?? 8,
  };
}

function normaliseCapability(c: any): NormalisedCapability {
  return {
    id:          c.id,
    workerId:    String(c.worker_id),
    capability:  c.capability,
    proficiency: c.proficiency,
  };
}

// ─── Worker service ───────────────────────────────────────────────────────────

export const workerService = {
  async getWorkers(): Promise<NormalisedWorker[]> {
    const res = await fetch(`${WORKER_BASE}/`);
    if (!res.ok) throw new Error('Failed to fetch workers');
    return (await res.json()).map(normaliseWorker);
  },

  async getWorker(workerId: number): Promise<NormalisedWorker> {
    const res = await fetch(`${WORKER_BASE}/${workerId}`);
    if (!res.ok) throw new Error('Failed to fetch worker');
    return normaliseWorker(await res.json());
  },

  async createWorker(data: WorkerCreatePayload): Promise<NormalisedWorker> {
    const res = await fetch(`${WORKER_BASE}/`, {
      method: 'POST',
      body:   toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create worker');
    return normaliseWorker(await res.json());
  },

  async updateWorker(workerId: number, data: WorkerUpdatePayload): Promise<NormalisedWorker> {
    const res = await fetch(`${WORKER_BASE}/${workerId}`, {
      method: 'PATCH',
      body:   toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to update worker');
    return normaliseWorker(await res.json());
  },

  async updateWorkerStatus(workerId: number, status: string): Promise<NormalisedWorker> {
    const fd = new FormData();
    fd.append('status', status);
    const res = await fetch(`${WORKER_BASE}/${workerId}/status`, {
      method: 'PATCH',
      body:   fd,
    });
    if (!res.ok) throw new Error('Failed to update worker status');
    return normaliseWorker(await res.json());
  },

  async deleteWorker(workerId: number): Promise<void> {
    const res = await fetch(`${WORKER_BASE}/${workerId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete worker');
  },

  async getWorkersByDepartment(department: string): Promise<NormalisedWorker[]> {
    const res = await fetch(`${WORKER_BASE}/department/${department}`);
    if (!res.ok) throw new Error('Failed to fetch workers by department');
    return (await res.json()).map(normaliseWorker);
  },

  async getWorkersWithTasks(): Promise<any[]> {
    const res = await fetch(`${WORKER_BASE}/with-tasks`);
    if (!res.ok) throw new Error('Failed to fetch workers with tasks');
    return res.json();
  },
};

// ─── Capability service ───────────────────────────────────────────────────────

export const capabilityService = {
  async getCapabilities(workerId: number): Promise<NormalisedCapability[]> {
    const res = await fetch(`${CAP_BASE}/${workerId}/capabilities`);
    if (!res.ok) throw new Error('Failed to fetch capabilities');
    return (await res.json()).map(normaliseCapability);
  },

  /** Bulk-insert — used on Add Worker (one round-trip for all skills) */
  async bulkCreate(workerId: number, capabilities: CapabilityItem[]): Promise<NormalisedCapability[]> {
    const res = await fetch(`${CAP_BASE}/${workerId}/capabilities/bulk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ capabilities }),
    });
    if (!res.ok) throw new Error('Failed to bulk-create capabilities');
    return (await res.json()).map(normaliseCapability);
  },

  /** Replace strategy — wipe + re-insert (used on Edit Worker save) */
  async replaceAll(workerId: number, capabilities: CapabilityItem[]): Promise<NormalisedCapability[]> {
    // 1. Delete all existing
    const del = await fetch(`${CAP_BASE}/${workerId}/capabilities`, { method: 'DELETE' });
    if (!del.ok) throw new Error('Failed to clear capabilities');

    // 2. Skip bulk insert if list is empty
    if (capabilities.length === 0) return [];

    // 3. Re-insert fresh list
    return capabilityService.bulkCreate(workerId, capabilities);
  },
};