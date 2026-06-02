import { useCallback, useEffect, useRef, useState } from 'react'
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

function App() {
  const useCloud = isSupabaseConfigured
  const [tasks, setTasks] = useState(() => (useCloud ? [] : loadLocalTasks()))
  const [newTask, setNewTask] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [activeSwipeTaskId, setActiveSwipeTaskId] = useState(null)
  const [swipeTranslate, setSwipeTranslate] = useState(0)
  const [error, setError] = useState(null)

  const swipeStartX = useRef(0)
  const swipeDragged = useRef(false)
  const swipeTaskId = useRef(null)

  const fetchTasks = useCallback(async () => {
    if (!supabase) return

    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('*')
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
    if (!useCloud) saveLocalTasks(tasks)
  }, [tasks, useCloud])

  useEffect(() => {
    if (!supabase) return undefined

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

  async function addTask(e) {
    e.preventDefault()

    const text = newTask.trim()
    if (!text) return

    if (!useCloud) {
      setTasks((prev) => [
        {
          id: newLocalTaskId(),
          text,
          completed: false,
          createdAt: new Date().toISOString(),
          dueDate: null,
        },
        ...prev,
      ])
      setNewTask('')
      return
    }

    const { error: dbError } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
    })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    setNewTask('')
    fetchTasks()
  }

  async function toggleTask(task) {
    if (!useCloud) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, completed: !item.completed } : item,
        ),
      )
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
      .eq('id', task.id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    fetchTasks()
  }

  function openEditModal(task) {
    setModalTask(task)
    setEditingText(task.text)
  }

  function cancelEdit() {
    setModalTask(null)
    setEditingText('')
  }

  function handlePointerDown(task, event) {
    swipeStartX.current = event.clientX
    swipeDragged.current = false
    swipeTaskId.current = task.id
    setActiveSwipeTaskId(task.id)
    setSwipeTranslate(0)
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(task, event) {
    if (swipeTaskId.current !== task.id) return

    const deltaX = event.clientX - swipeStartX.current
    const nextTranslate = Math.max(Math.min(deltaX, 0), -88)

    if (Math.abs(deltaX) > 8) {
      swipeDragged.current = true
    }

    setSwipeTranslate(nextTranslate)
  }

  function handlePointerEnd(task) {
    if (swipeTaskId.current !== task.id) return

    if (swipeTranslate <= -48) {
      setActiveSwipeTaskId(task.id)
      setSwipeTranslate(-76)
    } else {
      setActiveSwipeTaskId(null)
      setSwipeTranslate(0)
    }

    swipeTaskId.current = null
  }

  function handleRowClick(task) {
    if (swipeDragged.current) {
      swipeDragged.current = false
      return
    }

    openEditModal(task)
  }

  async function saveEdit(id) {
    const text = editingText.trim()
    if (!text) return

    if (!useCloud) {
      setTasks((prev) =>
        prev.map((task) => (task.id === id ? { ...task, text } : task)),
      )
      cancelEdit()
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({ text })
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    cancelEdit()
    fetchTasks()
  }

  async function deleteTask(id) {
    setActiveSwipeTaskId(null)
    setSwipeTranslate(0)

    if (!useCloud) {
      setTasks((prev) => prev.filter((task) => task.id !== id))
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

  return (
    <div className="app">
      <main className="container">
        <header className="header">
          <h1>A & L Planning</h1>
          <p>Simple shared to-do list</p>
        </header>

        {error && <div className="error">{error}</div>}

        <form className="add-form" onSubmit={addTask}>
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a new task"
          />
          <button type="submit">Add</button>
        </form>

        <div className="table-card">
          <div className="task-table">
            <div className="task-table__header">
              <div>Status</div>
              <div>Task</div>
              <div>Created</div>
            </div>

            {tasks.length === 0 ? (
              <div className="empty">No tasks yet.</div>
            ) : (
              tasks.map((task) => {
                const isActive = activeSwipeTaskId === task.id
                const translate = isActive ? swipeTranslate : 0

                return (
                  <div className="swipe-row" key={task.id}>
                    <button
                      type="button"
                      className="delete-action"
                      onClick={() => deleteTask(task.id)}
                      aria-label={`Delete ${task.text}`}
                    >
                      ×
                    </button>

                    <div
                      className="task-row"
                      onPointerDown={(e) => handlePointerDown(task, e)}
                      onPointerMove={(e) => handlePointerMove(task, e)}
                      onPointerUp={() => handlePointerEnd(task)}
                      onPointerCancel={() => handlePointerEnd(task)}
                      onClick={() => handleRowClick(task)}
                      style={{ transform: `translateX(${translate}px)` }}
                    >
                      <div>
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task)}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>

                      <div>
                        <span className={task.completed ? 'done' : ''}>
                          {task.text}
                        </span>
                      </div>

                      <div>
                        {new Date(task.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {modalTask && (
          <div className="modal-backdrop" onClick={cancelEdit}>
            <div className="modal" onClick={(e) => e.stopPropagation()}>
              <h2>Edit task</h2>

              <input
                className="edit-input"
                value={editingText}
                onChange={(e) => setEditingText(e.target.value)}
              />

              <div className="modal-actions">
                <button onClick={() => saveEdit(modalTask.id)}>Save</button>
                <button className="secondary" onClick={cancelEdit}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

export default App