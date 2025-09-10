// src/pages/user/AcademyDetails.jsx
import React, { useEffect, useState } from "react"
import { useParams, useNavigate, Link } from "react-router-dom"
import { api } from "../../api"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"

export default function AcademyDetails() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [academy, setAcademy] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function loadAcademy() {
    try {
      const data = await api(`/api/academies/${id}`)
      setAcademy(data || null)
    } catch (err) {
      console.error("Failed to load academy:", err)
      setError("Academy not found.")
    } finally {
      setLoading(false)
    }
  }

  async function handleRequest() {
    try {
      setSubmitting(true)
      await api("/api/academy-requests", {
        method: "POST",
        body: JSON.stringify({ academyId: id }),
      })
      navigate("/user/requests")
    } catch (err) {
      console.error("Failed to send request:", err)
      alert("Failed to send request. Try again.")
    } finally {
      setSubmitting(false)
    }
  }

  useEffect(() => {
    loadAcademy()
  }, [id])

  // Loading state with skeleton
  if (loading)
    return (
      <div className="max-w-4xl mx-auto py-10 px-4">
        <LoadingSkeleton lines={4} />
      </div>
    )

  // Error state styled card
  if (error)
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <div className="bg-red-500/20 text-red-400 p-6 rounded-xl">
          {error}
        </div>
        <Link
          to="/user/academies"
          className="mt-4 inline-block bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-xl shadow text-lg"
        >
          Back to Academies
        </Link>
      </div>
    )

  if (!academy)
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 text-white/70">
        Academy not found.
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto py-10 px-4 space-y-8">
      {/* Header */}
      <div className="bg-white/10 rounded-2xl p-6 shadow">
        <h1 className="text-3xl font-bold">{academy.name}</h1>
        <p className="text-white/70 mt-2">{academy.location}</p>
      </div>

      {/* Description */}
      <div className="bg-white/10 rounded-2xl p-6 shadow">
        <h2 className="text-xl font-semibold mb-2">About this Academy</h2>
        <p className="text-white/80">
          {academy.description || "No description available."}
        </p>
      </div>

      {/* Extra details */}
      {academy.contact && (
        <div className="bg-white/10 rounded-2xl p-6 shadow">
          <h2 className="text-xl font-semibold mb-2">Contact</h2>
          <p className="text-white/80">{academy.contact}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-4">
        <button
          onClick={handleRequest}
          disabled={submitting}
          className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-2xl shadow text-lg disabled:opacity-50"
        >
          {submitting ? "Sending..." : "Request to Join"}
        </button>
        <Link
          to="/user/academies"
          className="bg-gray-600 hover:bg-gray-700 px-6 py-3 rounded-2xl shadow text-lg"
        >
          Back to Academies
        </Link>
      </div>
    </div>
  )
}
