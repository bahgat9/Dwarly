import React from "react"

export default function Pagination({ page, pages, onPageChange }) {
  if (pages <= 1) return null

  return (
    <div className="flex justify-between items-center pt-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
      >
        ← Prev
      </button>
      <span className="text-white/70 text-sm">
        Page {page} of {pages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= pages}
        className="px-3 py-1 bg-white/10 rounded disabled:opacity-50"
      >
        Next →
      </button>
    </div>
  )
}
