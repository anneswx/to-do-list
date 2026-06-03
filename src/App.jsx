// ============================================================
// 1. Imports
// ============================================================
import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles/app.css'
import './styles/tasks.css'
import './styles/modal.css'
import './styles/calendar.css'

import AddTaskForm from './components/AddTaskForm'
import TaskTable from './components/TaskTable'
import EditTaskModal from './components/EditTaskModal'
import DatePickerSheet from './components/DatePickerSheet'

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
// 2. Sort Tasks
// ============================================================
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }

    if (a.dueDate && b.dueDate) {
      return b.dueDate.localeCompare(a.dueDate)
    }

    if (a.dueDate && !b.dueDate) return -1
    if (!a.dueDate && b.dueDate) return 1

    return new Date(b.createdAt) - new Date(a.createdAt)
  })
}

// ============================================================
// 3. Main App Component
// ============================================================
function App() {
  const useCloud = isSupabaseConfigured

  // ============================================================
  // 4. State
  // ============================================================
  const [tasks, setTasks] = useState(() => (useCloud ? [] : loadLocalTasks()))
  const [newTask, setNewTask] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [modalTask, setModalTask] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [datePickerMode, setDatePickerMode] = useState(null)
  const [error, setError] = useState(null)

  const sortedTasks = useMemo(() => sortTasks(tasks), [tasks])

  // ============================================================
  // 5. Fetch Tasks from Supabase
  // ============================================================
  const fetchTasks = useCallback(async () => {
    if (!supabase) return

    const { data, error: dbError } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', LIST_ID)
      .order('pinned', { ascending: false })
      .order('due_date', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    setTasks((data ?? []).map(rowToTask))
    setError(null)
  }, [])

  // ============================================================
  // 6. Save Local Tasks When Supabase Is Not Configured
  // ============================================================
  useEffect(() => {
    if (!useCloud) {
      saveLocalTasks(tasks)
    }
  }, [tasks, useCloud])

  // ============================================================
  // 7. Initial Load + Supabase Realtime Sync
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
  // 8. Add Task
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
          dueDate: newTaskDueDate || null,
          pinned: false,
        },
        ...prev,
      ])

      setNewTask('')
      setNewTaskDueDate('')
      return
    }

    const { error: dbError } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
      due_date: newTaskDueDate || null,
      pinned: false,
    })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    setNewTask('')
    setNewTaskDueDate('')
    fetchTasks()
  }

  // ============================================================
  // 9. Toggle Task Complete / Incomplete
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
  // 10. Toggle Pin / Unpin
  // ============================================================
  async function togglePin(task) {
    if (!useCloud) {
      setTasks((prev) =>
        prev.map((item) =>
          item.id === task.id ? { ...item, pinned: !item.pinned } : item,
        ),
      )
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({ pinned: !task.pinned })
      .eq('id', task.id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    fetchTasks()
  }

  // ============================================================
  // 11. Open / Close Edit Modal
  // ============================================================
  function openEditModal(task) {
    setModalTask(task)
    setEditingText(task.text)
    setEditingDueDate(task.dueDate || '')
  }

  function cancelEdit() {
    setModalTask(null)
    setEditingText('')
    setEditingDueDate('')
  }

  // ============================================================
  // 12. Save Edited Task
  // ============================================================
  async function saveEdit(id) {
    const text = editingText.trim()
    if (!text) return

    if (!useCloud) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === id
            ? { ...task, text, dueDate: editingDueDate || null }
            : task,
        ),
      )
      cancelEdit()
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({
        text,
        due_date: editingDueDate || null,
      })
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    cancelEdit()
    fetchTasks()
  }

  /// ============================================================
  // 13. Delete Task
  // ============================================================
  async function deleteTask(id) {
    // Optimistic UI update: remove from screen immediately
    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== id))
    cancelEdit()

    if (!useCloud) {
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      // Restore the task if delete fails
      setTasks(previousTasks)
      setError(formatDbError(dbError))
      return
    }

    fetchTasks()
  }

  // ============================================================
  // 14. Date Picker Handlers
  // ============================================================
  function openNewTaskDatePicker() {
    setDatePickerMode('new-task')
  }

  function openEditDatePicker() {
    setDatePickerMode('edit-task')
  }

  function closeDatePicker() {
    setDatePickerMode(null)
  }

  function updateDatePickerValue(value) {
    if (datePickerMode === 'new-task') {
      setNewTaskDueDate(value)
    }

    if (datePickerMode === 'edit-task') {
      setEditingDueDate(value)
    }
  }

  function clearDatePickerValue() {
    if (datePickerMode === 'new-task') {
      setNewTaskDueDate('')
    }

    if (datePickerMode === 'edit-task') {
      setEditingDueDate('')
    }

    closeDatePicker()
  }

  // ============================================================
  // 15. Render
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
          dueDate={newTaskDueDate}
          onOpenDatePicker={openNewTaskDatePicker}
          onAddTask={addTask}
        />

        <TaskTable
          tasks={sortedTasks}
          onToggleTask={toggleTask}
          onTogglePin={togglePin}
          onDeleteTask={deleteTask}
          onOpenEditModal={openEditModal}
        />

        {modalTask && (
          <EditTaskModal
            editingText={editingText}
            setEditingText={setEditingText}
            editingDueDate={editingDueDate}
            onOpenDatePicker={openEditDatePicker}
            onSave={() => saveEdit(modalTask.id)}
            onCancel={cancelEdit}
            onDelete={() => deleteTask(modalTask.id)}
          />
        )}

        {datePickerMode && (
          <DatePickerSheet
            title={
              datePickerMode === 'new-task'
                ? 'Choose due date'
                : 'Edit due date'
            }
            value={
              datePickerMode === 'new-task' ? newTaskDueDate : editingDueDate
            }
            onChange={updateDatePickerValue}
            onClose={closeDatePicker}
            onClear={clearDatePickerValue}
          />
        )}
      </main>
    </div>
  )
}

// ============================================================
// 16. Export
// ============================================================
export default App