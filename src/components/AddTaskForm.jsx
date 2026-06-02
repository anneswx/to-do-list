function AddTaskForm({ newTask, setNewTask, onAddTask }) {
  return (
    <form className="add-form" onSubmit={onAddTask}>
      <input
        type="text"
        value={newTask}
        onChange={(e) => setNewTask(e.target.value)}
        placeholder="Add a new task"
      />
      <button type="submit">Add</button>
    </form>
  )
}

export default AddTaskForm