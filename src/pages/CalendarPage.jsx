// ============================================================
// 1. Imports
// ============================================================
import Calendar from 'react-calendar'

// ============================================================
// 2. Helpers
// ============================================================
function toDateKey(date) {
  return date.toISOString().slice(0, 10)
}

// ============================================================
// 3. Calendar Page
// ============================================================
function CalendarPage({ tasks }) {
  function getTasksForDate(date) {
    const dateKey = toDateKey(date)

    return tasks.filter((task) => task.dueDate === dateKey)
  }

  return (
    <div className="calendar-page">
      <Calendar
        locale="en-US"
        calendarType="gregory"
        tileContent={({ date, view }) => {
          if (view !== 'month') return null

          const dayTasks = getTasksForDate(date)

          if (dayTasks.length === 0) return null

          return (
            <div className="calendar-day-tasks">
              {dayTasks.slice(0, 2).map((task) => (
                <div key={task.id} className="calendar-day-task">
                  {task.text}
                </div>
              ))}

              {dayTasks.length > 2 && (
                <div className="calendar-day-more">
                  +{dayTasks.length - 2}
                </div>
              )}
            </div>
          )
        }}
      />
    </div>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default CalendarPage