// ============================================================
// 1. Imports
// ============================================================
import { useEffect, useMemo, useRef, useState } from 'react'

// ============================================================
// 2. Date Helpers
// ============================================================
function toDateKey(date) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
}

function toMonthSerial(year, month) {
    return year * 12 + month
}

function fromMonthSerial(serial) {
    return {
        year: Math.floor(serial / 12),
        month: serial % 12,
    }
}

function getMonthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-US', {
        month: 'long',
    })
}

function getShortMonthLabel(month) {
    return new Date(2026, month, 1).toLocaleDateString('en-US', {
        month: 'long',
    })
}

function getMonthDates(year, month) {
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)

    const start = new Date(firstDay)
    start.setDate(start.getDate() - start.getDay())

    const end = new Date(lastDay)
    end.setDate(end.getDate() + (6 - end.getDay()))

    const dates = []
    const current = new Date(start)

    while (current <= end) {
        dates.push(new Date(current))
        current.setDate(current.getDate() + 1)
    }

    return dates
}

function getWeekDates(date) {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())

    return Array.from({ length: 7 }, (_, index) => {
        const current = new Date(start)
        current.setDate(start.getDate() + index)
        return current
    })
}

// ============================================================
// 3. Calendar Page
// ============================================================
function CalendarPage({ tasks, onOpenEditModal }) {
    const today = useMemo(() => new Date(), [])
    const currentSerial = toMonthSerial(today.getFullYear(), today.getMonth())

    const monthScrollRef = useRef(null)
    const monthRefs = useRef({})

    const [view, setView] = useState('month')
    const [activeYear, setActiveYear] = useState(today.getFullYear())
    const [activeMonth, setActiveMonth] = useState(today.getMonth())
    const [selectedDate, setSelectedDate] = useState(null)
    const [startSerial, setStartSerial] = useState(currentSerial - 24)
    const [endSerial, setEndSerial] = useState(currentSerial + 24)
    const [pendingScrollSerial, setPendingScrollSerial] = useState(currentSerial)

    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    const monthSerials = useMemo(() => {
        const serials = []

        for (let serial = startSerial; serial <= endSerial; serial += 1) {
            serials.push(serial)
        }

        return serials
    }, [startSerial, endSerial])

    function getTasksForDate(date) {
        const dateKey = toDateKey(date)

        return tasks.filter((task) => task.dueDate === dateKey)
    }

    function openYearView() {
        setView('year')
        setSelectedDate(null)
    }

    function openMonthView(year, month) {
        const serial = toMonthSerial(year, month)

        setActiveYear(year)
        setActiveMonth(month)
        setPendingScrollSerial(serial)
        setSelectedDate(null)
        setView('month')

        if (serial < startSerial + 6) {
            setStartSerial(serial - 24)
        }

        if (serial > endSerial - 6) {
            setEndSerial(serial + 24)
        }
    }

    function openDayView(date) {
        setSelectedDate(date)
        setActiveYear(date.getFullYear())
        setActiveMonth(date.getMonth())
        setView('day')
    }

    function returnToMonthView() {
        setView('month')
    }

    function handleMonthScroll() {
        const container = monthScrollRef.current
        if (!container) return

        if (container.scrollTop < 500) {
            setStartSerial((prev) => prev - 12)
        }

        if (
            container.scrollHeight - container.scrollTop - container.clientHeight <
            500
        ) {
            setEndSerial((prev) => prev + 12)
        }

        const containerTop = container.getBoundingClientRect().top
        let closestSerial = null
        let closestDistance = Infinity

        monthSerials.forEach((serial) => {
            const element = monthRefs.current[serial]
            if (!element) return

            const distance = Math.abs(
                element.getBoundingClientRect().top - containerTop,
            )

            if (distance < closestDistance) {
                closestDistance = distance
                closestSerial = serial
            }
        })

        if (closestSerial !== null) {
            const { year, month } = fromMonthSerial(closestSerial)
            setActiveYear(year)
            setActiveMonth(month)
        }
    }

    useEffect(() => {
        if (view !== 'month') return

        const container = monthScrollRef.current
        const element = monthRefs.current[pendingScrollSerial]

        if (!container || !element) return

        requestAnimationFrame(() => {
            container.scrollTop = element.offsetTop - container.offsetTop
        })
    }, [view, pendingScrollSerial])

    const weekDates = selectedDate ? getWeekDates(selectedDate) : []
    const selectedTasks = selectedDate ? getTasksForDate(selectedDate) : []

    return (
        <div className="calendar-page">
            {view === 'month' && (
                <>
                    <header className="calendar-page__header calendar-page__header--month">
                        <div className="calendar-page__top-row">
                            <button
                                className="calendar-page__year-button"
                                type="button"
                                onClick={openYearView}
                            >
                                ‹ {activeYear}
                            </button>

                            <h2>{getMonthLabel(activeYear, activeMonth)}</h2>
                        </div>

                        <div className="calendar-page__sticky-weekdays">
                            {weekdays.map((weekday) => (
                                <div key={weekday}>{weekday}</div>
                            ))}
                        </div>
                    </header>

                    <div
                        className="calendar-month-scroll"
                        ref={monthScrollRef}
                        onScroll={handleMonthScroll}
                    >
                        {monthSerials.map((serial) => {
                            const { year, month } = fromMonthSerial(serial)
                            const monthDates = getMonthDates(year, month)

                            return (
                                <section
                                    className="calendar-month-section"
                                    key={serial}
                                    ref={(element) => {
                                        monthRefs.current[serial] = element
                                    }}
                                >
                                    <div className="calendar-month-section__spacer" />

                                    <div className="calendar-month__label-row">
                                        <span className="calendar-month__label">
                                            {new Date(year, month, 1).toLocaleDateString('en-US', {
                                                month: 'short',
                                            })}
                                        </span>
                                    </div>

                                    <div className="calendar-month__grid">
                                        {monthDates.map((date) => {
                                            const isCurrentMonth = date.getMonth() === month
                                            const dayTasks = getTasksForDate(date)

                                            return (
                                                <button
                                                    className={`calendar-day ${!isCurrentMonth ? 'calendar-day--empty' : ''
                                                        }`}
                                                    key={toDateKey(date)}
                                                    type="button"
                                                    onClick={() => {
                                                        if (isCurrentMonth) {
                                                            openDayView(date)
                                                        }
                                                    }}
                                                >
                                                    <span className="calendar-day__number">
                                                        {isCurrentMonth ? date.getDate() : ''}
                                                    </span>

                                                    <span className="calendar-day__tasks">
                                                        {isCurrentMonth &&
                                                            dayTasks.slice(0, 2).map((task) => (
                                                                <span
                                                                    className="calendar-day__task"
                                                                    key={task.id}
                                                                >
                                                                    {task.text}
                                                                </span>
                                                            ))}

                                                        {isCurrentMonth && dayTasks.length > 2 && (
                                                            <span className="calendar-day__more">
                                                                +{dayTasks.length - 2}
                                                            </span>
                                                        )}
                                                    </span>
                                                </button>
                                            )
                                        })}
                                    </div>
                                </section>
                            )
                        })}
                    </div>
                </>
            )}

            {view === 'year' && (
                <>
                    <header className="calendar-year__header">
                        <button type="button" onClick={() => setActiveYear(activeYear - 1)}>
                            ‹
                        </button>

                        <h2>{activeYear}</h2>

                        <button type="button" onClick={() => setActiveYear(activeYear + 1)}>
                            ›
                        </button>
                    </header>

                    <div className="calendar-year__grid">
                        {Array.from({ length: 12 }, (_, month) => (
                            <button
                                className="calendar-year__month"
                                key={month}
                                type="button"
                                onClick={() => openMonthView(activeYear, month)}
                            >
                                <strong>{getShortMonthLabel(month)}</strong>

                                <div className="calendar-year__weekdays">
                                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, index) => (
                                        <span key={`${day}-${index}`}>{day}</span>
                                    ))}
                                </div>

                                <div className="calendar-year__mini-grid">
                                    {getMonthDates(activeYear, month).map((date) => (
                                        <span key={toDateKey(date)}>
                                            {date.getMonth() === month ? date.getDate() : ''}
                                        </span>
                                    ))}
                                </div>
                            </button>
                        ))}
                    </div>
                </>
            )}

            {view === 'day' && selectedDate && (
                <>
                    <header className="calendar-page__header">
                        <button
                            className="calendar-page__year-button"
                            type="button"
                            onClick={returnToMonthView}
                        >
                            ‹ Month
                        </button>

                        <h2>{getMonthLabel(activeYear, activeMonth)}</h2>
                    </header>

                    <div className="calendar-week">
                        {weekDates.map((date) => {
                            const isSelected = toDateKey(date) === toDateKey(selectedDate)

                            return (
                                <button
                                    className={`calendar-week__day ${isSelected ? 'calendar-week__day--selected' : ''
                                        }`}
                                    key={toDateKey(date)}
                                    type="button"
                                    onClick={() => {
                                        if (isSelected) {
                                            returnToMonthView()
                                        } else {
                                            setSelectedDate(date)
                                        }
                                    }}
                                >
                                    <span>{weekdays[date.getDay()]}</span>
                                    <strong>{date.getDate()}</strong>
                                </button>
                            )
                        })}
                    </div>

                    <section className="calendar-day-detail">
                        {selectedTasks.length === 0 ? (
                            <p>No tasks</p>
                        ) : (
                            selectedTasks.map((task) => (
                                <button
                                    className="calendar-day-detail__task"
                                    key={task.id}
                                    type="button"
                                    onClick={() => onOpenEditModal(task)}
                                >
                                    {task.text}
                                </button>
                            ))
                        )}
                    </section>
                </>
            )}
        </div>
    )
}

// ============================================================
// 4. Export
// ============================================================
export default CalendarPage