const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/workers`;
const ALL_LEAVES_URL = `${import.meta.env.VITE_API_BASE_URL}/leaves`;  // ← global endpoint

export interface WorkerAvailability {
  id: number;
  worker_id: number;
  status: 'available' | 'blocked' | 'recurring' | 'leave';
  day_of_week?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  leave_type?: string | null;
  reason?: string | null;
  is_enabled?: boolean;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
}

export interface WorkerLeave {
  id: number;
  worker_id: number;
  leave_type?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  reason?: string | null;
  status?: string | null;
  approval_status?: 'pending' | 'approved' | 'rejected' | null;
  created_at?: string | null;
  worker_name?: string | null;
}

export interface AvailabilityCreatePayload {
  status: 'available' | 'blocked' | 'recurring' | 'leave';
  day_of_week?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  leave_type?: string | null;
  reason?: string | null;
  is_enabled?: boolean;
}

export interface AvailabilityUpdatePayload {
  day_of_week?: number | null;
  start_time?: string | null;
  end_time?: string | null;
  from_date?: string | null;
  to_date?: string | null;
  leave_type?: string | null;
  reason?: string | null;
  is_enabled?: boolean | null;
}

function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      fd.append(key, String(val));
    }
  });
  return fd;
}

export const workerAvailabilityService = {
  // ── Availability ────────────────────────────────────────────────────────────

  async getAvailability(workerId: number): Promise<WorkerAvailability[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
  },

  async getAvailabilityByStatus(
    workerId: number,
    status: 'available' | 'blocked' | 'recurring' | 'leave'
  ): Promise<WorkerAvailability[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${status}`);
    if (!res.ok) throw new Error('Failed to fetch availability by status');
    return res.json();
  },

  async createAvailability(workerId: number, data: AvailabilityCreatePayload) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create availability');
    return res.json();
  },

  async updateAvailability(workerId: number, recordId: number, data: AvailabilityUpdatePayload) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${recordId}`, {
      method: 'PATCH',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  },

  async updateApprovalStatus(
    workerId: number,
    recordId: number,
    approvalStatus: 'pending' | 'approved' | 'rejected'
  ) {
    const fd = new FormData();
    fd.append('approval_status', approvalStatus);
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${recordId}/approval`, {
      method: 'PATCH',
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to update approval status');
    return res.json();
  },

  async deleteAvailability(workerId: number, recordId: number) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${recordId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete availability');
    return res.json();
  },

  // ── Leaves ──────────────────────────────────────────────────────────────────

  // GET /leaves              → all workers' leaves (single call, no worker_id needed)
  // GET /workers/:id/leaves/ → single worker's leaves
  async getAllLeaves(): Promise<WorkerLeave[]> {
    const res = await fetch(ALL_LEAVES_URL);
    if (!res.ok) throw new Error('Failed to fetch all leaves');
    return res.json();
  },

  async getWorkerLeaves(workerId: number): Promise<WorkerLeave[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/leaves/`);
    if (!res.ok) throw new Error(`Failed to fetch leaves for worker ${workerId}`);
    return res.json();
  },

  // PUT /workers/:worker_id/leaves/:leave_id/approve
  async approveLeave(workerId: number, leaveId: number): Promise<WorkerLeave> {
    const res = await fetch(`${BASE_URL}/${workerId}/leaves/${leaveId}/approve`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error(`Failed to approve leave ${leaveId}`);
    return res.json();
  },

  // PUT /workers/:worker_id/leaves/:leave_id/reject
  async rejectLeave(workerId: number, leaveId: number): Promise<WorkerLeave> {
    const res = await fetch(`${BASE_URL}/${workerId}/leaves/${leaveId}/reject`, {
      method: 'PUT',
    });
    if (!res.ok) throw new Error(`Failed to reject leave ${leaveId}`);
    return res.json();
  },
};