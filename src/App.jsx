import { useEffect, useRef, useState } from 'react'
import './App.css'

const STORAGE_KEY = 'ticktick-todos'

function newTaskId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

function loadTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
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

function TaskRow({ task, onToggle, onRemove }) {
  return (
    <li className={`task${task.completed ? ' task--done' : ''}`}>
      <label className="task__check">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
        />
        <span className="task__box" aria-hidden="true" />
      </label>
      <span className="task__text">{task.text}</span>
      <button
        type="button"
        className="task__remove"
        aria-label={`Delete ${task.text}`}
        onClick={() => onRemove(task.id)}
      >
        ×
      </button>
    </li>
  )
}

function App() {
  const [tasks, setTasks] = useState(loadTasks)
  const [draft, setDraft] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const inputRef = useRef(null)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch {
      /* private browsing or storage full */
    }
  }, [tasks])

  const todayTasks = tasks.filter((t) => isToday(t.createdAt))
  const pending = todayTasks.filter((t) => !t.completed)
  const done = todayTasks.filter((t) => t.completed)
  const now = new Date()

  function addTask(e) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setTasks((prev) => [
      {
        id: newTaskId(),
        text,
        completed: false,
        createdAt: new Date().toISOString(),
      },
      ...prev,
    ])
    setDraft('')
    inputRef.current?.blur()
  }

  function toggleTask(id) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    )
  }

  function removeTask(id) {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  function openComposer() {
    setActiveTab('today')
    requestAnimationFrame(() => {
      inputRef.current?.focus()
      inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

  return (
    <div className="app">
      <header className="header">
        <p className="header__greeting">Good {getGreeting(now)}</p>
        <h1 className="header__title">Today</h1>
        <p className="header__date">{formatHeaderDate(now)}</p>
      </header>

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
                aria-label="New task"
              />
              <button
                type="submit"
                className={`composer__submit${draft.trim() ? '' : ' composer__submit--inactive'}`}
                aria-disabled={!draft.trim()}
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

              {todayTasks.length === 0 ? (
                <div className="empty">
                  <span className="empty__emoji" aria-hidden="true">
                    ☀️
                  </span>
                  <p className="empty__title">Nothing planned yet</p>
                  <p className="empty__hint">
                    Tap + or type above to add your first task
                  </p>
                </div>
              ) : (
                <ul className="task-list">
                  {pending.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
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
