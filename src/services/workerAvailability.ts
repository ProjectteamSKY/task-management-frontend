const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/workers`;

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
  // GET /workers/:worker_id/availability/
  async getAvailability(workerId: number): Promise<WorkerAvailability[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/`);
    if (!res.ok) throw new Error('Failed to fetch availability');
    return res.json();
  },

  // GET /workers/:worker_id/availability/:status
  async getAvailabilityByStatus(
    workerId: number,
    status: 'available' | 'blocked' | 'recurring' | 'leave'
  ): Promise<WorkerAvailability[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${status}`);
    if (!res.ok) throw new Error('Failed to fetch availability by status');
    return res.json();
  },

  // POST /workers/:worker_id/availability/
  async createAvailability(workerId: number, data: AvailabilityCreatePayload) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create availability');
    return res.json();
  },

  // PATCH /workers/:worker_id/availability/:record_id
  async updateAvailability(workerId: number, recordId: number, data: AvailabilityUpdatePayload) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${recordId}`, {
      method: 'PATCH',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to update availability');
    return res.json();
  },

  // PATCH /workers/:worker_id/availability/:record_id/approval
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

  // DELETE /workers/:worker_id/availability/:record_id
  async deleteAvailability(workerId: number, recordId: number) {
    const res = await fetch(`${BASE_URL}/${workerId}/availability/${recordId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete availability');
    return res.json();
  },
};