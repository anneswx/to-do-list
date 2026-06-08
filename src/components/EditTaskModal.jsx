// ============================================================
// 1. Imports
// ============================================================
import CalendarIcon from './icons/CalendarIcon'
import PinIcon from './icons/PinIcon'
import TrashIcon from './icons/TrashIcon'

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
// 3. Edit Task Modal Component
// ============================================================
function EditTaskModal({
  editingText,
  setEditingText,
  editingDueDate,
  editingPinned,
  onOpenDatePicker,
  onTogglePinned,
  onSaveAndClose,
  onDelete,
}) {
  return (
    <div className="modal-backdrop" onClick={onSaveAndClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <input
          className="edit-input"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
          autoFocus
        />

        <div className="sheet-actions">
          <button
            type="button"
            className={`sheet-icon-action${
              editingDueDate ? ' sheet-icon-action--active' : ''
            }`}
            onClick={onOpenDatePicker}
            aria-label="Edit date"
          >
            <CalendarIcon className="sheet-icon-action__svg" />
            {editingDueDate && <span>{formatDate(editingDueDate)}</span>}
          </button>

          <button
            type="button"
            className={`sheet-icon-action${
              editingPinned ? ' sheet-icon-action--pinned' : ''
            }`}
            onClick={onTogglePinned}
            aria-label={editingPinned ? 'Unpin task' : 'Pin task'}
          >
            <PinIcon pinned={editingPinned} />
          </button>

          <button
            type="button"
            className="sheet-delete-icon"
            onClick={onDelete}
            aria-label="Delete task"
          >
            <TrashIcon className="sheet-delete-icon__svg" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default EditTaskModal