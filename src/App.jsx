// ============================================================
// 1. Imports
// ============================================================
import { useCallback, useEffect, useMemo, useState } from 'react'
import './styles/app.css'
import './styles/tasks.css'
import './styles/modal.css'
import './styles/calendar.css'
import './styles/sheets.css'
import './styles/calendar-page.css'

import AddTaskForm from './components/AddTaskForm'
import TaskTable from './components/TaskTable'
import EditTaskModal from './components/EditTaskModal'
import DatePickerSheet from './components/DatePickerSheet'
import CalendarIcon from './components/icons/CalendarIcon'
import CalendarPage from './pages/CalendarPage'

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
// pinned first, then nearer dates first, then newest created
// ============================================================
function sortTasks(tasks) {
  return [...tasks].sort((a, b) => {
    if (a.pinned !== b.pinned) {
      return a.pinned ? -1 : 1
    }

    if (a.dueDate && b.dueDate) {
      return a.dueDate.localeCompare(b.dueDate)
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

  const [activePage, setActivePage] = useState('tasks')

  const [newTask, setNewTask] = useState('')
  const [newTaskDueDate, setNewTaskDueDate] = useState('')
  const [newTaskPinned, setNewTaskPinned] = useState(false)
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false)

  const [modalTask, setModalTask] = useState(null)
  const [editingText, setEditingText] = useState('')
  const [editingDueDate, setEditingDueDate] = useState('')
  const [editingPinned, setEditingPinned] = useState(false)

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
      .order('due_date', { ascending: true, nullsFirst: false })
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
          pinned: newTaskPinned,
        },
        ...prev,
      ])

      resetAddForm()
      return
    }

    const { error: dbError } = await supabase.from('tasks').insert({
      list_id: LIST_ID,
      text,
      completed: false,
      due_date: newTaskDueDate || null,
      pinned: newTaskPinned,
    })

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    resetAddForm()
    fetchTasks()
  }

  function resetAddForm() {
    setNewTask('')
    setNewTaskDueDate('')
    setNewTaskPinned(false)
    setIsAddSheetOpen(false)
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
    setEditingPinned(Boolean(task.pinned))
  }

  function closeEditModal() {
    setModalTask(null)
    setEditingText('')
    setEditingDueDate('')
    setEditingPinned(false)
  }

  // ============================================================
  // 12. Save Edited Task
  // ============================================================
  async function saveEditAndClose() {
    if (!modalTask) return

    const text = editingText.trim()
    if (!text) {
      closeEditModal()
      return
    }

    if (!useCloud) {
      setTasks((prev) =>
        prev.map((task) =>
          task.id === modalTask.id
            ? {
              ...task,
              text,
              dueDate: editingDueDate || null,
              pinned: editingPinned,
            }
            : task,
        ),
      )
      closeEditModal()
      return
    }

    const { error: dbError } = await supabase
      .from('tasks')
      .update({
        text,
        due_date: editingDueDate || null,
        pinned: editingPinned,
      })
      .eq('id', modalTask.id)
      .eq('list_id', LIST_ID)

    if (dbError) {
      setError(formatDbError(dbError))
      return
    }

    closeEditModal()
    fetchTasks()
  }

  // ============================================================
  // 13. Delete Task
  // ============================================================
  async function deleteTask(id) {
    const previousTasks = tasks
    setTasks((prev) => prev.filter((task) => task.id !== id))
    closeEditModal()

    if (!useCloud) return

    const { error: dbError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('list_id', LIST_ID)

    if (dbError) {
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
  <div className={`app ${activePage === 'calendar' ? 'app--calendar' : ''}`}>
    <main className="container">
      {activePage !== 'calendar' && (
        <header className="header">
          <h1>A & L Planning</h1>
        </header>
      )}

        {error && <div className="error">{error}</div>}

        {activePage === 'tasks' && (
          <>
            <TaskTable
              tasks={sortedTasks}
              onToggleTask={toggleTask}
              onTogglePin={togglePin}
              onDeleteTask={deleteTask}
              onOpenEditModal={openEditModal}
            />

            <AddTaskForm
              isOpen={isAddSheetOpen}
              newTask={newTask}
              setNewTask={setNewTask}
              dueDate={newTaskDueDate}
              pinned={newTaskPinned}
              onTogglePinned={() => setNewTaskPinned((prev) => !prev)}
              onOpen={() => setIsAddSheetOpen(true)}
              onClose={() => setIsAddSheetOpen(false)}
              onOpenDatePicker={openNewTaskDatePicker}
              onAddTask={addTask}
            />
          </>
        )}

        {activePage === 'calendar' && <CalendarPage tasks={sortedTasks} />}

        {modalTask && (
          <EditTaskModal
            editingText={editingText}
            setEditingText={setEditingText}
            editingDueDate={editingDueDate}
            editingPinned={editingPinned}
            onOpenDatePicker={openEditDatePicker}
            onTogglePinned={() => setEditingPinned((prev) => !prev)}
            onSaveAndClose={saveEditAndClose}
            onDelete={() => deleteTask(modalTask.id)}
          />
        )}

        {datePickerMode && (
          <DatePickerSheet
            title={datePickerMode === 'new-task' ? 'Choose Date' : 'Edit Date'}
            value={
              datePickerMode === 'new-task' ? newTaskDueDate : editingDueDate
            }
            onChange={updateDatePickerValue}
            onClose={closeDatePicker}
            onClear={clearDatePickerValue}
          />
        )}

        <nav className="bottom-tab-bar">
          <button
            type="button"
            className={`bottom-tab-bar__item${activePage === 'tasks' ? ' bottom-tab-bar__item--active' : ''
              }`}
            onClick={() => setActivePage('tasks')}
            aria-label="To-do list"
          >
            <svg
              className="bottom-tab-bar__icon"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.6"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 13l4 4L19 7" />
            </svg>
          </button>

          <button
            type="button"
            className={`bottom-tab-bar__item${activePage === 'calendar' ? ' bottom-tab-bar__item--active' : ''
              }`}
            onClick={() => setActivePage('calendar')}
            aria-label="Calendar"
          >
            <CalendarIcon className="bottom-tab-bar__icon" />
          </button>
        </nav>
      </main>
    </div>
  )
}

// ============================================================
// 16. Export
// ============================================================
export default App