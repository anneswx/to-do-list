// ============================================================
// 1. Imports
// ============================================================
import { useRef, useState } from 'react'
import PinIcon from './icons/PinIcon'

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
// 3. Task Row Component
// ============================================================
function TaskRow({
  task,
  variant = 'table',
  onToggleTask,
  onTogglePin,
  onDeleteTask,
  onOpenEditModal,
}) {
  const [translateX, setTranslateX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const swipeStartX = useRef(0)
  const swipeDragged = useRef(false)

  const isCalendarVariant = variant === 'calendar'
  const formattedDate = formatDate(task.dueDate)

  function handlePointerDown(event) {
    swipeStartX.current = event.clientX
    swipeDragged.current = false
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  function handlePointerMove(event) {
    const deltaX = event.clientX - swipeStartX.current
    const nextTranslate = Math.max(Math.min(deltaX, 0), -88)

    if (Math.abs(deltaX) > 8) {
      swipeDragged.current = true
    }

    setTranslateX(nextTranslate)
  }

  function handlePointerEnd() {
    if (translateX <= -48) {
      setIsOpen(true)
      setTranslateX(-76)
    } else {
      setIsOpen(false)
      setTranslateX(0)
    }
  }

  function handleRowClick() {
    if (swipeDragged.current) {
      swipeDragged.current = false
      return
    }

    if (isOpen) {
      setIsOpen(false)
      setTranslateX(0)
      return
    }

    onOpenEditModal(task)
  }

  function handleDelete() {
    setIsOpen(false)
    setTranslateX(0)
    onDeleteTask(task.id)
  }

  return (
    <div className="swipe-row">
      <button
        className="delete-action"
        type="button"
        onClick={handleDelete}
        aria-label="Delete task"
      >
        ×
      </button>

      <div
        className={`task-row ${
          isCalendarVariant ? 'task-row--calendar' : ''
        }`}
        style={{ transform: `translateX(${translateX}px)` }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleRowClick}
      >
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggleTask(task)}
          onClick={(event) => event.stopPropagation()}
        />

        <div className="task-row__main">
          <span className={task.completed ? 'done' : ''}>{task.text}</span>

          {isCalendarVariant && formattedDate && (
            <span className="task-row__date-below">{formattedDate}</span>
          )}
        </div>

        {!isCalendarVariant && (
          <span className="due-date-cell">{formattedDate}</span>
        )}

        {!isCalendarVariant && onTogglePin && (
          <button
            className={`pin-button ${
              task.pinned ? 'pin-button--pinned' : ''
            }`}
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onTogglePin(task)
            }}
            aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
          >
            <PinIcon className="pin-icon" />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default TaskRow