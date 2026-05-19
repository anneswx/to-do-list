import { useCallback, useEffect, useRef, useState } from 'react'
import './App.css'
import {
  formatDbError,
  isSupabaseConfigured,
  LIST_ID,
  supabase,
} from './lib/supabase'

function rowToTask(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
  }
}

function isToday(iso) {
  const d = new Date(iso)
  const now = new Date()
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  )
}

function formatHeaderDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function getGreeting(date) {
  const h = date.getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function IconToday() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
      <circle cx="12" cy="15" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

function IconCalendar() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

function IconInbox() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 4h16v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z" />
      <path d="M4 10h16l-2 4H6l-2-4z" />
    </svg>
  )
}

function IconSettings() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  )
}

function IconPlus() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M12 5v14M5 12h14" />
    </svg>
  )
}

const NAV_ITEMS = [
  { id: 'today', label: 'Today', Icon: IconToday },
  { id: 'calendar', label: 'Calendar', Icon: IconCalendar },
  { id: 'inbox', label: 'Inbox', Icon: IconInbox },
  { id: 'settings', label: 'More', Icon: IconSettings },
]

function TaskRow({ task, onToggle, onRemove, busy }) {
  return (
    <li className={`task${task.completed ? ' task--done' : ''}`}>
      <label className="task__check">
        <input
          type="checkbox"
          checked={task.completed}
          disabled={busy}
          onChange={() => onToggle(task.id)}
        />
        <span className="task__box" aria-hidden="true" />
      </label>
      <span className="task__text">{task.text}</span>
      <button
        type="button"
        className="task__remove"
        disabled={busy}
        aria-label={`Delete ${task.text}`}
        onClick={() => onRemove(task.id)}
      >
        ×
      </button>
    </li>
  )
}

function App() {
  const [tasks, setTasks] = useState([])
  const [draft, setDraft] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const [loading, setLoading] = useState(isSupabaseConfigured)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(
    isSupabaseConfigured
      ? null
      : 'Cloud sync is off — add Supabase keys to connect a shared list.',
  )
  const inputRef = useRef(null)

  const fetchTasks = useCallback(async () => {
    if (!supabase) return
    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('id, text, completed, created_at')
      .eq('list_id', LIST_ID)
      .order('created_at', { ascending: false })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }
    setTasks((data ?? []).map(rowToTask))
    setError(null)
  }, [])

  useEffect(() => {
    if (!supabase) return undefined

    let cancelled = false

    async function init() {
      setLoading(true)
      await fetchTasks()
      if (!cancelled) setLoading(false)
    }

    init()

    const channel = supabase
      .channel(`tasks-${LIST_ID}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `list_id=eq.${LIST_ID}`,
        },
        () => {
          fetchTasks()
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  const todayTasks = tasks.filter((t) => isToday(t.createdAt))
  const pending = todayTasks.filter((t) => !t.completed)
  const done = todayTasks.filter((t) => t.completed)
  const now = new Date()

  async function addTask(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text || !supabase) return

    setBusy(true)
    const { error: dbError } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
    })
    setBusy(false)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }
    setDraft('')
    inputRef.current?.blur()
    await fetchTasks()
  }

  async function toggleTask(id) {
    if (!supabase) return
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    setBusy(true)
    const { error: dbError } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', id)
      .eq('list_id', LIST_ID)
    setBusy(false)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }
    await fetchTasks()
  }

  async function removeTask(id) {
    if (!supabase) return

    setBusy(true)
    const { error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('list_id', LIST_ID)
    setBusy(false)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }
    await fetchTasks()
  }

  function openComposer() {
    setActiveTab('today')
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  const syncReady = isSupabaseConfigured && !error?.includes('Cloud sync is off')

  return (
    <div className="app">
      <header className="header">
        <p className="header__greeting">Good {getGreeting(now)}</p>
        <h1 className="header__title">Today</h1>
        <p className="header__date">{formatHeaderDate(now)}</p>
        {syncReady && (
          <p className="header__shared">Shared list — you both see the same tasks</p>
        )}
      </header>

      {error && (
        <p className="status-banner status-banner--error" role="alert">
          {error}
        </p>
      )}

      <main className="main">
        {activeTab === 'today' ? (
          <>
            <form className="composer" onSubmit={addTask}>
              <span className="composer__dot" aria-hidden="true" />
              <input
                ref={inputRef}
                type="text"
                className="composer__input"
                placeholder="Add a task for today…"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                enterKeyHint="done"
                autoComplete="off"
                disabled={!isSupabaseConfigured || busy}
                aria-label="New task"
              />
              <button
                type="submit"
                className={`composer__submit${draft.trim() ? '' : ' composer__submit--inactive'}`}
                aria-disabled={!draft.trim() || !isSupabaseConfigured || busy}
              >
                Add
              </button>
            </form>

            <section className="section" aria-labelledby="today-heading">
              <div className="section__head">
                <h2 id="today-heading" className="section__title">
                  Today&apos;s tasks
                </h2>
                <span className="section__count">{pending.length} left</span>
              </div>

              {loading ? (
                <p className="empty empty--loading">Loading shared tasks…</p>
              ) : todayTasks.length === 0 ? (
                <div className="empty">
                  <span className="empty__emoji" aria-hidden="true">
                    ☀️
                  </span>
                  <p className="empty__title">Nothing planned yet</p>
                  <p className="empty__hint">
                    Tap + or type above — your partner will see it too
                  </p>
                </div>
              ) : (
                <ul className="task-list">
                  {pending.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      busy={busy}
                      onToggle={toggleTask}
                      onRemove={removeTask}
                    />
                  ))}
                  {done.length > 0 && (
                    <>
                      <li className="task-list__divider">
                        <span>Completed</span>
                      </li>
                      {done.map((task) => (
                        <TaskRow
                          key={task.id}
                          task={task}
                          busy={busy}
                          onToggle={toggleTask}
                          onRemove={removeTask}
                        />
                      ))}
                    </>
                  )}
                </ul>
              )}
            </section>
          </>
        ) : (
          <div className="placeholder">
            <span className="placeholder__icon" aria-hidden="true">
              {activeTab === 'calendar' && '📅'}
              {activeTab === 'inbox' && '📥'}
              {activeTab === 'settings' && '✨'}
            </span>
            <p className="placeholder__title">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </p>
            <p className="placeholder__text">
              Coming soon — focus on Today for now.
            </p>
          </div>
        )}
      </main>

      <button
        type="button"
        className="fab"
        aria-label="Add task"
        disabled={!isSupabaseConfigured || busy}
        onClick={openComposer}
      >
        <IconPlus />
      </button>

      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_ITEMS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`bottom-nav__item${activeTab === id ? ' bottom-nav__item--active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-current={activeTab === id ? 'page' : undefined}
          >
            <Icon />
            <span>{label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App
