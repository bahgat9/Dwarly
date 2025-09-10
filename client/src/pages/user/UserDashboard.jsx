// src/pages/user/UserDashboard.jsx
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../api"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import Pagination from "../../components/Pagination.jsx"
import { motion } from "framer-motion"

function Card({ children, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br from-brand-700 to-brand-800 rounded-3xl p-6 border border-white/10 shadow-xl ${className}`}
    >
      {children}
    </motion.div>
  )
}

function GradientButton({ to, children, className = "" }) {
  const base =
    "inline-flex items-center justify-center rounded-xl font-semibold transition px-6 py-3 shadow-md"
  const gradient = "bg-gradient-to-r from-brand-600 to-accent-500 text-white hover:opacity-90"
  if (to) {
    return <Link to={to} className={`${base} ${gradient} ${className}`}>{children}</Link>
  }
  return <button className={`${base} ${gradient} ${className}`}>{children}</button>
}

function Badge({ status }) {
  const colors = {
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
    pending: "bg-yellow-100 text-yellow-700",
  }
  return (
    <span className={`px-3 py-1 rounded-full text-sm font-medium ${colors[status] || "bg-gray-100 text-gray-700"}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function UserDashboard({ session }) {
  const [requests, setRequests] = useState([])
  const [matches, setMatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)

  async function loadData(p = 1) {
    try {
      setLoading(true)
      const r = await api(`/api/playerRequests/my?page=${p}&limit=5`)
      const m = await api("/api/matches/upcoming")
      setRequests(r.items || [])
      setPages(r.pages || 1)
      setPage(r.page || 1)
      setMatches(m || [])
    } catch (err) {
      console.error("Failed to load user dashboard data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadData(1) }, [])

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      
      {/* Welcome Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-3xl p-8 border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">
              Welcome back, {session?.name || "Player"} 👋
            </h1>
            <p className="text-white/80 text-lg">
              Your football journey starts here as <span className="text-accent-400 font-semibold">{session?.role}</span>.
            </p>
          </div>
          <div className="text-6xl opacity-20">⚽</div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="text-center">
          <h4 className="text-sm uppercase text-white/80">Total Requests</h4>
          <p className="text-3xl font-bold text-white">{requests.length}</p>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm uppercase text-white/80">Approved</h4>
          <p className="text-3xl font-bold text-white">{requests.filter(r => r.status === "approved").length}</p>
        </Card>
        <Card className="text-center">
          <h4 className="text-sm uppercase text-white/80">Pending</h4>
          <p className="text-3xl font-bold text-white">{requests.filter(r => r.status === "pending").length}</p>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="text-center">
          <h3 className="text-xl font-semibold text-white mb-3">Find Your Academy</h3>
          <p className="text-white/70 mb-5">Browse and explore academies near you.</p>
          <GradientButton to="/academies">⚽ Browse Academies</GradientButton>
        </Card>
        <Card className="text-center">
          <h3 className="text-xl font-semibold text-white mb-3">Request Access</h3>
          <p className="text-white/70 mb-5">Connect with an academy to start training.</p>
          <GradientButton to="/academies">📝 Request Academy Access</GradientButton>
        </Card>
      </div>

      {/* Requests */}
      <Card>
        <h2 className="text-2xl font-bold text-white mb-6">My Academy Requests</h2>
        {loading ? (
          <LoadingSkeleton lines={3} />
        ) : requests.length === 0 ? (
          <div className="text-center py-6 text-white/70">
            <p className="mb-4">You haven't made any requests yet.</p>
            <GradientButton to="/academies">➕ Make your first request</GradientButton>
          </div>
        ) : (
          <>
            <ul className="space-y-4">
              {requests.map((req) => (
                <li key={req._id} className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between hover:bg-white/10 transition">
                  <span className="font-medium text-white">{req.academy?.name}</span>
                  <Badge status={req.status} />
                </li>
              ))}
            </ul>
            <div className="mt-6">
              <Pagination page={page} pages={pages} onPageChange={loadData} />
            </div>
          </>
        )}
      </Card>

      {/* Matches Timeline */}
      <Card>
        <h2 className="text-2xl font-bold text-white mb-6">Upcoming Matches</h2>
        {loading ? (
          <LoadingSkeleton lines={3} />
        ) : matches.length === 0 ? (
          <p className="text-white/70">No upcoming matches yet.</p>
        ) : (
          <div className="relative border-l-2 border-brand-600 pl-6">
            {matches.map((match, i) => (
              <div key={match._id} className="mb-8">
                <div className="absolute -left-3 w-6 h-6 bg-brand-600 rounded-full border-4 border-white shadow"></div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/10 hover:bg-white/10 transition">
                  <p className="font-semibold text-white">{match.opponentName}</p>
                  <p className="text-sm text-white/60">{new Date(match.date).toLocaleString()}</p>
                  <div className="mt-2">
                    <Badge status={match.status || "pending"} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  )
}
