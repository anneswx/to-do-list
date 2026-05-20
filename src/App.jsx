import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import {
  formatDbError,
  isSupabaseConfigured,
  LIST_ID,
  supabase,
} from './lib/supabase'
import {
  loadLocalTasks,
  newLocalTaskId,
  rowToTask,
  saveLocalTasks,
} from './lib/tasks'

function formatHeaderDate(date) {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })
}

function formatDateLabel(dateString) {
  if (!dateString) return 'No date'

  const d = new Date(dateString + 'T00:00:00')
  const today = new Date()

  const same =
    d.getFullYear() === today.getFullYear() &&
    d.getMonth() === today.getMonth() &&
    d.getDate() === today.getDate()

  if (same) return 'Today'

  return d.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function isOverdue(dateString) {
  if (!dateString) return false

  const due = new Date(dateString + 'T00:00:00')
  const today = new Date()

  due.setHours(0, 0, 0, 0)
  today.setHours(0, 0, 0, 0)

  return due < today
}

const NAV_ITEMS = [
  { id: 'today', label: 'Today' },
  { id: 'calendar', label: 'Calendar' },
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
        <span className="task__box" />
      </label>

      <div className="task__content">
        <span className="task__text">{task.text}</span>

        {task.dueDate && (
          <span
            className={`task__date ${
              isOverdue(task.dueDate) && !task.completed
                ? 'task__date--overdue'
                : ''
            }`}
          >
            {formatDateLabel(task.dueDate)}
          </span>
        )}
      </div>

      <button className="task__remove" onClick={() => onRemove(task.id)}>
        ×
      </button>
    </li>
  )
}

function App() {
  const useCloud = isSupabaseConfigured

  const [tasks, setTasks] = useState(() =>
    useCloud ? [] : loadLocalTasks(),
  )

  const [draft, setDraft] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [activeTab, setActiveTab] = useState('today')

  const inputRef = useRef(null)

  const fetchTasks = useCallback(async () => {
    if (!supabase) return

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', LIST_ID)
      .order('due_date', { ascending: true })

    if (error) {
      console.error(error)
      return
    }

    setTasks((data ?? []).map(rowToTask))
  }, [])

  useEffect(() => {
    if (!useCloud) {
      saveLocalTasks(tasks)
    }
  }, [tasks, useCloud])

  useEffect(() => {
    if (!supabase) return

    fetchTasks()

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
        () => fetchTasks(),
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  const groupedTasks = useMemo(() => {
    const groups = {}

    tasks.forEach((task) => {
      const key = task.dueDate || 'No date'

      if (!groups[key]) groups[key] = []

      groups[key].push(task)
    })

    return groups
  }, [tasks])

  async function addTask(e) {
    e.preventDefault()

    const text = draft.trim()

    if (!text) return

    if (!useCloud) {
      setTasks((prev) => [
        {
          id: newLocalTaskId(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate,
        },
        ...prev,
      ])

      setDraft('')
      setDueDate('')
      return
    }

    const { error } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
      due_date: dueDate || null,
    })

    if (error) {
      console.error(formatDbError(error))
      return
    }

    setDraft('')
    setDueDate('')
    fetchTasks()
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)

    if (!task) return

    await supabase
      .from('tasks')
      .update({
        completed: !task.completed,
      })
      .eq('id', id)

    fetchTasks()
  }

  async function removeTask(id) {
    await supabase.from('tasks').delete().eq('id', id)

    fetchTasks()
  }

  return (
    <div className="app">
      <header className="header">
        <p className="header__title">Sun Couple</p>
        <p className="header__date">
          {formatHeaderDate(new Date())}
        </p>
      </header>

      <main className="main">
        <form className="composer" onSubmit={addTask}>
          <input
            ref={inputRef}
            type="text"
            className="composer__input"
            placeholder="Add task..."
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />

          <input
            type="date"
            className="composer__date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />

          <button className="composer__submit">
            Add
          </button>
        </form>

        {activeTab === 'today' && (
          <ul className="task-list">
            {tasks.map((task) => (
              <TaskRow
                key={task.id}
                task={task}
                onToggle={toggleTask}
                onRemove={removeTask}
              />
            ))}
          </ul>
        )}

        {activeTab === 'calendar' && (
          <div className="calendar-view">
            {Object.entries(groupedTasks).map(([date, items]) => (
              <section key={date} className="calendar-group">
                <h3 className="calendar-group__title">
                  {formatDateLabel(date)}
                </h3>

                <ul className="task-list">
                  {items.map((task) => (
                    <TaskRow
                      key={task.id}
                      task={task}
                      onToggle={toggleTask}
                      onRemove={removeTask}
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </main>

      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`bottom-nav__item ${
              activeTab === item.id
                ? 'bottom-nav__item--active'
                : ''
            }`}
            onClick={() => setActiveTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </div>
  )
}

export default App