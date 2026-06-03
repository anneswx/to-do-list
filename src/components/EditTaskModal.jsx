// ============================================================
// 1. Helpers
// ============================================================
function formatDueDate(dateString) {
  if (!dateString) return 'No due date'

  return new Date(`${dateString}T00:00:00`).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

// ============================================================
// 2. Edit Task Modal Component
// ============================================================
function EditTaskModal({
  editingText,
  setEditingText,
  editingDueDate,
  onOpenDatePicker,
  onSave,
  onCancel,
  onDelete,
}) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal-close"
          aria-label="Close edit task window"
          onClick={onCancel}
        >
          ×
        </button>

        <h2>Edit task</h2>

        <input
          className="edit-input"
          value={editingText}
          onChange={(e) => setEditingText(e.target.value)}
        />

        <button
          type="button"
          className="editable-due-date"
          onClick={onOpenDatePicker}
        >
          <span>Due date</span>
          <strong>{formatDueDate(editingDueDate)}</strong>
        </button>

        <div className="modal-actions">
          <button onClick={onSave}>Save</button>
          <button className="danger" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 3. Export
// ============================================================
export default EditTaskModal