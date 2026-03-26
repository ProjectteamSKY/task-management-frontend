import { useState } from 'react';
import { PlusIcon, PencilIcon, XIcon, CheckIcon } from '@/components/icons/Icons';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface WorkerNote {
  id:        string;
  content:   string;
  author:    string;
  createdAt: string; // ISO datetime
  updatedAt?: string;
}

interface WorkerNotesProps {
  workerId:      string;
  initialNotes?: WorkerNote[];
  onChange?:     (notes: WorkerNote[]) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function formatDateTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    day:    'numeric',
    month:  'short',
    year:   'numeric',
  }) + ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(mins  / 60);
  const days  = Math.floor(hours / 24);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days  < 7)  return `${days}d ago`;
  return formatDateTime(iso);
}

// ─── Avatar initials ──────────────────────────────────────────────────────────

function AuthorAvatar({ name }: { name: string }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(n => n[0].toUpperCase())
    .join('');
  return (
    <div className="w-7 h-7 rounded-full gradient-primary flex items-center justify-center text-[10px] font-bold text-primary-foreground shrink-0">
      {initials}
    </div>
  );
}

// ─── Note Form ────────────────────────────────────────────────────────────────

function NoteForm({
  initialContent = '',
  onSave,
  onCancel,
  placeholder = 'Write a note…',
  saveLabel   = 'Add Note',
}: {
  initialContent?: string;
  onSave:          (content: string) => void;
  onCancel:        () => void;
  placeholder?:    string;
  saveLabel?:      string;
}) {
  const [content, setContent] = useState(initialContent);
  const [error,   setError]   = useState('');

  function handleSave() {
    if (!content.trim()) { setError('Note cannot be empty'); return; }
    onSave(content.trim());
  }

  return (
    <div className="bg-secondary/40 rounded-xl p-4 space-y-3 border border-border/50">
      <textarea
        rows={3}
        placeholder={placeholder}
        value={content}
        onChange={e => { setContent(e.target.value); setError(''); }}
        className="w-full bg-background border border-input rounded-md px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      />
      {error && <p className="text-[11px] text-destructive">{error}</p>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="text-xs px-3 py-1.5 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSave}
          className="text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
        >
          {saveLabel}
        </button>
      </div>
    </div>
  );
}

// ─── Single Note Card ─────────────────────────────────────────────────────────

function NoteCard({
  note,
  onEdit,
  onDelete,
}: {
  note:     WorkerNote;
  onEdit:   (id: string, content: string) => void;
  onDelete: (id: string) => void;
}) {
  const [editing,   setEditing]   = useState(false);
  const [confirming, setConfirming] = useState(false);

  function handleSave(content: string) {
    onEdit(note.id, content);
    setEditing(false);
  }

  return (
    <div className="flex gap-3 group">
      {/* Left: avatar + vertical line */}
      <div className="flex flex-col items-center gap-0 shrink-0">
        <AuthorAvatar name={note.author} />
        {/* Connector line — hidden on last item via CSS in parent */}
        <div className="w-px flex-1 bg-border/40 mt-2 min-h-[1rem]" />
      </div>

      {/* Right: card */}
      <div className="flex-1 pb-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-xs font-semibold text-foreground">{note.author}</span>
          <span className="text-[10px] text-muted-foreground" title={formatDateTime(note.updatedAt ?? note.createdAt)}>
            {timeAgo(note.updatedAt ?? note.createdAt)}
            {note.updatedAt && <span className="ml-1 italic">(edited)</span>}
          </span>

          {/* Action buttons — visible on hover */}
          {!editing && !confirming && (
            <div className="ml-auto flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={() => setEditing(true)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-border transition-colors"
                title="Edit note"
              >
                <PencilIcon size={11} className="text-muted-foreground" />
              </button>
              <button
                onClick={() => setConfirming(true)}
                className="w-6 h-6 rounded-md flex items-center justify-center bg-secondary hover:bg-destructive/15 transition-colors"
                title="Delete note"
              >
                <XIcon size={11} className="text-muted-foreground" />
              </button>
            </div>
          )}
        </div>

        {/* Body */}
        {editing ? (
          <NoteForm
            initialContent={note.content}
            onSave={handleSave}
            onCancel={() => setEditing(false)}
            saveLabel="Save Changes"
          />
        ) : confirming ? (
          /* Delete confirmation */
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl px-4 py-3 flex items-center gap-3">
            <p className="text-xs text-foreground flex-1">Delete this note?</p>
            <button
              onClick={() => onDelete(note.id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-destructive text-destructive-foreground hover:opacity-90 transition-opacity"
            >
              Delete
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="text-xs px-2.5 py-1 rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/70 transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          /* Note content */
          <div className="bg-secondary/40 border border-border/40 rounded-xl px-4 py-3">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{note.content}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main: WorkerNotes ────────────────────────────────────────────────────────

export default function WorkerNotes({
  initialNotes = [],
  onChange,
}: WorkerNotesProps) {
  const [notes,      setNotes]      = useState<WorkerNote[]>(
    // Most recent first
    [...initialNotes].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  );
  const [showForm, setShowForm] = useState(false);

  function update(updated: WorkerNote[]) {
    setNotes(updated);
    onChange?.(updated);
  }

  function handleAdd(content: string) {
    const newNote: WorkerNote = {
      id:        genId(),
      content,
      author:    'You',                            // replace with real auth user
      createdAt: new Date().toISOString(),
    };
    update([newNote, ...notes]);
    setShowForm(false);
  }

  function handleEdit(id: string, content: string) {
    update(
      notes.map(n =>
        n.id === id ? { ...n, content, updatedAt: new Date().toISOString() } : n
      )
    );
  }

  function handleDelete(id: string) {
    update(notes.filter(n => n.id !== id));
  }

  return (
    <div className="glass rounded-xl p-5">

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Notes & Comments</h3>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {notes.length} note{notes.length !== 1 ? 's' : ''}
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg gradient-primary text-primary-foreground hover:opacity-90 transition-opacity font-medium"
          >
            <PlusIcon size={13} />
            Add Note
          </button>
        )}
      </div>

      {/* Add note form */}
      {showForm && (
        <div className="mb-6">
          <NoteForm
            onSave={handleAdd}
            onCancel={() => setShowForm(false)}
            placeholder="Write a note about this worker…"
          />
        </div>
      )}

      {/* Timeline feed */}
      {notes.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-14 text-center">
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3">
            <CheckIcon size={16} className="text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">No notes yet</p>
          <button
            onClick={() => setShowForm(true)}
            className="mt-2 text-xs text-primary hover:text-primary/70 transition-colors"
          >
            Add the first note
          </button>
        </div>
      ) : (
        <div className="mt-2">
          {notes.map((note, i) => (
            <div key={note.id} className={i === notes.length - 1 ? '[&>div>div:first-child>div:last-child]:hidden' : ''}>
              <NoteCard
                note={note}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}