import { useRef, useState } from 'react'

function TaskRow({ task, onToggleTask, onDeleteTask, onOpenEditModal }) {
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

        <div>
          {new Date(task.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          })}
        </div>
      </div>
    </div>
  )
}

export default TaskRow