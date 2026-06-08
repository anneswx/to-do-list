// ============================================================
// 1. Imports
// ============================================================
import { useState } from 'react'

// ============================================================
// 2. Helpers
// ============================================================
function getDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function getMonthDays(monthDate) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const days = []

  for (let i = 0; i < firstDay.getDay(); i += 1) {
    days.push(null)
  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {
    days.push(new Date(year, month, day))
  }

  return days
}

// ============================================================
// 3. Date Picker Sheet Component
// ============================================================
function DatePickerSheet({ title, value, onChange, onClose, onClear }) {
  const initialMonth = value
    ? new Date(`${value}T00:00:00`)
    : new Date()

  const [visibleMonth, setVisibleMonth] = useState(
    new Date(initialMonth.getFullYear(), initialMonth.getMonth(), 1),
  )

  const days = getMonthDays(visibleMonth)
  const todayKey = getDateKey(new Date())

  function changeMonth(offset) {
    setVisibleMonth(
      (prev) => new Date(prev.getFullYear(), prev.getMonth() + offset, 1),
    )
  }

  function chooseDate(date) {
    onChange(getDateKey(date))
    onClose()
  }

  return (
    <div className="date-sheet-backdrop" onClick={onClose}>
      <div className="date-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="date-sheet__header">
          <h2>{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close calendar">
            ×
          </button>
        </div>

        <div className="date-sheet__month-header">
          <button type="button" onClick={() => changeMonth(-1)}>
            ‹
          </button>

          <strong>
            {visibleMonth.toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric',
            })}
          </strong>

          <button type="button" onClick={() => changeMonth(1)}>
            ›
          </button>
        </div>

        <div className="date-sheet__weekdays">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
            <span key={day}>{day}</span>
          ))}
        </div>

        <div className="date-sheet__grid">
          {days.map((day, index) => {
            if (!day) {
              return <div key={`empty-${index}`} />
            }

            const dateKey = getDateKey(day)
            const isSelected = dateKey === value
            const isToday = dateKey === todayKey

            return (
              <button
                key={dateKey}
                type="button"
                className={`date-sheet__day${
                  isSelected ? ' date-sheet__day--selected' : ''
                }${isToday ? ' date-sheet__day--today' : ''}`}
                onClick={() => chooseDate(day)}
              >
                {day.getDate()}
              </button>
            )
          })}
        </div>

        {value && (
          <button
            type="button"
            className="date-sheet__clear"
            onClick={onClear}
          >
            Clear Date
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default DatePickerSheet