const WORKER_BASE = `${import.meta.env.VITE_API_BASE_URL}/workers`;

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

export interface EmergencyContactPayload {
  full_name:     string;
  phone:         string;
  relationship?: string;
  email?:        string;
  address?:      string;
}

export interface NormalisedEmergencyContact {
  id:           number;
  workerId:     number;
  fullName:     string;
  relationship: string;
  phone:        string;
  email:        string;
  address:      string;
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

function normaliseEmergencyContact(c: any): NormalisedEmergencyContact {
  return {
    id:           c.id,
    workerId:     c.worker_id,
    fullName:     c.full_name    ?? '',
    relationship: c.relationship ?? '',
    phone:        c.phone        ?? '',
    email:        c.email        ?? '',
    address:      c.address      ?? '',
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

  async getEmergencyContact(workerId: number): Promise<NormalisedEmergencyContact | null> {
    const res = await fetch(`${WORKER_BASE}/${workerId}/emergency-contact`);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error('Failed to fetch emergency contact');
    return normaliseEmergencyContact(await res.json());
  },

  async upsertEmergencyContact(workerId: number, data: EmergencyContactPayload): Promise<NormalisedEmergencyContact> {
    const res = await fetch(`${WORKER_BASE}/${workerId}/emergency-contact`, {
      method: 'PUT',
      body:   toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to save emergency contact');
    return normaliseEmergencyContact(await res.json());
  },

  async deleteEmergencyContact(workerId: number): Promise<void> {
    const res = await fetch(`${WORKER_BASE}/${workerId}/emergency-contact`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete emergency contact');
  },
};

// ─── Capability service ───────────────────────────────────────────────────────

export const capabilityService = {
  async getCapabilities(workerId: number): Promise<NormalisedCapability[]> {
    const res = await fetch(`${WORKER_BASE}/${workerId}/capabilities`);
    if (!res.ok) throw new Error('Failed to fetch capabilities');
    return (await res.json()).map(normaliseCapability);
  },

  async bulkCreate(workerId: number, capabilities: CapabilityItem[]): Promise<NormalisedCapability[]> {
    const res = await fetch(`${WORKER_BASE}/${workerId}/capabilities/bulk`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ capabilities }),
    });
    if (!res.ok) throw new Error('Failed to bulk-create capabilities');
    return (await res.json()).map(normaliseCapability);
  },

  async replaceAll(workerId: number, capabilities: CapabilityItem[]): Promise<NormalisedCapability[]> {
    const del = await fetch(`${WORKER_BASE}/${workerId}/capabilities`, { method: 'DELETE' });
    if (!del.ok) throw new Error('Failed to clear capabilities');
    if (capabilities.length === 0) return [];
    return capabilityService.bulkCreate(workerId, capabilities);
  },
};