import { useState, useEffect, useCallback } from 'react';
import { Plus, Pin, PinOff, Trash2, Search, Tag, X } from 'lucide-react';
import { Card, Button } from '../shared';
import { listNotes, createNote, updateNote, deleteNote } from '../../lib/tauri-bridge';
import type { Note } from '../../types/models';

export function NotesView() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editTags, setEditTags] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  const loadNotes = useCallback(async () => {
    const loaded = await listNotes();
    setNotes(loaded);
    return loaded;
  }, []);

  useEffect(() => { loadNotes(); }, [loadNotes]);

  const handleNewNote = async () => {
    const note = await createNote('Untitled Note', '', []);
    await loadNotes();
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags('');
    setDirty(false);
  };

  const handleSelectNote = (note: Note) => {
    if (dirty && activeNote) handleSave();
    setActiveNote(note);
    setEditTitle(note.title);
    setEditContent(note.content);
    setEditTags(note.tags.join(', '));
    setDirty(false);
  };

  const handleSave = async () => {
    if (!activeNote) return;
    setSaving(true);
    const tags = editTags.split(',').map((t) => t.trim()).filter(Boolean);
    const updated = await updateNote(activeNote.id, {
      title: editTitle,
      content: editContent,
      tags,
    });
    setActiveNote(updated);
    setDirty(false);
    await loadNotes();
    setSaving(false);
  };

  const handleDelete = async (noteId: string) => {
    await deleteNote(noteId);
    if (activeNote?.id === noteId) {
      setActiveNote(null);
    }
    await loadNotes();
  };

  const handleTogglePin = async (note: Note) => {
    await updateNote(note.id, { pinned: !note.pinned });
    await loadNotes();
    if (activeNote?.id === note.id) {
      setActiveNote({ ...note, pinned: !note.pinned });
    }
  };

  // All unique tags
  const allTags = Array.from(new Set(notes.flatMap((n) => n.tags)));

  // Filter
  const filtered = notes
    .filter((n) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        if (!n.title.toLowerCase().includes(q) && !n.content.toLowerCase().includes(q)) return false;
      }
      if (filterTag && !n.tags.includes(filterTag)) return false;
      return true;
    })
    .sort((a, b) => {
      if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
      return b.updated_at.localeCompare(a.updated_at);
    });

  return (
    <div className="flex gap-4 h-full" style={{ minHeight: 'calc(100vh - 120px)' }}>
      {/* Sidebar - note list */}
      <div
        className="flex flex-col gap-2 shrink-0 overflow-y-auto"
        style={{ width: '280px' }}
      >
        <div className="flex items-center justify-between mb-1">
          <h2
            className="text-xl font-bold"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}
          >
            Notes
          </h2>
          <Button size="sm" onClick={handleNewNote}>
            <Plus size={14} /> New
          </Button>
        </div>

        {/* Search */}
        <div
          className="flex items-center gap-2 px-3 py-2"
          style={{
            background: 'var(--bg-tertiary)',
            borderRadius: 'var(--border-radius)',
            border: '1px solid var(--border-color)',
          }}
        >
          <Search size={14} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes..."
            className="flex-1 text-xs bg-transparent border-none outline-none"
            style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-body)' }}
          />
        </div>

        {/* Tag filters */}
        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setFilterTag(filterTag === tag ? null : tag)}
                className="flex items-center gap-1 px-2 py-0.5 text-xs border-none cursor-pointer"
                style={{
                  background: filterTag === tag ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
                  color: filterTag === tag ? 'var(--text-inverse)' : 'var(--text-muted)',
                  borderRadius: 'var(--border-radius)',
                }}
              >
                <Tag size={10} />
                {tag}
              </button>
            ))}
            {filterTag && (
              <button
                onClick={() => setFilterTag(null)}
                className="px-2 py-0.5 text-xs border-none cursor-pointer"
                style={{ background: 'transparent', color: 'var(--accent-danger)' }}
              >
                <X size={10} />
              </button>
            )}
          </div>
        )}

        {/* Note list */}
        <div className="flex flex-col gap-1 mt-1">
          {filtered.map((note) => (
            <button
              key={note.id}
              onClick={() => handleSelectNote(note)}
              className="flex flex-col gap-0.5 p-3 text-left border-none cursor-pointer transition-colors duration-100"
              style={{
                background: activeNote?.id === note.id ? 'var(--accent-primary)' : 'var(--bg-surface)',
                color: activeNote?.id === note.id ? 'var(--text-inverse)' : 'var(--text-primary)',
                borderRadius: 'var(--border-radius)',
                border: '1px solid var(--border-color)',
              }}
            >
              <div className="flex items-center gap-1.5">
                {note.pinned && <Pin size={10} />}
                <span className="text-sm font-medium truncate" style={{ fontFamily: 'var(--font-display)' }}>
                  {note.title || 'Untitled'}
                </span>
              </div>
              <span
                className="text-xs truncate"
                style={{
                  color: activeNote?.id === note.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                  opacity: activeNote?.id === note.id ? 0.7 : 1,
                }}
              >
                {note.content.slice(0, 60) || 'Empty note'}
              </span>
              <span
                className="text-xs"
                style={{
                  color: activeNote?.id === note.id ? 'var(--text-inverse)' : 'var(--text-muted)',
                  opacity: 0.6,
                  fontFamily: 'var(--font-code)',
                  fontSize: '0.65rem',
                }}
              >
                {new Date(note.updated_at).toLocaleDateString()}
              </span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-center py-8 text-sm" style={{ color: 'var(--text-muted)' }}>
              {notes.length === 0 ? 'No notes yet. Create one!' : 'No matching notes.'}
            </div>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 flex flex-col gap-3">
        {activeNote ? (
          <>
            {/* Title */}
            <input
              type="text"
              value={editTitle}
              onChange={(e) => { setEditTitle(e.target.value); setDirty(true); }}
              placeholder="Note title..."
              className="text-xl font-bold bg-transparent border-none outline-none"
              style={{
                color: 'var(--text-primary)',
                fontFamily: 'var(--font-display)',
              }}
            />

            {/* Tags input */}
            <div className="flex items-center gap-2">
              <Tag size={14} style={{ color: 'var(--text-muted)' }} />
              <input
                type="text"
                value={editTags}
                onChange={(e) => { setEditTags(e.target.value); setDirty(true); }}
                placeholder="Tags (comma separated)..."
                className="flex-1 text-xs bg-transparent border-none outline-none"
                style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-code)' }}
              />
            </div>

            {/* Content */}
            <Card className="flex-1" padding={false}>
              <textarea
                value={editContent}
                onChange={(e) => { setEditContent(e.target.value); setDirty(true); }}
                placeholder="Start writing your notes here...&#10;&#10;Use this space to capture key insights, questions, and reflections from your learning sessions."
                className="w-full h-full p-4 text-sm bg-transparent border-none outline-none resize-none"
                style={{
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font-body)',
                  lineHeight: '1.7',
                  minHeight: '400px',
                }}
              />
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleTogglePin(activeNote)}
                  title={activeNote.pinned ? 'Unpin' : 'Pin'}
                >
                  {activeNote.pinned ? <PinOff size={14} /> : <Pin size={14} />}
                  {activeNote.pinned ? 'Unpin' : 'Pin'}
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => handleDelete(activeNote.id)}
                >
                  <Trash2 size={14} /> Delete
                </Button>
              </div>
              <div className="flex items-center gap-3">
                {dirty && (
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Unsaved changes
                  </span>
                )}
                <Button size="sm" onClick={handleSave} disabled={!dirty || saving}>
                  {saving ? 'Saving...' : 'Save'}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <NotebookIcon />
              <p className="text-sm mt-3" style={{ color: 'var(--text-muted)' }}>
                Select a note or create a new one
              </p>
              <Button size="sm" className="mt-3" onClick={handleNewNote}>
                <Plus size={14} /> New Note
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotebookIcon() {
  return (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ opacity: 0.3 }}>
      <rect x="10" y="6" width="28" height="36" rx="3" stroke="var(--text-muted)" strokeWidth="2" />
      <line x1="16" y1="14" x2="32" y2="14" stroke="var(--text-muted)" strokeWidth="1.5" />
      <line x1="16" y1="20" x2="32" y2="20" stroke="var(--text-muted)" strokeWidth="1.5" />
      <line x1="16" y1="26" x2="28" y2="26" stroke="var(--text-muted)" strokeWidth="1.5" />
    </svg>
  );
}
