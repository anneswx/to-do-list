// ============================================================
// 1. Arrow Up Icon Component
// ============================================================
function ArrowUpIcon({ className = 'icon' }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  )
}

// ============================================================
// 2. Export
// ============================================================
export default ArrowUpIcon