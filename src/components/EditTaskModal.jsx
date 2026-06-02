// ============================================================
// 1. Edit Task Modal Component
// ============================================================
function EditTaskModal({
  editingText,
  setEditingText,
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
// 2. Export
// ============================================================
export default EditTaskModal