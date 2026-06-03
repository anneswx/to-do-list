// ============================================================
// 1. Helpers
// ============================================================
function formatDueDate(dateString) {
  if (!dateString) return 'Due date'

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ============================================================
// 2. Add Task Form Component
// ============================================================
function AddTaskForm({
  newTask,
  setNewTask,
  dueDate,
  onOpenDatePicker,
  onAddTask,
}) {
  return (
    <form className="add-form" onSubmit={onAddTask}>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Add a new task"
      />

      <button
        type="button"
        className={`calendar-button${dueDate ? ' calendar-button--active' : ''}`}
        onClick={onOpenDatePicker}
        aria-label="Choose due date"
      >
        📅
        <span>{formatDueDate(dueDate)}</span>
      </button>

      <button type="submit">Add</button>
    </form>
  )
}

// ============================================================
// 3. Export
// ============================================================
export default AddTaskForm