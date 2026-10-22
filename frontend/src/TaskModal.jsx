import { useEffect, useRef, useState } from 'react';

// task = null -> "Create Task"; task = {...} -> "Edit Task"
export default function TaskModal({ task, onClose, onSave }) {
  const [title, setTitle] = useState(task?.title ?? '');
  const [dueDate, setDueDate] = useState(task?.due_date?.slice(0, 10) ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!title.trim()) return setError('O nome da tarefa é obrigatório.');
    setSaving(true);
    try {
      await onSave({ title: title.trim(), dueDate: dueDate || null });
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  return (
    <div className="overlay" onMouseDown={onClose}>
      <form className="modal" onMouseDown={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
        <h2>{task ? 'Edit Task' : 'Create Task'}</h2>

        <label htmlFor="title">Título</label>
        <input
          id="title"
          ref={inputRef}
          value={title}
          maxLength={255}
          placeholder="Ex.: Planejar as férias"
          onChange={(e) => { setTitle(e.target.value); setError(''); }}
        />

        <label htmlFor="due">Data limite (opcional)</label>
        <input id="due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />

        {error && <p className="error" role="alert">{error}</p>}

        <div className="actions">
          <button type="button" className="btn ghost" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn" disabled={saving}>
            {task ? 'Save changes' : 'Create task'}
          </button>
        </div>
      </form>
    </div>
  );
}
