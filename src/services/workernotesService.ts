const BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/workers`;

export interface WorkerNote {
  id: number;
  worker_id: number;
  notes: string;
  created_at: string;
  updated_at?: string | null;
}

export interface WorkerNoteCreatePayload {
  notes: string;
}

export interface WorkerNoteUpdatePayload {
  notes: string;
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

export const workerNotesService = {
  // GET /workers/:worker_id/notes
  async getNotes(workerId: number): Promise<WorkerNote[]> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes`);
    if (!res.ok) throw new Error('Failed to fetch notes');
    return res.json();
  },

  // GET /workers/:worker_id/notes/:note_id
  async getNote(workerId: number, noteId: number): Promise<WorkerNote> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes/${noteId}`);
    if (!res.ok) throw new Error('Failed to fetch note');
    return res.json();
  },

  // POST /workers/:worker_id/notes
  async createNote(workerId: number, data: WorkerNoteCreatePayload): Promise<WorkerNote> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes/`, {
      method: 'POST',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to create note');
    return res.json();
  },

  // PUT /workers/:worker_id/notes/:note_id
  async updateNote(workerId: number, noteId: number, data: WorkerNoteUpdatePayload): Promise<WorkerNote> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes/${noteId}`, {
      method: 'PUT',
      body: toFormData(data as Record<string, any>),
    });
    if (!res.ok) throw new Error('Failed to update note');
    return res.json();
  },

  // DELETE /workers/:worker_id/notes/:note_id
  async deleteNote(workerId: number, noteId: number): Promise<WorkerNote> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes/${noteId}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete note');
    return res.json();
  },

  // DELETE /workers/:worker_id/notes
  async deleteAllNotes(workerId: number): Promise<WorkerNote> {
    const res = await fetch(`${BASE_URL}/${workerId}/notes`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Failed to delete all notes');
    return res.json();
  },
};