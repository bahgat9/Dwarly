// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { api } from "../../api"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import { Users, Building, Trophy, Clock, ArrowUpRight, CheckCircle, XCircle, Clock as PendingIcon } from "lucide-react"
import { motion } from "framer-motion"
import { useLanguage } from "../../context/LanguageContext"

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

const RequestItem = ({ request }) => {
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
          {request.userName} → {request.academyName}
        </div>
        <div className="text-sm text-white/60">
          {new Date(request.createdAt).toLocaleDateString()}
        </div>
      </div>
      <div className={`flex items-center gap-2 text-sm font-medium ${statusColors[request.status]}`}>
        {statusIcons[request.status]}
        <span className="capitalize">{request.status}</span>
      </div>
    </motion.div>
  )
}

const QuickLinkCard = ({ to, icon, title, description, color = "blue" }) => {
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

export default function AdminDashboard({ session }) {
  const { t } = useLanguage()
  const [stats, setStats] = useState({})
  const [latestRequests, setLatestRequests] = useState([])
  const [loading, setLoading] = useState(true)

  async function loadData() {
    try {
      const s = await api("/api/admin/stats")
      const r = await api("/api/playerRequests/admin")
      setStats(s || {})
      setLatestRequests(r || [])
    } catch (err) {
      console.error("Failed to load admin data:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

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
            {t("admin.dashboard")} 👑
          </h1>
          <p className="text-white/80 text-lg">
            {t("admin.welcomeBack")}, <span className="text-accent-400 font-semibold">{session?.name}</span>. 
            {t("admin.platformOverview")}
          </p>
        </div>
          <div className="text-6xl opacity-20">⚽</div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={<Users className="w-6 h-6" />}
          title={t("admin.totalUsers")}
          value={stats.users}
          color="blue"
          loading={loading}
        />
        <StatCard
          icon={<Building className="w-6 h-6" />}
          title={t("admin.totalAcademies")}
          value={stats.academies}
          color="green"
          loading={loading}
        />
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          title={t("admin.totalMatches")}
          value={stats.matches}
          color="purple"
          loading={loading}
        />
        <StatCard
          icon={<Clock className="w-6 h-6" />}
          title={t("admin.pendingRequests")}
          value={stats.playerRequests}
          color="amber"
          loading={loading}
        />
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Latest Requests */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-brand-700 to-brand-800 rounded-3xl p-6 border border-white/10 shadow-xl"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">{t("admin.recentRequests")}</h2>
            <Link
              to="/admin/requests"
              className="text-accent-400 hover:text-accent-300 text-sm font-medium flex items-center gap-1"
            >
              {t("admin.viewAll")} <ArrowUpRight className="w-4 h-4" />
            </Link>
          </div>
          
          {loading ? (
            <div className="space-y-3">
              <LoadingSkeleton lines={3} />
              <LoadingSkeleton lines={3} />
              <LoadingSkeleton lines={3} />
            </div>
          ) : latestRequests.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">📭</div>
              <p className="text-white/70">{t("admin.noRequestsYet")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {latestRequests.slice(0, 5).map((request, index) => (
                <RequestItem key={request._id || index} request={request} />
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
          <h2 className="text-xl font-semibold text-white mb-4">{t("admin.quickActions")}</h2>
          <div className="grid gap-4 md:grid-cols-2">
            <QuickLinkCard
              to="/admin/academies"
              icon="🏫"
              title={t("admin.manageAcademies")}
              description={t("admin.manageAcademiesDesc")}
              color="green"
            />
            <QuickLinkCard
              to="/admin/matches"
              icon="⚽"
              title={t("admin.manageMatches")}
              description={t("admin.manageMatchesDesc")}
              color="blue"
            />
            <QuickLinkCard
              to="/admin/requests"
              icon="📥"
              title={t("admin.manageRequests")}
              description={t("admin.manageRequestsDesc")}
              color="purple"
            />
            <QuickLinkCard
              to="/admin/users"
              icon="👥"
              title={t("admin.manageUsers")}
              description={t("admin.manageUsersDesc")}
              color="amber"
            />
          </div>
        </motion.div>
      </div>

      {/* Platform Status */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-brand-700 to-brand-800 rounded-3xl p-6 border border-white/10 shadow-xl"
      >
        <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white mb-2">{t("admin.platformStatus")}</h3>
          <p className="text-white/70">{t("admin.allSystemsOperational")}</p>
        </div>
        <div className="flex items-center gap-2 text-green-400">
          <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">{t("admin.online")}</span>
        </div>
        </div>
      </motion.div>
    </div>
  )
}
