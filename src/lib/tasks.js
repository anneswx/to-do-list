// ============================================================
// 1. Local Storage Key
// ============================================================
const STORAGE_KEY = 'ticktick-todos'

// ============================================================
// 2. Load Local Tasks
// ============================================================
export function loadLocalTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

// ============================================================
// 3. Save Local Tasks
// ============================================================
export function saveLocalTasks(tasks) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
  } catch {
    // Ignore private browsing/localStorage errors
  }
}

// ============================================================
// 4. Create Local Task ID
// ============================================================
export function newLocalTaskId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

// ============================================================
// 5. Convert Supabase Row to App Task
// ============================================================
export function rowToTask(row) {
  return {
    id: row.id,
    text: row.text,
    completed: row.completed,
    createdAt: row.created_at,
    dueDate: row.due_date,
    pinned: Boolean(row.pinned),
  }
}