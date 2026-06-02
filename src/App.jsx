// ============================================================
// 1. Imports
// ============================================================
import { useCallback, useEffect, useState } from 'react'
import './styles/app.css'
import './styles/tasks.css'
import './styles/modal.css'

import AddTaskForm from './components/AddTaskForm'
import TaskTable from './components/TaskTable'
import EditTaskModal from './components/EditTaskModal'

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

// ============================================================
// 2. Main App Component
// ============================================================
function App() {
  const useCloud = isSupabaseConfigured

  // ============================================================
  // 3. State
  // ============================================================
  const [tasks, setTasks] = useState(() => (useCloud ? [] : loadLocalTasks()))
  const [newTask, setNewTask] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [error, setError] = useState(null)

  // ============================================================
  // 4. Fetch Tasks from Supabase
  // ============================================================
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

  // ============================================================
  // 5. Save Local Tasks When Supabase Is Not Configured
  // ============================================================
  useEffect(() => {
    if (!useCloud) {
      saveLocalTasks(tasks)
    }
  }, [tasks, useCloud])

  // ============================================================
  // 6. Initial Load + Supabase Realtime Sync
  // ============================================================
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

  // ============================================================
  // 7. Add Task
  // ============================================================
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

  // ============================================================
  // 8. Toggle Task Complete / Incomplete
  // ============================================================
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

  // ============================================================
  // 9. Open / Close Edit Modal
  // ============================================================
  function openEditModal(task) {
    setModalTask(task)
    setEditingText(task.text)
  }

  function cancelEdit() {
    setModalTask(null)
    setEditingText('')
  }

  // ============================================================
  // 10. Save Edited Task
  // ============================================================
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

  // ============================================================
  // 11. Delete Task
  // ============================================================
  async function deleteTask(id) {
    if (!useCloud) {
      setTasks((prev) => prev.filter((task) => task.id !== id))
      cancelEdit()
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

    cancelEdit()
    fetchTasks()
  }

  // ============================================================
  // 12. Render
  // ============================================================
  return (
    <div className="app">
      <main className="container">
        <header className="header">
          <h1>A & L Planning</h1>
          <p>Simple shared to-do list</p>
        </header>

        {error && <div className="error">{error}</div>}

        <AddTaskForm
          newTask={newTask}
          setNewTask={setNewTask}
          onAddTask={addTask}
        />

        <TaskTable
          tasks={tasks}
          onToggleTask={toggleTask}
          onDeleteTask={deleteTask}
          onOpenEditModal={openEditModal}
        />

        {modalTask && (
          <EditTaskModal
            editingText={editingText}
            setEditingText={setEditingText}
            onSave={() => saveEdit(modalTask.id)}
            onCancel={cancelEdit}
            onDelete={() => deleteTask(modalTask.id)}
          />
        )}
      </main>
    </div>
  )
}

// ============================================================
// 13. Export
// ============================================================
export default App