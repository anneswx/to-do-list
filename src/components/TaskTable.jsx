// ============================================================
// 1. Imports
// ============================================================
import TaskRow from './TaskRow'

// ============================================================
// 2. Task Table Component
// ============================================================
function TaskTable({
  tasks,
  onToggleTask,
  onTogglePin,
  onDeleteTask,
  onOpenEditModal,
}) {
  return (
    <div className="table-card">
      <div className="task-table">
        <div className="task-table__header">
          <div>Status</div>
          <div>Task</div>
          <div>Due</div>
          <div>Pin</div>
        </div>

        {tasks.length === 0 ? (
          <div className="empty">No tasks yet.</div>
        ) : (
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleTask={onToggleTask}
              onTogglePin={onTogglePin}
              onDeleteTask={onDeleteTask}
              onOpenEditModal={onOpenEditModal}
            />
          ))
        )}
      </div>
    </div>
  )
}

// ============================================================
// 3. Export
// ============================================================
export default TaskTable