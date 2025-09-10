// src/pages/academy/AcademyDashboard.jsx
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../api"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import { Users, Trophy, Clock, UserPlus, Calendar, ArrowUpRight, CheckCircle, XCircle, Clock as PendingIcon } from "lucide-react"
import { motion } from "framer-motion"

const StatCard = ({ icon, title, value, color = "blue", loading }) => {
  const colors = {
    blue: "from-blue-600 to-blue-700",
    green: "from-green-600 to-green-700", 
    purple: "from-purple-600 to-purple-700",
    amber: "from-amber-600 to-amber-700"
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gradient-to-br ${colors[color]} rounded-3xl p-6 text-white shadow-xl`}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 rounded-2xl bg-white/20 backdrop-blur-sm">
          {icon}
        </div>
        <ArrowUpRight className="w-5 h-5 opacity-70" />
      </div>
      {loading ? (
        <LoadingSkeleton lines={2} />
      ) : (
        <>
          <div className="text-3xl font-bold mb-1">{value || 0}</div>
          <div className="text-white/80 text-sm">{title}</div>
        </>
      )}
    </motion.div>
  )
}

const RequestItem = ({ request, onDelete }) => {
  const statusIcons = {
    approved: <CheckCircle className="w-4 h-4 text-green-400" />,
    rejected: <XCircle className="w-4 h-4 text-red-400" />,
    pending: <PendingIcon className="w-4 h-4 text-amber-400" />
  }

  const statusColors = {
    approved: "text-green-400",
    rejected: "text-red-400", 
    pending: "text-amber-400"
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex-1">
        <div className="font-medium text-white">
          {request.userName || "Unknown Player"}
        </div>
        <div className="text-sm text-white/60">
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className={`flex items-center gap-2 text-sm font-medium ${statusColors[request.status]}`}>
        {statusIcons[request.status]}
        <span className="capitalize">{request.status}</span>
        {request.status === "rejected" && (
          <button
            onClick={() => onDelete(request._id)}
            className="ml-4 px-2 py-1 bg-red-600 rounded text-white text-xs hover:bg-red-700 transition"
            aria-label={`Delete rejected request from ${request.userName}`}
          >
            Delete
          </button>
        )}
      </div>
    </motion.div>
  )
}

const MatchItem = ({ match }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
    >
      <div className="flex-1">
        <div className="font-medium text-white">
          vs {match.opponentName}
        </div>
        <div className="text-sm text-white/60">
          {new Date(match.date).toLocaleDateString()} at {new Date(match.date).toLocaleTimeString()}
        </div>
      </div>
      <div className="text-sm text-white/70">
        {match.location}
      </div>
    </motion.div>
  )
}

const QuickActionCard = ({ to, icon, title, description, color = "blue" }) => {
  const colors = {
    blue: "hover:from-blue-700 hover:to-blue-800 border-blue-500/30",
    green: "hover:from-green-700 hover:to-green-800 border-green-500/30",
    purple: "hover:from-purple-700 hover:to-purple-800 border-purple-500/30",
    amber: "hover:from-amber-700 hover:to-amber-800 border-amber-500/30"
  }

  return (
    <Link
      to={to}
      className={`block p-6 rounded-3xl bg-gradient-to-br from-brand-700 to-brand-800 border border-white/10 shadow-xl hover:scale-105 transition-all duration-300 ${colors[color]}`}
    >
      <div className="text-3xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <p className="text-white/70 text-sm">{description}</p>
    </Link>
  )
}

export default function AcademyDashboard({ session }) {
  const [requests, setRequests] = useState([])
  const [matches, setMatches] = useState([])
  const [stats, setStats] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function loadData() {
    try {
      // Check if academyId exists
      if (!session?.academyId) {
        console.error("No academyId found in session:", session)
        setError("Academy information is missing. Please contact an administrator to link your account to an academy.")
        setLoading(false)
        return
      }

      // Load player requests - the API returns { items, page, pages, total }
      const requestsResponse = await api(`/api/playerRequests/academy/${session.academyId}`)
      const requests = requestsResponse?.items || []

      // Load matches - the API returns an array directly
      const matches = await api("/api/matches/my")

      // Load analytics - the API returns { success: true, data: {...} }
      // but the api() function auto-unwraps it, so analyticsResponse is already the data
      const analytics = await api(`/api/academies/${session.academyId}/analytics`)

      setRequests(Array.isArray(requests) ? requests : [])
      setMatches(Array.isArray(matches) ? matches : [])
      setStats(analytics)
    } catch (err) {
      console.error("Failed to load academy data:", err)
      setError(err.message || "Failed to load academy data")
      setRequests([])
      setMatches([])
      setStats({})
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  async function handleDeleteRequest(id) {
    try {
      await api(`/api/playerRequests/academy/${session.academyId}/${id}`, {
        method: "DELETE",
      })
      setRequests((prev) => prev.filter((r) => r._id !== id))
      // Refresh data to update stats
      loadData()
    } catch (err) {
      console.error("Failed to delete request:", err)
      alert("⚠️ Failed to delete request")
    }
  }

  const pendingRequests = requests.filter(req => req.status === 'pending').length
  const totalPlayers = stats.playerCount || 0  // Use analytics API data
  const totalRequests = requests.length
  const upcomingMatches = matches.filter(match => 
    match.status === 'confirmed' || match.status === 'requested'
  ).length


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
              Academy Dashboard 👑
            </h1>
            <p className="text-white/80 text-lg">
              Welcome back, <span className="text-accent-400 font-semibold">{session?.academyName || 'Academy'}</span>.
              Here's your academy overview.
            </p>
          </div>
          <div className="text-6xl opacity-20">⚽</div>
        </div>
      </motion.div>

      {/* Error Message */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-red-600 to-red-700 rounded-3xl p-6 border border-red-500/30 shadow-xl"
        >
          <div className="flex items-center gap-4">
            <div className="text-4xl">⚠️</div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white mb-2">Configuration Required</h3>
              <p className="text-white/80">{error}</p>
              <p className="text-white/70 text-sm mt-2">
                To resolve this issue, please contact an administrator to properly link your academy account to an academy.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title="Total Players"
          value={totalPlayers}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={<UserPlus className="w-6 h-6" />}
          title="Pending Requests"
          value={pendingRequests}
          color="amber"
          loading={loading}
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          title="Upcoming Matches"
          value={upcomingMatches}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title="Total Requests"
          value={totalRequests}
          color="purple"
          loading={loading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Recent Requests */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-gradient-to-br from-brand-700 to-brand-800 rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Recent Requests</h2>
          <Link
            to="/academy/requests"
            className="text-accent-400 hover:text-accent-300 text-sm font-medium flex items-center gap-1"
          >
            View all <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
        
        {loading ? (
          <div className="space-y-3">
            <LoadingSkeleton lines={3} />
            <LoadingSkeleton lines={3} />
            <LoadingSkeleton lines={3} />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">📭</div>
            <p className="text-white/70">No requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.slice(0, 5).map((request, index) => (
              <RequestItem key={request._id || index} request={request} onDelete={handleDeleteRequest} />
            ))}
          </div>
        )}
      </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-6"
        >
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <div className="grid gap-4">
            <QuickActionCard
              to="/academy/players"
              icon="👥"
              title="Manage Players"
              description="View and manage academy players"
              color="blue"
            />
            <QuickActionCard
              to="/academy/matches"
              icon="⚽"
              title="Manage Matches"
              description="Organize and review upcoming matches"
              color="green"
            />
            <QuickActionCard
              to="/academy/requests"
              icon="📥"
              title="Manage Requests"
              description="Approve or reject player join requests"
              color="purple"
            />
            <QuickActionCard
              to="/academy/analysis"
              icon="📊"
              title="View Stats"
              description="Check academy statistics and performance"
              color="amber"
            />
          </div>
        </motion.div>
      </div>

      {/* Academy Status */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Academy Status</h3>
            <p className="text-white/70">All systems operational</p>
          </div>
          <div className="flex items-center gap-2 text-green-400">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium">Active</span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
