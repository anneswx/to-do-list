import TaskRow from './TaskRow'

function TaskTable({ tasks, onToggleTask, onDeleteTask, onOpenEditModal }) {
  return (
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
          tasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleTask={onToggleTask}
              onDeleteTask={onDeleteTask}
              onOpenEditModal={onOpenEditModal}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default TaskTable