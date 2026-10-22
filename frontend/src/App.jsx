import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import { useDebounce } from './useDebounce.js';
import TaskModal from './TaskModal.jsx';

const todayStr = () => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};
const fmtDate = (s) => s.slice(0, 10).split('-').reverse().join('/');
const isOverdue = (t) => !t.completed && t.due_date && t.due_date.slice(0, 10) < todayStr();

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
       strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{d}</svg>
);
const icons = {
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="M20 6 9 17l-5-5" />,
  edit: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  trash: <><path d="M3 6h18" /><path d="M8 6V4h8v2" /><path d="M19 6l-1 14H6L5 6" /></>,
  chevron: <path d="m6 9 6 6 6-6" />,
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [counts, setCounts] = useState({ total: 0, completed: 0 });
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [modal, setModal] = useState(null); // null | 'new' | task
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const debouncedSearch = useDebounce(search, 400);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  const load = useCallback(async () => {
    try {
      const data = await api.list({ search: debouncedSearch, status });
      setTasks(data.tasks);
      setCounts({ total: data.total, completed: data.completed });
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, status]);

  useEffect(() => { load(); }, [load]);

  async function toggle(t) {
    await api.update(t.id, { completed: !t.completed }).catch((e) => setError(e.message));
    load();
  }

  async function remove(t) {
    if (!window.confirm(`Excluir a tarefa "${t.title}"?`)) return;
    await api.remove(t.id).catch((e) => setError(e.message));
    load();
  }

  async function save(body) {
    if (modal && modal !== 'new') await api.update(modal.id, body);
    else await api.create(body);
    setModal(null);
    load();
  }

  return (
    <main className="app">
      <h1>TODO LIST</h1>

      <div className="toolbar">
        <div className="search">
          <Icon d={icons.search} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search note..."
            aria-label="Buscar tarefas"
          />
        </div>
        <div className="select">
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filtrar por status">
            <option value="all">ALL</option>
            <option value="pending">PENDING</option>
            <option value="completed">COMPLETE</option>
          </select>
          <Icon d={icons.chevron} size={16} />
        </div>
        <button className="icon-btn" onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                aria-label="Alternar tema">
          <Icon d={theme === 'light' ? icons.moon : icons.sun} />
        </button>
      </div>

      <p className="counters">
        <span>Total: <b>{counts.total}</b></span>
        <span>Concluídas: <b>{counts.completed}</b></span>
      </p>

      {error && <p className="error banner" role="alert">{error}</p>}

      {!loading && tasks.length === 0 && !error ? (
        <div className="empty">
          <svg width="120" height="96" viewBox="0 0 120 96" fill="none" aria-hidden="true">
            <rect x="22" y="8" width="76" height="80" rx="10" stroke="var(--accent)" strokeWidth="3" />
            <path d="M40 36h40M40 52h40M40 68h22" stroke="var(--accent)" strokeWidth="3" strokeLinecap="round" opacity=".5" />
          </svg>
          <p>You have no pending tasks.</p>
        </div>
      ) : (
        <ul className="list">
          {tasks.map((t) => {
            const late = isOverdue(t);
            return (
              <li key={t.id} className="item">
                <button className={`check ${t.completed ? 'on' : ''}`} onClick={() => toggle(t)}
                        role="checkbox" aria-checked={t.completed} aria-label={`Concluir ${t.title}`}>
                  {t.completed && <Icon d={icons.check} size={14} />}
                </button>

                <div className="body">
                  <span className={`title ${t.completed ? 'done' : ''} ${late ? 'late' : ''}`}>{t.title}</span>
                  {t.due_date && (
                    <span className="due">
                      {fmtDate(t.due_date)}
                      {late && <em className="badge">Em atraso</em>}
                    </span>
                  )}
                </div>

                <div className="row-actions">
                  <button onClick={() => setModal(t)} aria-label="Editar tarefa"><Icon d={icons.edit} size={16} /></button>
                  <button onClick={() => remove(t)} aria-label="Excluir tarefa" className="danger"><Icon d={icons.trash} size={16} /></button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <button className="fab" onClick={() => setModal('new')} aria-label="Criar tarefa">
        <Icon d={icons.plus} size={26} />
      </button>

      {modal && (
        <TaskModal task={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSave={save} />
      )}
    </main>
  );
}
