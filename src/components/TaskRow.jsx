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
  onToggleTask,
  onTogglePin,
  onDeleteTask,
  onOpenEditModal,
}) {
  const [translateX, setTranslateX] = useState(0)
  const [isOpen, setIsOpen] = useState(false)

  const swipeStartX = useRef(0)
  const swipeDragged = useRef(false)

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
        type="button"
        className="delete-action"
        onClick={handleDelete}
        aria-label={`Delete ${task.text}`}
      >
        ×
      </button>

      <div
        className="task-row"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onClick={handleRowClick}
        style={{ transform: `translateX(${translateX}px)` }}
      >
        <div>
          <input
            type="checkbox"
            checked={task.completed}
            onChange={() => onToggleTask(task)}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        <div>
          <span className={task.completed ? 'done' : ''}>{task.text}</span>
        </div>

        <div className="due-date-cell">{formatDate(task.dueDate)}</div>

        <div>
          <button
            type="button"
            className={`pin-button${task.pinned ? ' pin-button--pinned' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              onTogglePin(task)
            }}
            aria-label={task.pinned ? 'Unpin task' : 'Pin task'}
          >
            <PinIcon pinned={task.pinned} />
          </button>
        </div>
      </div>
    </div>
  )
}

// ============================================================
// 4. Export
// ============================================================
export default TaskRow