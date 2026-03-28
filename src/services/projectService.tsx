const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/projects`;

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status: string;
}

export interface ProjectCreatePayload {
  name: string;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string;
}

export interface ProjectUpdatePayload {
  name?: string | null;
  description?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  status?: string | null;
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

export const projectService = {
  // POST /projects/
  async createProject(data: ProjectCreatePayload) {
    const res = await fetch(`${BASE_URL}/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create project');
    return res.json();
  },

  // GET /projects/
  async getProjects(): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/`);
    if (!res.ok) throw new Error('Failed to fetch projects');
    return res.json();
  },

  // GET /projects/status/:status
  async getProjectsByStatus(status: string): Promise<Project[]> {
    const res = await fetch(`${BASE_URL}/status/${status}`);
    if (!res.ok) throw new Error('Failed to fetch projects by status');
    return res.json();
  },

  // GET /projects/:project_id
  async getProject(projectId: number): Promise<Project> {
    const res = await fetch(`${BASE_URL}/${projectId}`);
    if (!res.ok) throw new Error('Failed to fetch project');
    return res.json();
  },

  // GET /projects/:project_id/tasks
  async getProjectTasks(projectId: number) {
    const res = await fetch(`${BASE_URL}/${projectId}/tasks`);
    if (!res.ok) throw new Error('Failed to fetch project tasks');
    return res.json();
  },

  // GET /projects/:project_id/workers
  async getProjectWorkers(projectId: number) {
    const res = await fetch(`${BASE_URL}/${projectId}/workers`);
    if (!res.ok) throw new Error('Failed to fetch project workers');
    return res.json();
  },

  // PATCH /projects/:project_id
  async updateProject(projectId: number, data: ProjectUpdatePayload) {
    const res = await fetch(`${BASE_URL}/${projectId}`, {
      method: 'PATCH',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to update project');
    return res.json();
  },

  // PATCH /projects/:project_id/status
  async updateProjectStatus(projectId: number, status: string) {
    const fd = new FormData();
    fd.append('status', status);
    const res = await fetch(`${BASE_URL}/${projectId}/status`, {
      method: 'PATCH',
      body: fd,
    });
    if (!res.ok) throw new Error('Failed to update project status');
    return res.json();
  },

  // DELETE /projects/:project_id
  async deleteProject(projectId: number) {
    const res = await fetch(`${BASE_URL}/${projectId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Failed to delete project');
    return res.json();
  },
};