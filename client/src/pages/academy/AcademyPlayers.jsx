// src/pages/academy/AcademyPlayers.jsx
import React, { useEffect, useMemo, useState } from "react"
import { api } from "../../api"
import Pagination from "../../components/Pagination.jsx"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import {
  UserPlus,
  Users,
  Trash2,
  Search,
  RefreshCw,
  Filter,
  X,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { useLanguage } from "../../context/LanguageContext"

/**
 * Attractive, modern AcademyPlayers page
 * - Hero with animated stats
 * - Floating "Add Player" modal (supports optional avatar upload)
 * - Avatar initials w/ deterministic gradient fallback
 * - Position badges and filters
 * - Animated cards
 *
 * Notes:
 * - Uses existing `api()` client (supports FormData automatically)
 * - Keep server route /api/academies/:id/players (POST accepts normal JSON or multipart)
 */

function initialsFromName(name = "") {
  return ("" + name)
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase() || "")
    .join("")
}

function colorForName(name = "") {
  // deterministic-ish texture colors for avatars
  const hues = [220, 260, 300, 200, 180, 140, 20, 40, 10, 330]
  const n = ("" + name).split("").reduce((s, c) => s + c.charCodeAt(0), 0)
  const hue = hues[n % hues.length]
  return `linear-gradient(135deg,hsl(${hue} 80% 55%), hsl(${(hue + 40) % 360} 70% 45%))`
}

function PositionBadge({ pos }) {
  if (!pos) return null
  const map = {
    Forward: "bg-emerald-700/20 text-emerald-300",
    Midfielder: "bg-sky-700/20 text-sky-300",
    Defender: "bg-violet-700/20 text-violet-300",
    Goalkeeper: "bg-amber-700/20 text-amber-300",
  }
  const cls = map[pos] || "bg-gray-600/20 text-gray-300"
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${cls}`}>
      {pos}
    </span>
  )
}

export default function AcademyPlayers({ session }) {
  const { t } = useLanguage()
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pages, setPages] = useState(1)
  const [total, setTotal] = useState(0)

  // UI state
  const [query, setQuery] = useState("")
  const [positionFilter, setPositionFilter] = useState("")
  const [modalOpen, setModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarPreview, setAvatarPreview] = useState(null)

  // Form in modal
  const [form, setForm] = useState({ name: "", age: "", position: "" })

  // Derived stats
  const stats = useMemo(() => {
    const byPos = players.reduce((acc, p) => {
      const key = p.position || "Unknown"
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    const avgAge =
      players.length === 0
        ? 0
        : Math.round(
            (players.reduce((s, p) => s + (parseInt(p.age) || 0), 0) / players.length) * 10
          ) / 10
    return { byPos, avgAge, total: total || players.length }
  }, [players, total])

  // Load players
  async function loadPlayers(p = 1) {
    if (!session?.academyId) return
    try {
      setLoading(true)
      setError("")
      const data = await api(
        `/api/academies/${session.academyId}/players?page=${p}&limit=6`
      )
      // Support both envelope and plain
      const items = data.items || data
      setPlayers(items || [])
      setPages(data.pages || 1)
      setPage(data.page || p)
      setTotal(data.total ?? (data.pagination?.total) ?? (Array.isArray(items) ? items.length : 0))
    } catch (err) {
      console.error("Failed to load players:", err)
      setError("Failed to load players.")
    } finally {
      setLoading(false)
    }
  }

  // handle avatar preview
  useEffect(() => {
    if (!avatarFile) {
      setAvatarPreview(null)
      return
    }
    const url = URL.createObjectURL(avatarFile)
    setAvatarPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [avatarFile])

  useEffect(() => {
    // initial load when session is available
    if (session?.academyId) loadPlayers(1)
  }, [session?.academyId])

  // Create player: supports optional avatar upload (FormData) or JSON fallback
  async function addPlayer(e) {
    e?.preventDefault?.()
    setError("")
    if (!form.name?.trim()) {
      setError(t("academy.pleaseProvideName"))
      return
    }
    setSubmitting(true)
    try {
      // Use FormData when file provided
      if (avatarFile) {
        const fd = new FormData()
        fd.append("name", form.name.trim())
        if (form.age) fd.append("age", form.age)
        if (form.position) fd.append("position", form.position)
        fd.append("avatar", avatarFile)
        await api(`/api/academies/${session.academyId}/players`, {
          method: "POST",
          body: fd,
        })
      } else {
        await api(`/api/academies/${session.academyId}/players`, {
          method: "POST",
          body: JSON.stringify({
            name: form.name.trim(),
            age: form.age || undefined,
            position: form.position || undefined,
          }),
        })
      }
      // close modal with nice delay
      setModalOpen(false)
      setAvatarFile(null)
      setAvatarPreview(null)
      setForm({ name: "", age: "", position: "" })
      await loadPlayers(1)
    } catch (err) {
      console.error("Failed to add player:", err)
      setError(err?.message || t("academy.failedToAddPlayer"))
    } finally {
      setSubmitting(false)
    }
  }

  async function doRemovePlayer(id) {
    if (!window.confirm(t("academy.deletePlayerConfirm"))) return
    try {
      await api(`/api/academies/${session.academyId}/players/${id}`, { method: "DELETE" })
      // small optimistic UX: remove immediately without reload
      setPlayers((s) => s.filter((p) => p._id !== id))
      setTotal((t) => Math.max(0, t - 1))
      // ensure list still consistent
      // reload current page to refresh pagination where needed
      await loadPlayers(page)
    } catch (err) {
      console.error("Failed to remove player:", err)
      setError(t("academy.couldNotRemovePlayer"))
    }
  }

  // Filters: apply search & position filter
  const filtered = useMemo(() => {
    const q = (query || "").trim().toLowerCase()
    return players.filter((p) => {
      if (positionFilter && p.position !== positionFilter) return false
      if (!q) return true
      return (
        (p.name || "").toLowerCase().includes(q) ||
        (p.position || "").toLowerCase().includes(q)
      )
    })
  }, [players, query, positionFilter])

  // positions list (from players)
  const positions = useMemo(() => {
    const set = new Set(players.map((p) => p.position).filter(Boolean))
    return Array.from(set)
  }, [players])

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      {/* HERO */}
      <div className="relative rounded-3xl overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(600px 200px at -10% 0%, rgba(255,255,255,0.04), transparent), linear-gradient(90deg, rgba(79,70,229,0.12), rgba(99,102,241,0.08))",
            backdropFilter: "blur(6px)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 bg-gradient-to-r from-indigo-700 via-violet-600 to-pink-600 p-8 rounded-3xl text-white shadow-2xl"
        >
          <div className="flex items-start justify-between gap-6">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">{t("academy.players")}</h1>
              <p className="mt-2 text-white/80 max-w-xl">
                {t("academy.managePlayersDesc")} — {t("academy.managePlayers")}, upload avatars, filter and analyze.
              </p>
              <div className="mt-4 flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center gap-3 bg-white/6 px-4 py-3 rounded-xl border border-white/10">
                    <Users className="w-6 h-6 text-white/90" />
                    <div>
                      <div className="text-2xl font-semibold">{stats.total}</div>
                      <div className="text-xs text-white/70">{t("academy.totalPlayers")}</div>
                    </div>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                >
                  <div className="flex items-center gap-3 bg-white/6 px-4 py-3 rounded-xl border border-white/10">
                    <div className="text-2xl font-semibold">{stats.avgAge || "—"}</div>
                    <div className="text-xs text-white/70">{t("academy.avgAge")}</div>
                  </div>
                </motion.div>

                <motion.button
                  onClick={() => {
                    setModalOpen(true)
                    setError("")
                  }}
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  className="ml-4 inline-flex items-center gap-2 bg-white/10 hover:bg-white/12 text-white px-4 py-2 rounded-xl border border-white/20"
                >
                  <UserPlus className="w-4 h-4" /> {t("academy.addPlayer")}
                </motion.button>
              </div>
            </div>

            {/* quick search & filters */}
            <div className="w-80">
              <div className="flex items-center gap-2 bg-white/6 p-2 rounded-xl border border-white/10">
                <Search className="w-4 h-4 text-white/80" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder={t("academy.searchPlayers")}
                  className="bg-transparent outline-none text-white placeholder-white/60 w-full"
                />
                <button
                  title="Refresh"
                  onClick={() => loadPlayers(1)}
                  className="p-1 rounded hover:bg-white/8"
                >
                  <RefreshCw className="w-4 h-4 text-white/80" />
                </button>
              </div>

              <div className="mt-3 flex gap-2 items-center">
                <div className="flex items-center gap-2 bg-white/6 px-3 py-2 rounded-xl border border-white/10 w-full">
                  <Filter className="w-4 h-4 text-white/80" />
                  <select
                    value={positionFilter}
                    onChange={(e) => setPositionFilter(e.target.value)}
                    className="bg-transparent outline-none text-white w-full appearance-none cursor-pointer"
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-gray-800 text-white">{t("academy.filterAllPositions")}</option>
                    {positions.map((pos) => (
                      <option key={pos} value={pos} className="bg-gray-800 text-white">
                        {pos}
                      </option>
                    ))}
                  </select>
                </div>

                {positionFilter && (
                  <button
                    onClick={() => setPositionFilter("")}
                    className="p-2 rounded-xl bg-white/6 text-white"
                    title={t("academy.clearFilter")}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* MAIN GRID */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6">
        {/* Left column: mini analytics */}
        <aside className="space-y-4">
          <div className="bg-white/5 rounded-2xl p-4 shadow border border-white/6">
            <h3 className="text-sm text-white/80 font-semibold">{t("academy.positionBreakdown")}</h3>
            <div className="mt-3 space-y-2">
              {Object.entries(stats.byPos).length === 0 && (
                <div className="text-sm text-white/60">{t("academy.noDataYet")}</div>
              )}
              {Object.entries(stats.byPos).map(([pos, count]) => (
                <div key={pos} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-6 rounded-full" style={{
                      background: pos === "Forward" ? "linear-gradient(90deg,#10b981,#34d399)"
                        : pos === "Midfielder" ? "linear-gradient(90deg,#0ea5e9,#60a5fa)"
                        : pos === "Defender" ? "linear-gradient(90deg,#8b5cf6,#a78bfa)"
                        : pos === "Goalkeeper" ? "linear-gradient(90deg,#f59e0b,#fbbf24)"
                        : "linear-gradient(90deg,#94a3b8,#cbd5e1)"
                    }} />
                    <div className="text-sm text-white/90">{pos}</div>
                  </div>
                  <div className="text-sm text-white/70">{count}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl p-4 shadow border border-white/6">
            <h3 className="text-sm text-white/80 font-semibold">{t("academy.quickActions")}</h3>
            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={() => {
                  setModalOpen(true)
                  setError("")
                }}
                className="w-full py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-600 text-white font-semibold"
              >
                <span className="inline-flex items-center gap-2"><UserPlus className="w-4 h-4" /> {t("academy.addPlayer")}</span>
              </button>
              <button
                onClick={() => {
                  loadPlayers(1)
                }}
                className="w-full py-2 rounded-xl bg-white/6 text-white"
              >
                <span className="inline-flex items-center gap-2"><RefreshCw className="w-4 h-4" /> {t("academy.refresh")}</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Right column: players list */}
        <main>
          {loading ? (
            <LoadingSkeleton rows={6} />
          ) : filtered.length === 0 ? (
            <div className="rounded-2xl p-8 bg-white/5 text-white/70">{t("academy.noPlayersFound")}</div>
          ) : (
            <>
              <div className="grid gap-4 sm:grid-cols-2">
                <AnimatePresence>
                  {filtered.map((p) => (
                    <motion.div
                      layout
                      key={p._id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      transition={{ duration: 0.28 }}
                      className="bg-gradient-to-b from-white/3 to-white/2 p-4 rounded-2xl flex items-center justify-between shadow hover:scale-[1.01] transition"
                    >
                      <div className="flex items-center gap-4">
                        {/* Avatar: uploaded URL or initials with gradient */}
                        <div
                          className="w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-lg shadow"
                          style={{
                            backgroundImage: p.avatar
                              ? `url(${p.avatar})`
                              : colorForName(p.name),
                            backgroundSize: "cover",
                          }}
                        >
                          {!p.avatar && <span>{initialsFromName(p.name)}</span>}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <div className="text-lg font-semibold text-white">{p.name}</div>
                            <div className="text-xs text-white/60">#{p._id?.slice(-4)}</div>
                          </div>
                          <div className="mt-1 flex items-center gap-3">
                            <div className="text-sm text-white/60">{p.age ? `Age ${p.age}` : "Age —"}</div>
                            <div>{<PositionBadge pos={p.position} />}</div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => doRemovePlayer(p._id)}
                          className="p-2 rounded-xl hover:bg-red-500/10 text-red-400"
                          title={t("academy.deletePlayer")}
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Pagination */}
              <div className="mt-6">
                <Pagination page={page} pages={pages} onPageChange={loadPlayers} />
              </div>
            </>
          )}
        </main>
      </div>

      {/* Modal - Add Player */}
      <AnimatePresence>
        {modalOpen && (
          <motion.dialog
            open
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-0"
            style={{ backdropFilter: "blur(6px)" }}
          >
            {/* Removed the gray border overlay */}
            {/* <div className="absolute inset-0 bg-black/40" onClick={() => setModalOpen(false)} /> */}
            {/* Also removing any default white background or border from the dialog */}
            <motion.div
              initial={{ y: 8, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 8, opacity: 0 }}
              className="relative z-10 max-w-xl w-full rounded-2xl p-6 shadow-2xl"
              style={{
                border: "none",
                background: "linear-gradient(135deg, #022357ff 0%, #052493ff 100%)",
                color: "white"
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">{t("academy.addNewPlayer")}</h3>
                <button onClick={() => setModalOpen(false)} className="p-2 rounded hover:bg-white/6">
                  <X className="w-4 h-4 text-white/70" />
                </button>
              </div>

              {error && <div className="text-sm text-red-400 mb-2">{error}</div>}

              <form onSubmit={addPlayer} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <input
                    className="col-span-2 px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/60 focus:bg-white/10 focus:border-white/50 transition-all"
                    placeholder={t("academy.fullName")}
                    value={form.name}
                    onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                    required
                  />
                  <input
                    className="px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white placeholder-white/60 focus:bg-white/10 focus:border-white/50 transition-all"
                    placeholder={t("academy.age")}
                    type="number"
                    min={4}
                    max={99}
                    value={form.age}
                    onChange={(e) => setForm((s) => ({ ...s, age: e.target.value }))}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    className="px-4 py-3 rounded-xl bg-transparent border border-white/30 text-white focus:bg-white/10 focus:border-white/50 transition-all appearance-none cursor-pointer"
                    value={form.position}
                    onChange={(e) => setForm((s) => ({ ...s, position: e.target.value }))}
                    style={{ colorScheme: 'dark' }}
                  >
                    <option value="" className="bg-gray-800 text-white">{t("academy.selectPosition")}</option>
                    <option className="bg-gray-800 text-white">{t("academy.forward")}</option>
                    <option className="bg-gray-800 text-white">{t("academy.midfielder")}</option>
                    <option className="bg-gray-800 text-white">{t("academy.defender")}</option>
                    <option className="bg-gray-800 text-white">{t("academy.goalkeeper")}</option>
                    <option className="bg-gray-800 text-white">{t("academy.other")}</option>
                  </select>

                  <label className="flex items-center gap-3 p-3 border border-white/30 rounded-xl cursor-pointer bg-transparent hover:bg-white/10 transition-all">
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0] || null
                        setAvatarFile(f)
                      }}
                    />
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-white/80 border-2 border-white/30">
                      {avatarPreview ? <img src={avatarPreview} alt="preview" className="w-full h-full object-cover" /> : <div className="text-sm font-semibold">IMG</div>}
                    </div>
                    <div className="text-sm text-white/90 font-medium">{t("academy.uploadAvatar")}</div>
                  </label>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setModalOpen(false)
                    }}
                    className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium transition-all border border-white/20"
                  >
                    {t("common.cancel")}
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`px-6 py-3 rounded-xl text-white font-semibold transition-all ${
                      submitting 
                        ? "bg-white/20 cursor-not-allowed" 
                        : "bg-gradient-to-r from-white/20 to-white/10 hover:from-white/30 hover:to-white/20 border border-white/30"
                    }`}
                  >
                    {submitting ? t("academy.saving") : t("academy.savePlayer")}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.dialog>
        )}
      </AnimatePresence>
    </div>
  )
}
