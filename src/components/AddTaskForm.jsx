// ============================================================
// 1. Imports
// ============================================================
import CalendarIcon from './icons/CalendarIcon'
import PinIcon from './icons/PinIcon'
import ArrowUpIcon from './icons/ArrowUpIcon'

// ============================================================
// 2. Helpers
// ============================================================
function formatDate(dateString) {
  if (!dateString) return ''

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

// ============================================================
// 3. Add Task Form Component
// ============================================================
function AddTaskForm({
  isOpen,
  newTask,
  setNewTask,
  dueDate,
  pinned,
  onTogglePinned,
  onOpen,
  onClose,
  onOpenDatePicker,
  onAddTask,
}) {
  return (
    <>
      <button type="button" className="floating-add-button" onClick={onOpen}>
        +
      </button>

      {isOpen && (
        <div className="add-sheet-backdrop" onClick={onClose}>
          <form
            className="add-sheet"
            onSubmit={onAddTask}
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              className="add-sheet__input"
              type="text"
              value={newTask}
              onChange={(e) => setNewTask(e.target.value)}
              placeholder="What would you like to do?"
            />

            <div className="sheet-actions">
              <button
                type="button"
                className={`sheet-icon-action${
                  dueDate ? ' sheet-icon-action--active' : ''
                }`}
                onClick={onOpenDatePicker}
                aria-label="Choose date"
              >
                <CalendarIcon className="sheet-icon-action__svg" />
                {dueDate && <span>{formatDate(dueDate)}</span>}
              </button>

              <button
                type="button"
                className={`sheet-icon-action${
                  pinned ? ' sheet-icon-action--pinned' : ''
                }`}
                onClick={onTogglePinned}
                aria-label={pinned ? 'Unpin new task' : 'Pin new task'}
              >
                <PinIcon pinned={pinned} />
              </button>

              <button
                type="submit"
                className="sheet-submit-circle"
                aria-label="Add task"
              >
                <ArrowUpIcon className="sheet-submit-circle__svg" />
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default AddTaskForm