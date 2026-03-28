const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/tasks`;

export interface TaskCreatePayload {
  title: string;
  description: string;
  status: string;
  priority: string;
  task_type: string;
  estimated_hours: number;
  project_id?: number | null;
  start_date?: string | null;
  end_date?: string | null;
}

// helper — backend expects multipart/form-data (FastAPI Form(...))
function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== '') {
      fd.append(key, String(val));
    }
  });
  return fd;
}

export const taskService = {
  // POST /tasks/
  async createTask(data: TaskCreatePayload) {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create task');
    return res.json();
  },

  // GET /tasks/
  async getTasks() {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error('Failed to fetch tasks');
    return res.json();
  },

  // GET /tasks/status/:status
  async getTasksByStatus(status: string) {
    const res = await fetch(`${BASE_URL}/status/${status}`);
    if (!res.ok) throw new Error('Failed to fetch tasks by status');
    return res.json();
  },

  // GET /tasks/project/:project_id
  async getTasksByProject(projectId: number) {
    const res = await fetch(`${BASE_URL}/project/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch tasks by project');
    return res.json();
  },

  // GET /tasks/:task_id
  async getTask(taskId: number) {
    const res = await fetch(`${BASE_URL}/${taskId}`);
    if (!res.ok) throw new Error('Failed to fetch task');
    return res.json();
  },

  // PATCH /tasks/:task_id/status
  async updateTaskStatus(taskId: number, status: string) {
    const fd = new FormData();
    fd.append('status', status);
    const res = await fetch(`${BASE_URL}/${taskId}/status`, {
      method: 'PATCH',
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to update task status');
    return res.json();
  },
};