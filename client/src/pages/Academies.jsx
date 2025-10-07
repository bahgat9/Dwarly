// src/pages/Academies.jsx
import React, { useEffect, useState } from 'react'
import { MapPin, Phone, Plus, Star, Trash, Clock, RefreshCw } from 'lucide-react'
import AcademyMap from '../components/AcademyMap.jsx'
import LocationPicker from '../components/LocationPicker.jsx'
import { api } from '../api'
import JoinRequestModal from '../components/JoinRequestModal.jsx'
import { useLanguage } from '../context/LanguageContext'

// ---------- Helpers ----------
function isLatLng(obj) {
  return obj && typeof obj === 'object' && 'lat' in obj && 'lng' in obj
}
function toLatLng(obj) {
  if (!obj) return null
  if (isLatLng(obj)) return { lat: Number(obj.lat), lng: Number(obj.lng) }
  if (typeof obj === 'string') {
    // Try JSON first
    try {
      const parsed = JSON.parse(obj)
      if (isLatLng(parsed)) return { lat: Number(parsed.lat), lng: Number(parsed.lng) }
    } catch (_) { }
    // Try "lat, lng" pattern
    const m = obj.match(/(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)/)
    if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[3]) }
  }
  return null
}
function normalizeAcademy(a) {
  const out = { ...a }
  // Prefer locationGeo if present; else try location (JSON, "lat,lng" or object)
  const geo = toLatLng(a.locationGeo) || toLatLng(a.location)
  if (geo) {
    out.location = geo
    out.locationGeo = geo
  }
  if (a.locationDescription) out.locationDescription = a.locationDescription
  return out
}
function locationToText(loc) {
  if (typeof loc === 'string') return loc
  if (isLatLng(loc)) return `${loc.lat}, ${loc.lng}`
  return ''
}
// What to feed into <AcademyMap query={...} />
function getMapQuery(a) {
  // 1) exact coords (best)  2) description  3) any location string  4) name
  const fromLocation = toLatLng(a.location) || toLatLng(a.locationGeo)
  return fromLocation || a.locationDescription || a.location || a.name
}

// ---------- Star Rating ----------
const StarRating = ({ value = 0, onChange, readOnly = false }) => {
  const stars = [1, 2, 3, 4, 5]
  const rounded = Math.round(value * 2) / 2
  return (
    <div className="flex items-center gap-1">
      {stars.map((s, i) => {
        const full = rounded >= s
        const half = !full && rounded + 0.5 >= s
        return (
          <button
            key={i}
            disabled={readOnly}
            onClick={() => onChange && onChange(s)}
            className={`disabled:cursor-default ${!readOnly ? 'hover:scale-105' : ''} transition`}
            type="button"
          >
            <Star
              className={`${full ? 'fill-accent-500 stroke-accent-500' : half ? 'fill-accent-500/60 stroke-accent-500' : 'stroke-white'}`}
              size={18}
            />
          </button>
        )
      })}
      <span className="text-xs text-white/70 ml-1">{Number(value || 0).toFixed(1)}</span>
    </div>
  )
}

// ---------- Page ----------
export default function Academies({ session, adminMode = false }) {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [query, setQuery] = useState('')
  const [adding, setAdding] = useState(false)
  const [form, setForm] = useState({
    name: '',
    nameAr: '',
    location: '',
    locationDescription: '',
    phone: '',
    rating: 4,
    offersGirls: false,
    offersBoys: false,
    subscriptionPrice: '',
    trainingTimes: []
  })
  const [selected, setSelected] = useState(null)
  const [newTraining, setNewTraining] = useState({ day: '', time: '' })
  const [joining, setJoining] = useState(false)
  const [requestStatus, setRequestStatus] = useState(null)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [joinForm, setJoinForm] = useState({
    userName: '',
    age: '',
    position: '',
    message: ''
  })
  // Branch slider state for details modal
  const [branchIndex, setBranchIndex] = useState(0)
  const branchTouchStartXRef = React.useRef(null)

  async function loadRequestStatus() {
    if (!selected || !session || session.role !== 'user') {
      setRequestStatus(null)
      return
    }
    // Add cache buster to avoid 304 Not Modified
    const requests = await api('/api/academy-requests/mine?cb=' + Date.now())
    // Match by academy id for reliability
    const req = requests.find(r => String(r.academy) === String(selected._id))
    // If no request found, but status is 'pending', keep it 'pending' (POST succeeded but DB not updated yet)
    if (!req && requestStatus === 'pending') {
      return
    }
    // Fix: Only update state if different to avoid flicker
    if (req && req.status !== requestStatus) {
      setRequestStatus(req.status)
    } else if (!req && requestStatus !== null) {
      setRequestStatus(null)
    }
  }

  // Poll request status every 3 seconds for better responsiveness
  React.useEffect(() => {
    if (session?.role === 'user' && selected) {
      const interval = setInterval(() => {
        loadRequestStatus()
      }, 3000)
      return () => clearInterval(interval)
    }
  }, [selected, session])
  
  // Also reload on window focus
  React.useEffect(() => {
    function onFocus() {
      if (session?.role === 'user' && selected) {
        loadRequestStatus()
      }
    }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [selected, session])

  async function handleJoin() {
    setShowJoinModal(true)
  }

  async function submitJoin() {
    if (!selected) return
    setJoining(true)
    try {
      const created = await api(`/api/academies/${selected._id}/requests`, {
        method: "POST",
        body: JSON.stringify(joinForm),
      })
      setRequestStatus(created?.status || 'pending') // Use status from response or fallback to pending
      alert(t("academies.joinRequestSent"))
      setShowJoinModal(false)
      setJoinForm({ userName: '', age: '', position: '', message: '' })
    } catch (err) {
      console.error("Failed to send join request:", err)
      alert(t("academies.joinRequestFailed"))
    } finally {
      setJoining(false)
    }
  }

  // Load academies
  async function load() {
    const data = await api('/api/academies')
    setList(data.map(normalizeAcademy))
  }
  useEffect(() => { load() }, [])

  // Load request status when selected changes
  useEffect(() => { loadRequestStatus() }, [selected])

  // Reset/choose branch when a card is opened
  useEffect(() => {
    if (!selected || !Array.isArray(selected.branches)) return
    const mainIdx = selected.branches.findIndex(b => b.isMain)
    setBranchIndex(mainIdx >= 0 ? mainIdx : 0)
  }, [selected])

  // Add academy
  async function add() {
    const geo = isLatLng(form.location) ? form.location : toLatLng(form.location)
    const body = {
      ...form,
      subscriptionPrice: Number(form.subscriptionPrice) || 0,
      // Persist both for fwd/back compat
      location: geo ? JSON.stringify(geo) : (form.location || ''),
      locationGeo: geo || undefined,
      locationDescription: form.locationDescription || ''
    }
    const created = await api('/api/academies', { method: 'POST', body: JSON.stringify(body) })
    setList(prev => [normalizeAcademy(created), ...prev])
    setAdding(false)
    setForm({
      name: '', nameAr: '', location: '', locationDescription: '', phone: '',
      rating: 4, offersGirls: false, offersBoys: false, subscriptionPrice: '', trainingTimes: []
    })
  }

  // Edit rating (adminMode only)
  async function rate(id, rating) {
    if (!adminMode) return
    const updated = await api('/api/academies/' + id, { method: 'PATCH', body: JSON.stringify({ rating }) })
    setList(prev => prev.map(a => a._id === id ? normalizeAcademy(updated) : a))
  }

  // Delete (adminMode only)
  async function remove(id) {
    if (!adminMode) return
    if (!window.confirm(t("academies.deleteConfirm"))) return
    await api('/api/academies/' + id, { method: 'DELETE' })
    setList(prev => prev.filter(a => a._id !== id))
    if (selected?._id === id) setSelected(null)
  }

  // Training times
  function addTrainingTime() {
    if (!newTraining.day || !newTraining.time) return
    setForm({ ...form, trainingTimes: [...form.trainingTimes, newTraining] })
    setNewTraining({ day: '', time: '' })
  }
  function removeTrainingTime(i) {
    setForm({ ...form, trainingTimes: form.trainingTimes.filter((_, idx) => idx !== i) })
  }

  const filtered = list.filter(a => {
    const text = [
      a.name || '',
      a.nameAr || '',
      locationToText(a.location),
      a.locationDescription || ''
    ].join(' ').toLowerCase()
    return text.includes(query.toLowerCase())
  })

  const canEdit = session?.role === 'admin'

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-3xl font-extrabold text-white">{t("academies.title")}</h2>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t("academies.search")}
            className="px-3 py-2 rounded-xl bg-white/10 text-white placeholder-white/60 border border-white/10 focus:outline-none"
          />
          {canEdit && (
            <button
              onClick={() => setAdding(true)}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold shadow"
              type="button"
            >
              <Plus size={16} />{t("academies.add")}
            </button>
          )}
        </div>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
        {filtered.map(a => (
          <div
            key={a._id}
            onClick={() => setSelected(a)}
            className="rounded-2xl p-5 bg-brand-900/50 border border-white/10 text-white shadow-lg hover:border-accent-500/30 transition cursor-pointer"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                {a.logo && (
                  <img
                    src={a.logo}
                    alt={`${a.name} logo`}
                    className="w-14 h-14 rounded-xl object-cover border border-white/10"
                  />
                )}
                <div>
                  <div className="text-xl font-bold">{a.name}</div>
                  <div className="text-sm opacity-80">{a.nameAr}</div>
                </div>
              </div>
              {a.verified && (
                <span className="px-2 py-1 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-400/30">
                  {t("academies.verified")}
                </span>
              )}
            </div>

            {/* Branch preview + count */}
            {(() => {
              const mainBranch = (a.branches || []).find(b => b.isMain) || (a.branches || [])[0]
              const hasBranches = Array.isArray(a.branches) && a.branches.length > 0
              const locationText = mainBranch?.locationDescription
                || (mainBranch?.locationGeo ? `${mainBranch.locationGeo.lat}, ${mainBranch.locationGeo.lng}` : null)
              return (
                <div className="mt-3 text-sm opacity-90 flex items-center justify-between gap-2">
                  <div className="truncate">
                    {hasBranches ? (
                      <>
                        <span className="mr-1">📍</span>
                        <span className="truncate inline-block align-middle max-w-[14rem]">
                          {locationText || a.locationDescription || (typeof a.location === 'object' ? `${a.location.lat}, ${a.location.lng}` : a.location) || "—"}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="mr-1">📍</span>
                        <span className="truncate inline-block align-middle max-w-[14rem]">
                          {a.locationDescription || (typeof a.location === 'object' ? `${a.location.lat}, ${a.location.lng}` : a.location) || "—"}
                        </span>
                      </>
                    )}
                  </div>
                  {hasBranches && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/20">
                      {a.branches.length} branches
                    </span>
                  )}
                </div>
              )
            })()}

            {/* Rating */}
            <div className="mt-3 flex items-center gap-1">
              <span>⭐</span>
              {Array.from({ length: 4 }).map((_, i) => (
                <span key={i}>{i < (a.rating || 0) ? "⭐" : "☆"}</span>
              ))}
              <span className="text-sm opacity-80 ml-1">{Number(a.rating || 0).toFixed(1)}</span>
            </div>

            {/* Location & Phone */}
            <div className="mt-3 text-sm opacity-90 flex flex-col gap-1">
              <div className="flex items-center gap-1">
                <span>📍</span>
                {a.locationDescription || locationToText(a.location) || "—"}
              </div>
              <div className="flex items-center gap-1">
                <span>☎</span>
                {a.phone || "—"}
              </div>
              {a.email && (
                <div className="flex items-center gap-1">
                  <span>✉</span>
                  {a.email}
                </div>
              )}
            </div>

            {/* Subscription Price */}
            <div className="mt-3 flex items-center justify-between">
              <div className="text-sm font-semibold">💰 {a.subscriptionPrice || 0} EGP</div>
            </div>

            {/* Girls/Boys */}
            <div className="mt-3 flex gap-2 flex-wrap">
              {a.offersGirls && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                  {t("academies.girls")}
                </span>
              )}
              {a.offersBoys && (
                <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                  {t("academies.boys")}
                </span>
              )}
            </div>

            {/* Ages */}
            {a.ages?.length > 0 && (
              <div className="mt-3 flex gap-2 flex-wrap">
                {a.ages.map((y, i) => (
                  <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-white/10 border border-white/20">
                    {y}
                  </span>
                ))}
              </div>
            )}

            {/* Training times preview */}
            {a.trainingTimes?.length > 0 && (
              <div className="mt-3 text-xs opacity-80">
                <div className="font-semibold mb-1">⏰ {t("academies.training")}:</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {a.trainingTimes.slice(0, 2).map((t, i) => (
                    <li key={i}>
                      {typeof t === "string" ? t : `${t.day} – ${t.time}`}
                    </li>
                  ))}
                  {a.trainingTimes.length > 2 && <li>+{a.trainingTimes.length - 2} {t("academies.more")}</li>}
                </ul>
              </div>
            )}

            {adminMode && (
              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={(e) => { e.stopPropagation(); remove(a._id) }}
                  className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm flex items-center gap-1 transition"
                >
                  🗑 {t("academies.delete")}
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add Modal */}
      {adding && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white text-brand-800 shadow p-6">
            <div className="text-xl font-bold mb-4">{t("academies.addAcademyModal")}</div>
            <div className="grid gap-3">
              {['name', 'nameAr', 'phone', 'locationDescription'].map(k => (
                <input
                  key={k}
                  value={form[k]}
                  onChange={e => setForm({ ...form, [k]: e.target.value })}
                  placeholder={k}
                  className="px-3 py-2 rounded-xl border border-brand-200"
                />
              ))}

              <label className="text-sm font-semibold">{t("academies.pickLocation")}</label>
              <LocationPicker onChange={(latlng) => setForm({ ...form, location: latlng })} />

              <label className="text-sm font-semibold">{t("academies.initialRating")}</label>
              <StarRating value={form.rating} onChange={(v) => setForm({ ...form, rating: v })} />

              <label className="text-sm font-semibold">{t("academies.groups")}</label>
              <div className="flex gap-3">
                <label><input type="checkbox" checked={form.offersGirls} onChange={e => setForm({ ...form, offersGirls: e.target.checked })} /> {t("academies.girls")}</label>
                <label><input type="checkbox" checked={form.offersBoys} onChange={e => setForm({ ...form, offersBoys: e.target.checked })} /> {t("academies.boys")}</label>
              </div>

              <label className="text-sm font-semibold">{t("academies.subscriptionPrice")}</label>
              <input
                type="number"
                value={form.subscriptionPrice}
                onChange={e => setForm({ ...form, subscriptionPrice: e.target.value })}
                className="px-3 py-2 rounded-xl border border-brand-200"
              />

              <label className="text-sm font-semibold">{t("academies.trainingTimes")}</label>
              <div className="flex gap-2">
                <input
                  placeholder={t("academies.day")}
                  value={newTraining.day}
                  onChange={e => setNewTraining({ ...newTraining, day: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-brand-200"
                />
                <input
                  placeholder={t("academies.time")}
                  value={newTraining.time}
                  onChange={e => setNewTraining({ ...newTraining, time: e.target.value })}
                  className="flex-1 px-3 py-2 rounded-xl border border-brand-200"
                />
                <button onClick={addTrainingTime} type="button" className="px-3 py-2 rounded-xl bg-brand-800 text-white">+</button>
              </div>
              <div className="space-y-1">
                {form.trainingTimes.map((t, i) => (
                  <div key={i} className="flex justify-between items-center bg-brand-100 px-2 py-1 rounded">
                    <span className="text-sm">{t.day}: {t.time}</span>
                    <Trash size={14} className="cursor-pointer" onClick={() => removeTrainingTime(i)} />
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setAdding(false)} className="px-4 py-2 rounded-xl bg-brand-100" type="button">{t("academies.cancel")}</button>
              <button onClick={add} className="px-4 py-2 rounded-xl bg-brand-800 text-white" type="button">{t("academies.save")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-3xl rounded-2xl bg-brand-900 text-white shadow-2xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4 mb-6">
              <div className="flex items-center gap-4">
                {selected.logo && (
                  <img
                    src={selected.logo}
                    alt={selected.name}
                    className="w-20 h-20 rounded-xl object-cover border border-white/10 shadow"
                  />
                )}
                <div>
                  <div className="text-2xl font-bold text-accent-500">{selected.name}</div>
                  <div className="opacity-80 text-sm">{selected.nameAr}</div>
                  {selected.verified && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-300 border border-green-400/30">
                      {t("academies.verified")}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                {session && session.role === 'user' && (
                  <>
                    <button
                      onClick={handleJoin}
                      disabled={joining || requestStatus === 'approved' || requestStatus === 'pending'}
                      className={`px-3 py-1.5 rounded-xl font-semibold transition disabled:opacity-50 ${requestStatus === 'approved'
                          ? 'bg-green-500 text-white'
                          : requestStatus === 'rejected'
                            ? 'bg-red-500 text-white'
                            : requestStatus === 'pending'
                              ? 'bg-yellow-500 text-black'
                              : 'bg-accent-500 hover:bg-accent-600 text-brand-900'
                        }`}
                      type="button"
                    >
                      {joining
                        ? t("academies.joining")
                        : requestStatus === 'approved'
                          ? t("academies.approved")
                          : requestStatus === 'rejected'
                            ? t("academies.rejected")
                            : requestStatus === 'pending'
                              ? t("academies.pending")
                              : t("academies.join")}
                    </button>
                    <button
                      onClick={loadRequestStatus}
                      className="px-2 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition"
                      type="button"
                      title={t("academies.refreshStatus")}
                    >
                      <RefreshCw size={16} />
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelected(null)}
                  className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition"
                  type="button"
                >
                  {t("academies.close")}
                </button>
              </div>
            </div>

            {/* Branch slider */}
            {Array.isArray(selected.branches) && selected.branches.length > 0 && (
              // Wrapper with side columns on desktop
              <div className="mb-6 grid md:grid-cols-[auto_1fr_auto] grid-cols-1 items-stretch gap-3">
                {/* Desktop left side button */}
                {selected.branches.length > 1 && (
                  <div className="hidden md:flex items-center justify-center">
                    <button
                      aria-label="Previous branch"
                      onClick={() => setBranchIndex(i => (i - 1 + selected.branches.length) % selected.branches.length)}
                      className="w-11 h-11 rounded-full bg-accent-500 text-brand-900 font-extrabold shadow ring-2 ring-white/40"
                    >◀</button>
                  </div>
                )}

                {/* Card container (mobile swipe) */}
                <div
                  className="rounded-xl border border-white/10 bg-brand-800/60 overflow-hidden relative min-h-[200px]"
                  onTouchStart={(e) => { branchTouchStartXRef.current = e.changedTouches[0].clientX }}
                  onTouchEnd={(e) => {
                    const startX = branchTouchStartXRef.current
                    if (startX == null) return
                    const endX = e.changedTouches[0].clientX
                    const dx = endX - startX
                    const threshold = 40
                    if (dx < -threshold) setBranchIndex(i => (i + 1) % selected.branches.length)
                    else if (dx > threshold) setBranchIndex(i => (i - 1 + selected.branches.length) % selected.branches.length)
                    branchTouchStartXRef.current = null
                  }}
                >
                  <div className="p-4">
                    <div className="text-lg font-semibold mb-1">{selected.branches[branchIndex]?.name || `Branch ${branchIndex + 1}`}</div>
                  <div className="text-white/80 mb-2">
                    📍 {selected.branches[branchIndex]?.locationDescription ||
                    (selected.branches[branchIndex]?.locationGeo
                      ? `${selected.branches[branchIndex].locationGeo.lat}, ${selected.branches[branchIndex].locationGeo.lng}`
                      : "—")}
                  </div>
                  {selected.branches[branchIndex]?.phone && (
                    <div className="text-white/80 mb-2">☎ {selected.branches[branchIndex].phone}</div>
                  )}
                  </div>
                  {/* Centered dots (both) */}
                  {selected.branches.length > 1 && (
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                      {selected.branches.map((_, i) => (
                        <span key={i} onClick={() => setBranchIndex(i)} className={`w-3 h-3 rounded-full cursor-pointer ${i === branchIndex ? 'bg-accent-500' : 'bg-white/40'}`} />
                      ))}
                    </div>
                  )}
                </div>

                {/* Desktop right side button */}
                {selected.branches.length > 1 && (
                  <div className="hidden md:flex items-center justify-center">
                    <button
                      aria-label="Next branch"
                      onClick={() => setBranchIndex(i => (i + 1) % selected.branches.length)}
                      className="w-11 h-11 rounded-full bg-accent-500 text-brand-900 font-extrabold shadow ring-2 ring-white/40"
                    >▶</button>
                  </div>
                )}

                {/* Mobile bottom separated buttons (not overlaying text) */}
                {selected.branches.length > 1 && (
                  <div className="md:hidden flex justify-center gap-3 mt-2">
                    <button
                      aria-label="Previous branch"
                      onClick={() => setBranchIndex(i => (i - 1 + selected.branches.length) % selected.branches.length)}
                      className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold shadow"
                    >Prev</button>
                    <button
                      aria-label="Next branch"
                      onClick={() => setBranchIndex(i => (i + 1) % selected.branches.length)}
                      className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold shadow"
                    >Next</button>
                  </div>
                )}
              </div>
            )}

            {/* Info Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Rating */}
              <div className="p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-2">⭐ {t("academies.rating")}</div>
                <div className="flex items-center gap-1 text-lg">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span key={i}>{i < (selected.rating || 0) ? "⭐" : "☆"}</span>
                  ))}
                  <span className="text-sm opacity-80 ml-2">
                    {Number(selected.rating || 0).toFixed(1)}
                  </span>
                </div>
              </div>

              {/* Subscription */}
              <div className="p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-2">💰 {t("academies.subscription")}</div>
                <div className="text-2xl font-bold text-accent-500">
                  {selected?.subscriptionPrice || 0} EGP
                </div>
              </div>

              {/* Groups */}
              <div className="p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-2">{t("academies.groups")}</div>
                <div className="flex gap-2 flex-wrap">
                  {selected?.offersGirls && (
                    <span className="px-3 py-1 rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                      {t("academies.girls")}
                    </span>
                  )}
                  {selected?.offersBoys && (
                    <span className="px-3 py-1 rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {t("academies.boys")}
                    </span>
                  )}
                </div>
              </div>

              {/* Contact - bind to current branch when available */}
              <div className="p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-2">{t("academies.contact")}</div>
                <div className="flex items-center gap-2 text-sm opacity-90">
                  <span>📍</span>
                  {(selected.branches?.[branchIndex]?.locationDescription)
                    || (selected.branches?.[branchIndex]?.locationGeo ? `${selected.branches[branchIndex].locationGeo.lat}, ${selected.branches[branchIndex].locationGeo.lng}` : null)
                    || selected.locationDescription || locationToText(selected.location) || "—"}
                </div>
                <div className="flex items-center gap-2 text-sm opacity-90 mt-2">
                  <span>☎</span>
                  {selected.branches?.[branchIndex]?.phone || selected.phone || "—"}
                </div>
                {selected.email && (
                  <div className="flex items-center gap-2 text-sm opacity-90 mt-2">
                    <span>✉</span>
                    {selected.email}
                  </div>
                )}
              </div>
            </div>

            {/* Map */}
            <div className="mb-6 p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-2">📍 {t("academies.location")}</div>
              {(() => {
                const branch = selected.branches?.[branchIndex]
                const branchGeo = toLatLng(branch?.locationGeo) || toLatLng(branch?.location)
                const mapKey = `map-${selected._id}-${branchIndex}-${branchGeo?.lat ?? ''}-${branchGeo?.lng ?? ''}-${branch?.locationDescription ?? ''}`
                return (
                  <AcademyMap
                    key={mapKey}
                    query={branchGeo || branch?.locationDescription || getMapQuery(selected)}
                    height={300}
                  />
                )
              })()}
            </div>

            {/* Training Times */}
            {(selected.branches?.[branchIndex]?.trainingTimes?.length > 0 || selected?.trainingTimes?.length > 0) && (
              <div className="p-4 rounded-xl bg-brand-800/60 border border-white/10">
                <div className="font-semibold mb-3">{t("academies.trainingTimes")}</div>
                <ul className="space-y-2">
                  {(selected.branches?.[branchIndex]?.trainingTimes || selected.trainingTimes || []).map((t, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm opacity-90">
                      <span>⏰</span>
                      {typeof t === "string" ? t : `${t.day}: ${t.time}`}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Join Request Modal */}
      {showJoinModal && (
        <JoinRequestModal
          academyName={selected?.name}
          form={joinForm}
          setForm={setJoinForm}
          onCancel={() => setShowJoinModal(false)}
          onSubmit={submitJoin}
          submitting={joining}
        />
      )}
    </div>
  )
}
