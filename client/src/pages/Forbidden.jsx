import React from "react"
import { Link } from "react-router-dom"

export default function Forbidden() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
      <h1 className="text-5xl font-bold text-red-500">403</h1>
      <p className="text-lg text-white/80">
        You don’t have permission to view this page.
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 shadow"
      >
        ⬅️ Go Back Home
      </Link>
    </div>
  )
}
