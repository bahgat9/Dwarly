// src/pages/user/AcademiesList.jsx
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../api"

export default function AcademiesList() {
  const [academies, setAcademies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadAcademies() {
    try {
      const response = await api("/academies")
      setAcademies(response || [])
    } catch (err) {
      console.error("Failed to load academies:", err)
      setError("Failed to load academies: " + err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest(academyId) {
    setSubmitting(true)
    try {
      await api("/academy-requests", {
        method: "POST",
        body: JSON.stringify({ academyId }),
      })
      alert("Request sent successfully!")
    } catch (err) {
      console.error("Failed to send request:", err)
      alert("Failed to send request.")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadAcademies()
  }, [])

  if (loading) {
    return <p className="p-6">Loading academies...</p>
  }

  if (error) {
    return <p className="p-6 text-red-500">{error}</p>
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="bg-white/10 rounded-2xl p-6 shadow">
        <h1 className="text-2xl font-bold">Browse Academies 🏫</h1>
        <p className="text-white/70 mt-1">
          Explore football academies and send a request to join.
        </p>
      </div>

      {/* Academies grid */}
      {academies.length === 0 ? (
        <p className="text-white/70">No academies available yet.</p>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {academies.map((academy) => (
            <div
              key={academy._id}
              className="bg-white/10 rounded-2xl p-6 shadow flex flex-col justify-between"
            >
              <div>
                <h2 className="text-xl font-semibold">{academy.name}</h2>
                <p className="text-white/70 mt-1">
                  {academy.nameAr || "—"}
                </p>
                <p className="text-white/70 text-sm mt-2">
                  📍 {academy.location?.lat}, {academy.location?.lng}
                </p>
                <p className="text-white/70 text-sm mt-2">
                  ⭐ {academy.rating}
                </p>
              </div>
              <div className="mt-4 flex justify-between items-center">
                <Link
                  to={`/academies/${academy._id}`}
                  className="text-blue-400 hover:underline"
                >
                  View Details
                </Link>
                <button
                  onClick={() => handleRequest(academy._id)}
                  className="bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm"
                  disabled={submitting}
                >
                  {submitting ? "Sending..." : "Request to Join"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
