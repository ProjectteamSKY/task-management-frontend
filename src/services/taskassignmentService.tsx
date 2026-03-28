const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/assignments`;

function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      fd.append(key, String(val));
    }
  });
  return fd;
}

export interface AssignmentCreatePayload {
  task_id: number;
  worker_id: number;
  allocated_hours: number;
  assigned_date: string;
  status?: string;
}

export const assignmentService = {
  // POST /assignments/
  async createAssignment(data: AssignmentCreatePayload) {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create assignment');
    return res.json();
  },

  // GET /assignments/
  async getAssignments() {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error('Failed to fetch assignments');
    return res.json();
  },

  // GET /assignments/worker/:worker_id
  async getAssignmentsByWorker(workerId: number) {
    const res = await fetch(`${BASE_URL}/worker/${workerId}`);
    if (!res.ok) throw new Error('Failed to fetch assignments by worker');
    return res.json();
  },

  // GET /assignments/task/:task_id
  async getAssignmentsByTask(taskId: number) {
    const res = await fetch(`${BASE_URL}/task/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch assignments by task');
    return res.json();
  },

  // DELETE /assignments/:assignment_id
  async deleteAssignment(assignmentId: number) {
    const res = await fetch(`${BASE_URL}/${assignmentId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete assignment');
    return res.json();
  },

  // PATCH /assignments/:assignment_id/status
  async updateAssignmentStatus(assignmentId: number, status: string) {
    const fd = new FormData();
    fd.append('status', status);
    const res = await fetch(`${BASE_URL}/${assignmentId}/status`, {
      method: 'PATCH',
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to update assignment status');
    return res.json();
  },
};