// src/pages/user/AcademyAccessRequest.jsx
import React, { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { api } from "../../api"

export default function AcademyAccessRequest() {
  const [academies, setAcademies] = useState([])
  const [selected, setSelected] = useState("")
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)

  const navigate = useNavigate()

  async function loadAcademies() {
    try {
      const data = await api("/api/academies")
      setAcademies(data || [])
    } catch (err) {
      console.error("Failed to load academies:", err)
      setError("Could not load academies.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!selected) {
      alert("Please select an academy first.")
      return
    }

    try {
      setSubmitting(true)
      await api("/api/academy-requests", {
        method: "POST",
        body: JSON.stringify({ academyId: selected }),
      })
      navigate("/user/requests")
    } catch (err) {
      console.error("Failed to send request:", err)
      alert("Something went wrong. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadAcademies()
  }, [])

  if (loading) return <p className="p-6">Loading academies...</p>
  if (error) return <p className="p-6 text-red-500">{error}</p>

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <div className="bg-white/10 rounded-2xl p-6 shadow space-y-6">
        <h1 className="text-2xl font-bold">Request Academy Access 📝</h1>
        <p className="text-white/70">
          Choose the academy you’d like to join and send a request.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dropdown */}
          <div>
            <label className="block mb-2 text-white/80">Select Academy</label>
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-black"
            >
              <option value="">-- Choose an Academy --</option>
              {academies.map((a) => (
                <option key={a._id} value={a._id}>
                  {a.name} ({a.location})
                </option>
              ))}
            </select>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={submitting}
            className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-2xl shadow text-lg disabled:opacity-50"
          >
            {submitting ? "Sending..." : "Submit Request"}
          </button>
        </form>
      </div>
    </div>
  )
}
