// src/pages/user/AcademyDetails.jsx
import React, { useEffect, useMemo, useState } from "react"
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
  const [branchIndex, setBranchIndex] = useState(0)
  const touchStartXRef = React.useRef(null)

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

  // Ensure a valid branch index whenever academy changes
  useEffect(() => {
    if (!academy || !Array.isArray(academy.branches)) return
    let idx = 0
    const mainIdx = academy.branches.findIndex((b) => b.isMain)
    if (mainIdx >= 0) idx = mainIdx
    setBranchIndex(idx)
  }, [academy])

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
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">{academy.name}</h1>
            <div className="text-white/70 mt-2 text-sm">
              {Array.isArray(academy.branches) && academy.branches.length > 0 ? (
                <>
                  <span className="mr-1">📍</span>
                  {academy.branches[branchIndex]?.locationDescription ||
                    (academy.branches[branchIndex]?.locationGeo
                      ? `${academy.branches[branchIndex].locationGeo.lat}, ${academy.branches[branchIndex].locationGeo.lng}`
                      : "—")}
                </>
              ) : (
                academy.location || academy.locationDescription || "—"
              )}
            </div>
          </div>
          {academy.logo && (
            <img src={academy.logo} alt={academy.name} className="w-20 h-20 rounded-xl object-cover border border-white/10" />
          )}
        </div>
      </div>

      {/* Branch slider */}
      {Array.isArray(academy.branches) && academy.branches.length > 0 && (
        <div className="bg-white/10 rounded-2xl p-6 shadow">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Branches</h2>
            <div className="flex items-center gap-2">
              {/* Desktop next button */}
              <button
                className="hidden md:inline-flex px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20"
                onClick={() => setBranchIndex((i) => (i + 1) % academy.branches.length)}
              >
                Next ➜
              </button>
            </div>
          </div>
          {/* Slide area */}
          <div
            className="relative overflow-hidden rounded-xl border border-white/10"
            onTouchStart={(e) => {
              touchStartXRef.current = e.changedTouches[0].clientX
            }}
            onTouchEnd={(e) => {
              const startX = touchStartXRef.current
              if (startX == null) return
              const endX = e.changedTouches[0].clientX
              const dx = endX - startX
              const threshold = 40
              if (dx < -threshold) {
                setBranchIndex((i) => (i + 1) % academy.branches.length)
              } else if (dx > threshold) {
                setBranchIndex((i) => (i - 1 + academy.branches.length) % academy.branches.length)
              }
              touchStartXRef.current = null
            }}
          >
            <div className="p-4 min-h-[140px]">
              <div className="text-lg font-semibold mb-1">{academy.branches[branchIndex]?.name || `Branch ${branchIndex + 1}`}</div>
              <div className="text-white/80 mb-2">
                📍 {academy.branches[branchIndex]?.locationDescription ||
                (academy.branches[branchIndex]?.locationGeo
                  ? `${academy.branches[branchIndex].locationGeo.lat}, ${academy.branches[branchIndex].locationGeo.lng}`
                  : "—")}
              </div>
              {academy.branches[branchIndex]?.phone && (
                <div className="text-white/80 mb-2">☎ {academy.branches[branchIndex].phone}</div>
              )}
              {academy.branches[branchIndex]?.trainingTimes?.length > 0 && (
                <div className="text-sm text-white/80">
                  <div className="font-medium mb-1">Training Times</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {academy.branches[branchIndex].trainingTimes.map((tt, i) => (
                      <li key={i}>{tt.day} – {tt.time}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
          {/* Dots */}
          <div className="mt-3 flex items-center justify-center gap-2">
            {academy.branches.map((_, i) => (
              <button
                key={i}
                className={`w-2.5 h-2.5 rounded-full ${i === branchIndex ? 'bg-accent-500' : 'bg-white/30'}`}
                onClick={() => setBranchIndex(i)}
              />
            ))}
          </div>
          <div className="mt-2 text-xs text-white/60 text-center">Swipe horizontally on mobile to change branch</div>
        </div>
      )}

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
