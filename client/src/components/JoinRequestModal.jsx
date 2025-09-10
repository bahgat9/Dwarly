import React from 'react'

export default function JoinRequestModal({ academyName, form, setForm, onCancel, onSubmit, submitting }) {
  return (
    <div className="fixed inset-0 z-50 bg-brand-900 bg-opacity-90 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-gradient-to-br from-brand-700 to-brand-800 text-white shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4">Join Academy: {academyName}</h2>
        <div className="grid gap-4">
          <label className="flex flex-col gap-1">
            <span>Player Name</span>
            <input
              type="text"
              value={form.userName}
              onChange={e => setForm({ ...form, userName: e.target.value })}
              className="px-3 py-2 rounded-xl border border-white/30 bg-transparent text-white placeholder-white/70"
              placeholder="Enter your full name"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Age</span>
            <input
              type="number"
              min="1"
              value={form.age}
              onChange={e => setForm({ ...form, age: e.target.value })}
              className="px-3 py-2 rounded-xl border border-white/30 bg-transparent text-white placeholder-white/70"
              placeholder="Enter your age"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span>Position</span>
            <input
              type="text"
              value={form.position}
              onChange={e => setForm({ ...form, position: e.target.value })}
              className="px-3 py-2 rounded-xl border border-white/30 bg-transparent text-white placeholder-white/70"
              placeholder="Enter your playing position"
            />
          </label>
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-xl bg-white/20 hover:bg-white/30 transition-colors"
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={onSubmit}
            disabled={submitting || !form.userName || !form.age || !form.position}
            className="px-4 py-2 rounded-xl bg-accent-500 text-white font-semibold disabled:opacity-50 transition-colors"
            type="button"
          >
            {submitting ? "Sending..." : "Send Request"}
          </button>
        </div>
      </div>
    </div>
  )
}
