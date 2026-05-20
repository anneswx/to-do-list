import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import './App.css'
import { formatDbError, isSupabaseConfigured, LIST_ID, supabase } from './lib/supabase'
import { loadLocalTasks, newLocalTaskId, rowToTask, saveLocalTasks } from './lib/tasks'

function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function formatDateLabel(dateString) {
  if (!dateString) return 'No date'

  const date = new Date(dateString + 'T00:00:00')
  const today = new Date()
  const todayKey = toDateKey(today)

  if (dateString === todayKey) return 'Today'

  return date.toLocaleDateString(undefined, {
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

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()

  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)

  const days = []

  for (let i = 0; i < firstDay.getDay(); i++) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day++) {
    days.push(new Date(year, month, day))
  }

  return days
}

function TaskRow({ task, onToggle, onRemove }) {
  return (
    <li className={`task${task.completed ? ' task--done' : ''}`}>
      <label className="task__check">
        <input type="checkbox" checked={task.completed} onChange={() => onToggle(task.id)} />
        <span className="task__box" />
      </label>

      <span className="task__text">{task.text}</span>

      <span
        className={`task__date ${
          isOverdue(task.dueDate) && !task.completed ? 'task__date--overdue' : ''
        }`}
      >
        {formatDateLabel(task.dueDate)}
      </span>

      <button className="task__remove" onClick={() => onRemove(task.id)}>
        ×
      </button>
    </li>
  )
}

function App() {
  const useCloud = isSupabaseConfigured
  const [tasks, setTasks] = useState(() => (useCloud ? [] : loadLocalTasks()))
  const [draft, setDraft] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [activeTab, setActiveTab] = useState('today')
  const [calendarMonth, setCalendarMonth] = useState(new Date())
  const [error, setError] = useState(null)
  const inputRef = useRef(null)

  const fetchTasks = useCallback(async () => {
    if (!supabase) return

    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', LIST_ID)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    setTasks((data ?? []).map(rowToTask))
    setError(null)
  }, [])

  useEffect(() => {
    if (!useCloud) saveLocalTasks(tasks)
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
        fetchTasks,
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchTasks])

  const todayKey = toDateKey(new Date())

  const todayTasks = tasks.filter((task) => {
    return task.dueDate === todayKey || (!task.dueDate && toDateKey(new Date(task.createdAt)) === todayKey)
  })

  const calendarDays = useMemo(() => getMonthDays(calendarMonth), [calendarMonth])

  const tasksByDate = useMemo(() => {
    const map = {}

    tasks.forEach((task) => {
      if (!task.dueDate) return
      if (!map[task.dueDate]) map[task.dueDate] = []
      map[task.dueDate].push(task)
    })

    return map
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
          dueDate: dueDate || null,
        },
        ...prev,
      ])
      setDraft('')
      setDueDate('')
      return
    }

    const { error: dbError } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
      due_date: dueDate || null,
    })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    setDraft('')
    setDueDate('')
    fetchTasks()
  }

  async function toggleTask(id) {
    const task = tasks.find((t) => t.id === id)
    if (!task) return

    if (!useCloud) {
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      )
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    fetchTasks()
  }

  async function removeTask(id) {
    if (!useCloud) {
      setTasks((prev) => prev.filter((t) => t.id !== id))
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    fetchTasks()
  }

  function changeMonth(offset) {
    setCalendarMonth((prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1))
  }

  return (
    <div className="app">
      <header className="header">
        <p className="header__greeting">Shared planner</p>
        <h1 className="header__title">A & L Planning</h1>
        <p className="header__date">
          {new Date().toLocaleDateString(undefined, {
            weekday: 'long',
            month: 'long',
            day: 'numeric',
          })}
        </p>
      </header>

      {error && (
        <p className="status-banner status-banner--error" role="alert">
          {error}
        </p>
      )}

      <main className="main">
        <form className="composer composer--stacked" onSubmit={addTask}>
          <div className="composer__top">
            <span className="composer__dot" />
            <input
              ref={inputRef}
              type="text"
              className="composer__input"
              placeholder="Add a task..."
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button className="composer__submit" type="submit">
              Add
            </button>
          </div>

          <label className="due-picker">
            <span>Due date</span>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </form>

        {activeTab === 'today' && (
          <section className="section">
            <div className="section__head">
              <h2 className="section__title">Today</h2>
              <span className="section__count">{todayTasks.length} tasks</span>
            </div>

            {todayTasks.length === 0 ? (
              <div className="empty">
                <span className="empty__emoji">☀️</span>
                <p className="empty__title">Nothing due today</p>
                <p className="empty__hint">Add a task and choose a due date.</p>
              </div>
            ) : (
              <ul className="task-list">
                {todayTasks.map((task) => (
                  <TaskRow key={task.id} task={task} onToggle={toggleTask} onRemove={removeTask} />
                ))}
              </ul>
            )}
          </section>
        )}

        {activeTab === 'calendar' && (
          <section className="calendar-view">
            <div className="calendar-header">
              <button type="button" onClick={() => changeMonth(-1)}>
                ‹
              </button>

              <h2>
                {calendarMonth.toLocaleDateString(undefined, {
                  month: 'long',
                  year: 'numeric',
                })}
              </h2>

              <button type="button" onClick={() => changeMonth(1)}>
                ›
              </button>
            </div>

            <div className="calendar-weekdays">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>

            <div className="month-grid">
              {calendarDays.map((day, index) => {
                if (!day) return <div key={`empty-${index}`} className="month-day month-day--empty" />

                const key = toDateKey(day)
                const dayTasks = tasksByDate[key] ?? []
                const isCurrentDay = key === todayKey

                return (
                  <div key={key} className={`month-day${isCurrentDay ? ' month-day--today' : ''}`}>
                    <div className="month-day__number">{day.getDate()}</div>

                    <div className="month-day__tasks">
                      {dayTasks.slice(0, 3).map((task) => (
                        <div key={task.id} className={`month-task${task.completed ? ' month-task--done' : ''}`}>
                          {task.text}
                        </div>
                      ))}

                      {dayTasks.length > 3 && (
                        <div className="month-task month-task--more">
                          +{dayTasks.length - 3} more
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )}
      </main>

      <nav className="bottom-nav">
        <button
          className={`bottom-nav__item${activeTab === 'today' ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('today')}
        >
          <span>Today</span>
        </button>

        <button
          className={`bottom-nav__item${activeTab === 'calendar' ? ' bottom-nav__item--active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <span>Calendar</span>
        </button>
      </nav>
    </div>
  )
}

export default App