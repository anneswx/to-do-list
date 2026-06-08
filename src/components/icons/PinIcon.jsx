// ============================================================
// 1. Pin Icon Component
// ============================================================
function PinIcon({ pinned = false }) {
  if (pinned) {
    return (
      <svg
        className="pin-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M8 4h8" />
        <path d="M10 4v7l-3 3h10l-3-3V4" />
        <path d="M12 14v6" />
      </svg>
    )
  }

  return (
    <svg
      className="pin-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 4h8" />
      <path d="M10 4v7l-3 3h10l-3-3V4" />
      <path d="M12 14v6" />
      <path d="M4 4l16 16" />
    </svg>
  )
}

// ============================================================
// 2. Export
// ============================================================
export default PinIcon