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
  depends_on?: number[];
}

export interface Task {
  id: number;
  title: string;
  status: string;
}

export interface TaskDependency {
  /** The task that must finish first */
  depends_on_id: number;
  /** The task that depends on it (= the task we queried) */
  task_id: number;
}

// helper — backend expects multipart/form-data (FastAPI Form(...))
function toFormData(data: Record<string, any>): FormData {
  const fd = new FormData();
  Object.entries(data).forEach(([key, val]) => {
    if (val !== null && val !== undefined && val !== "") {
      fd.append(key, String(val));
    }
  });
  return fd;
}

export const taskService = {
  // ── Core CRUD ───────────────────────────────────────────────────────────────

  // POST /tasks/
  async createTask(data: TaskCreatePayload) {
    const res = await fetch(`${BASE_URL}/`, {
      method: "POST",
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error("Failed to create task");
    return res.json();
  },

  // GET /tasks/
  async getTasks(): Promise<Task[]> {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error("Failed to fetch tasks");
    return res.json();
  },

  // GET /tasks/status/:status
  async getTasksByStatus(status: string) {
    const res = await fetch(`${BASE_URL}/status/${status}`);
    if (!res.ok) throw new Error("Failed to fetch tasks by status");
    return res.json();
  },

  // GET /tasks/project/:project_id
  async getTasksByProject(projectId: number) {
    const res = await fetch(`${BASE_URL}/project/${projectId}`);
    if (!res.ok) throw new Error("Failed to fetch tasks by project");
    return res.json();
  },

  // GET /tasks/:task_id
  async getTask(taskId: number) {
    const res = await fetch(`${BASE_URL}/${taskId}`);
    if (!res.ok) throw new Error("Failed to fetch task");
    return res.json();
  },

  // PATCH /tasks/:task_id/status
  async updateTaskStatus(taskId: number, status: string) {
    const fd = new FormData();
    fd.append("status", status);
    const res = await fetch(`${BASE_URL}/${taskId}/status`, {
      method: "PATCH",
      body: fd,
    });
    if (!res.ok) throw new Error("Failed to update task status");
    return res.json();
  },

  // PUT /tasks/:task_id — used by Gantt drag-to-save
  async updateTaskDates(taskId: number, start_date: string, end_date: string) {
    const res = await fetch(`${BASE_URL}/${taskId}`, {
      method: "PUT",
      body: toFormData({ start_date, end_date }),
    });
    if (!res.ok) throw new Error("Failed to update task dates");
    return res.json();
  },

  // ── Dependencies ────────────────────────────────────────────────────────────

  /**
   * GET /tasks/:task_id/dependencies
   * Returns the list of tasks that `taskId` depends on.
   * Each item has at minimum { depends_on_id: number, task_id: number }.
   */
  async getTaskDependencies(taskId: number): Promise<TaskDependency[]> {
    const res = await fetch(`${BASE_URL}/${taskId}/dependencies`);
    if (!res.ok) throw new Error(`Failed to fetch dependencies for task ${taskId}`);
    return res.json();
  },

  /**
   * POST /tasks/:task_id/dependencies
   * Records that `taskId` depends on `dependsOnId` (finish-to-start).
   */
  async addDependency(taskId: number, dependsOnId: number) {
    const fd = new FormData();
    fd.append("depends_on_id", String(dependsOnId));
    const res = await fetch(`${BASE_URL}/${taskId}/dependencies`, {
      method: "POST",
      body: fd,
    });
    if (!res.ok) throw new Error("Failed to add dependency");
    return res.json();
  },

  /**
   * DELETE /tasks/:task_id/dependencies/:depends_on_id
   * Removes the dependency link between `taskId` and `dependsOnId`.
   */
  async removeDependency(taskId: number, dependsOnId: number) {
    const res = await fetch(
      `${BASE_URL}/${taskId}/dependencies/${dependsOnId}`,
      { method: "DELETE" }
    );
    if (!res.ok) throw new Error("Failed to remove dependency");
    // 204 No Content is a valid success — guard before parsing
    if (res.status === 204) return null;
    return res.json();
  },

  /**
   * GET /tasks/:task_id/is-ready
   * Returns whether all predecessor tasks are complete.
   */
  async isTaskReady(taskId: number): Promise<{ ready: boolean }> {
    const res = await fetch(`${BASE_URL}/${taskId}/is-ready`);
    if (!res.ok) throw new Error("Failed to check task readiness");
    return res.json();
  },
};