import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  Save,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Loader2,
  FileText,
  ChevronRight,
  CalendarDays,
} from 'lucide-react';
import toast from 'react-hot-toast';
import MeetingNotesAPI from '../api/meetingNotes';

/* ── Helpers ──────────────────────────────────────────────────── */
function formatDisplayDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatSidebarDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function todayTitle() {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

/* ── Save-status pill ─────────────────────────────────────────── */
function SaveStatus({ status, updatedAt }) {
  if (status === 'saved')
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-600 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" />
        Saved {updatedAt ? `· ${formatDisplayDate(updatedAt)}` : ''}
      </span>
    );
  if (status === 'saving')
    return (
      <span className="inline-flex items-center gap-1.5 text-primary-600 text-xs font-semibold animate-pulse">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        Saving…
      </span>
    );
  if (status === 'error')
    return (
      <span className="inline-flex items-center gap-1.5 text-red-500 text-xs font-semibold">
        <AlertCircle className="w-3.5 h-3.5" />
        Save failed
      </span>
    );
  if (status === 'typing')
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        Unsaved changes
      </span>
    );
  if (updatedAt)
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-400 text-xs font-medium">
        <Clock className="w-3.5 h-3.5" />
        Last saved {formatDisplayDate(updatedAt)}
      </span>
    );
  return null;
}

/* ── Main Page ─────────────────────────────────────────────────── */
export default function ActionPoints() {
  const [notes, setNotes]             = useState([]);       // sidebar list
  const [activeId, setActiveId]       = useState(null);     // selected note id
  const [title, setTitle]             = useState('');
  const [content, setContent]         = useState('');
  const [saveStatus, setSaveStatus]   = useState('idle');
  const [updatedAt, setUpdatedAt]     = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [noteLoading, setNoteLoading] = useState(false);
  const [showDelete, setShowDelete]   = useState(false);
  const [deleting, setDeleting]       = useState(false);
  const [creating, setCreating]       = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true); // mobile toggle

  const debounceRef  = useRef(null);
  const titleRef     = useRef(null);
  const contentRef   = useRef(null);

  /* ── Load sidebar list ── */
  const loadList = useCallback(async () => {
    try {
      const { data } = await MeetingNotesAPI.getAll();
      setNotes(data);
      return data;
    } catch {
      toast.error('Failed to load notes');
      return [];
    } finally {
      setListLoading(false);
    }
  }, []);

  useEffect(() => {
    loadList().then((list) => {
      // Auto-select the first (most recent) note
      if (list.length > 0) openNote(list[0].id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Open a note from sidebar ── */
  const openNote = useCallback(async (id) => {
    setActiveId(id);
    setSaveStatus('idle');
    setNoteLoading(true);
    clearTimeout(debounceRef.current);
    try {
      const { data } = await MeetingNotesAPI.getOne(id);
      setTitle(data.title);
      setContent(data.content || '');
      setUpdatedAt(data.updatedAt);
    } catch {
      toast.error('Failed to load note');
    } finally {
      setNoteLoading(false);
    }
  }, []);

  /* ── Core save (title + content) ── */
  const triggerSave = useCallback(async (id, t, c) => {
    if (!id) return;
    clearTimeout(debounceRef.current);
    setSaveStatus('saving');
    try {
      const { data } = await MeetingNotesAPI.update(id, { title: t, content: c });
      setUpdatedAt(data.updatedAt);
      setSaveStatus('saved');
      // Refresh sidebar title silently
      setNotes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, title: data.title, updatedAt: data.updatedAt } : n))
      );
    } catch {
      setSaveStatus('error');
      toast.error('Failed to save');
    }
  }, []);

  /* ── Debounce helper ── */
  const scheduleSave = useCallback((id, t, c) => {
    setSaveStatus('typing');
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => triggerSave(id, t, c), 1800);
  }, [triggerSave]);

  /* ── Ctrl+S shortcut ── */
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        clearTimeout(debounceRef.current);
        triggerSave(activeId, title, content);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeId, title, content, triggerSave]);

  /* ── Cleanup debounce on unmount ── */
  useEffect(() => () => clearTimeout(debounceRef.current), []);

  /* ── Title change ── */
  const handleTitleChange = (e) => {
    const val = e.target.value;
    setTitle(val);
    scheduleSave(activeId, val, content);
  };

  /* ── Content change ── */
  const handleContentChange = (e) => {
    const val = e.target.value;
    setContent(val);
    scheduleSave(activeId, title, val);
  };

  /* ── Create new note ── */
  const handleCreate = async () => {
    setCreating(true);
    try {
      const { data } = await MeetingNotesAPI.create({ title: todayTitle(), content: '' });
      setNotes((prev) => [data, ...prev]);
      await openNote(data.id);
      setSidebarOpen(false); // mobile: switch to editor
      setTimeout(() => titleRef.current?.select(), 100);
    } catch {
      toast.error('Failed to create note');
    } finally {
      setCreating(false);
    }
  };

  /* ── Delete active note ── */
  const handleDelete = async () => {
    if (!activeId) return;
    setDeleting(true);
    try {
      await MeetingNotesAPI.remove(activeId);
      const remaining = notes.filter((n) => n.id !== activeId);
      setNotes(remaining);
      setShowDelete(false);
      if (remaining.length > 0) {
        openNote(remaining[0].id);
      } else {
        setActiveId(null);
        setTitle('');
        setContent('');
        setUpdatedAt(null);
        setSaveStatus('idle');
      }
      toast.success('Note deleted');
    } catch {
      toast.error('Failed to delete');
    } finally {
      setDeleting(false);
    }
  };

  const isSaving = saveStatus === 'saving';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">

      {/* ── Top Bar ───────────────────────────────────────────── */}
      <div className="bg-white border-b-2 border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 h-16 flex items-center justify-between gap-3">
          {/* Left */}
          <div className="flex items-center gap-3">
            <Link
              to="/ideas"
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              title="Back to Ideas"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500" />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary-50 border border-primary-100 rounded-xl flex items-center justify-center">
                <ClipboardList className="w-4 h-4 text-primary-600" />
              </div>
              <h1 className="text-lg font-black text-slate-900 tracking-tight hidden sm:block">
                Meeting Notes
              </h1>
            </div>
          </div>

          {/* Right */}
          <div className="flex items-center gap-2">
            {activeId && <SaveStatus status={saveStatus} updatedAt={updatedAt} />}

            {/* Delete */}
            {activeId && (
              <button
                onClick={() => setShowDelete(true)}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600
                           hover:bg-red-50 border border-red-100 rounded-xl transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}

            {/* Manual Save */}
            {activeId && (
              <button
                onClick={() => { clearTimeout(debounceRef.current); triggerSave(activeId, title, content); }}
                disabled={isSaving || noteLoading}
                className="flex items-center gap-1.5 bg-primary-500 hover:bg-primary-600 disabled:opacity-60
                           text-white font-bold px-4 py-2 rounded-xl transition-all text-sm
                           shadow-md shadow-primary-500/20 active:scale-95 border-2 border-primary-400"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save
              </button>
            )}

            {/* New Note */}
            <button
              onClick={handleCreate}
              disabled={creating}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold
                         px-4 py-2 rounded-xl transition-all text-sm active:scale-95 border-2 border-slate-700"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">New Note</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Body: Sidebar + Editor ─────────────────────────────── */}
      <div className="flex flex-1 max-w-[1400px] mx-auto w-full">

        {/* ── LEFT SIDEBAR ── */}
        <div className="w-72 min-w-[240px] max-w-xs bg-white border-r-2 border-gray-100 flex flex-col shrink-0 sticky top-16 h-[calc(100vh-64px)] overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {notes.length} session{notes.length !== 1 ? 's' : ''}
            </p>
          </div>

          {listLoading ? (
            <div className="flex items-center justify-center flex-1 p-8">
              <Loader2 className="w-6 h-6 text-primary-400 animate-spin" />
            </div>
          ) : notes.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 p-8 text-center">
              <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center mb-3">
                <FileText className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-sm text-slate-400 font-medium">No notes yet</p>
              <p className="text-xs text-slate-300 mt-1">Click "New Note" to start</p>
            </div>
          ) : (
            <nav className="flex-1 overflow-y-auto p-2 space-y-1">
              {notes.map((note) => (
                <button
                  key={note.id}
                  onClick={() => openNote(note.id)}
                  className={`w-full text-left px-3 py-3 rounded-xl transition-all duration-150 group
                    ${activeId === note.id
                      ? 'bg-primary-50 border border-primary-100'
                      : 'hover:bg-gray-50 border border-transparent'
                    }`}
                >
                  <div className="flex items-start gap-2">
                    <FileText className={`w-4 h-4 mt-0.5 shrink-0 ${activeId === note.id ? 'text-primary-500' : 'text-gray-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className={`text-sm font-bold truncate leading-tight
                        ${activeId === note.id ? 'text-primary-700' : 'text-slate-700'}`}>
                        {note.title}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" />
                        {formatSidebarDate(note.updatedAt || note.createdAt)}
                      </p>
                    </div>
                    {activeId === note.id && (
                      <ChevronRight className="w-3.5 h-3.5 text-primary-400 shrink-0 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </nav>
          )}
        </div>

        {/* ── RIGHT EDITOR ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {!activeId ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center flex-1 p-12 text-center">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center"
              >
                <div className="w-20 h-20 bg-primary-50 border-2 border-primary-100 rounded-3xl flex items-center justify-center mb-6">
                  <ClipboardList className="w-10 h-10 text-primary-400" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">No note selected</h2>
                <p className="text-slate-400 font-medium mb-8 max-w-xs">
                  Select a note from the left or create a new one to get started.
                </p>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white
                             font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-primary-500/25
                             active:scale-95 border-2 border-primary-400"
                >
                  {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Create New Note
                </button>
              </motion.div>
            </div>
          ) : noteLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
                <p className="text-slate-400 text-sm font-medium">Loading note…</p>
              </div>
            </div>
          ) : (
            <motion.div
              key={activeId}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col flex-1 p-6 lg:p-8 gap-4"
            >
              {/* Title input */}
              <div className="border-b-2 border-gray-100 pb-4">
                <input
                  ref={titleRef}
                  type="text"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Note title…"
                  maxLength={200}
                  className="w-full text-2xl lg:text-3xl font-black text-slate-900 placeholder-slate-300
                             bg-transparent focus:outline-none tracking-tight leading-tight"
                />
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1">
                    <CalendarDays className="w-3 h-3" />
                    {formatDisplayDate(updatedAt)}
                  </span>
                  <span className="text-xs text-slate-300">·</span>
                  <span className="text-xs text-slate-400">{content.length.toLocaleString()} chars</span>
                </div>
              </div>

              {/* Content textarea */}
              <textarea
                ref={contentRef}
                value={content}
                onChange={handleContentChange}
                placeholder={`Write your meeting notes, action items, and decisions here…\n\n• Action item 1\n• Action item 2\n\nPress Ctrl+S to save instantly.`}
                className="flex-1 w-full min-h-[calc(100vh-320px)] text-slate-800 font-medium text-base leading-8
                           placeholder-slate-300 resize-none focus:outline-none bg-transparent
                           font-[Outfit,Inter,sans-serif]"
                spellCheck
                autoFocus={!noteLoading}
              />

              {/* Bottom bar */}
              <div className="flex items-center justify-between pt-3 border-t border-gray-100 sm:hidden">
                <button
                  onClick={() => setShowDelete(true)}
                  className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-600
                             hover:bg-red-50 border border-red-100 rounded-xl transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
                <SaveStatus status={saveStatus} updatedAt={updatedAt} />
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* ── Delete Confirmation Modal ──────────────────────────── */}
      <AnimatePresence>
        {showDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              onClick={() => setShowDelete(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              className="relative bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full border-2 border-gray-100"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-50 border-2 border-red-100 rounded-2xl flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-red-500" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Delete this note?</h3>
                  <p className="text-sm text-slate-500 mt-0.5 font-medium">"{title}"</p>
                </div>
              </div>
              <p className="text-sm text-slate-400 font-medium mb-6">
                This action cannot be undone. The note will be permanently deleted.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDelete(false)}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-slate-700 font-bold py-3 rounded-xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600
                             disabled:opacity-60 text-white font-bold py-3 rounded-xl transition-colors active:scale-95"
                >
                  {deleting && <Loader2 className="w-4 h-4 animate-spin" />}
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
