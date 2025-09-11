// client/src/pages/Matches.js

import React, { useEffect, useState } from 'react'
import { Calendar, Users, CheckCircle } from 'lucide-react'
import LocationPicker from '../components/LocationPicker.jsx'
import AcademyMap from '../components/AcademyMap.jsx'
import { motion, AnimatePresence } from 'framer-motion'
import { api } from '../api'
import { useLanguage } from '../context/LanguageContext'

export default function Matches({ session }) {
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [ageGroups, setAgeGroups] = useState([])

  const [form, setForm] = useState({
    birthYear: null,
    date: '',
    time: '18:00',
    homeAway: 'home',
    location: null
  })

  // Load all matches
  async function load() {
    const data = await api('/api/matches')
    setList(Array.isArray(data) ? data : [])
  }

  // Load available age groups dynamically
  async function loadAgeGroups() {
    const years = await api('/api/matches/age-groups')
    const sorted = Array.isArray(years) ? years.sort((a, b) => b - a) : []
    setAgeGroups(sorted)
    // Set default if not chosen yet
    if (sorted.length > 0 && !form.birthYear) {
      setForm(prev => ({ ...prev, birthYear: sorted[0] }))
    }
  }

  useEffect(() => {
    load()
    loadAgeGroups()
  }, [])

  async function create() {
    if (!session || session.role !== 'academy') {
      alert(t("matches.onlyAcademyAccounts"))
      return
    }
    if (!form.date || !form.time) {
      alert(t("matches.chooseDateTime"))
      return
    }
    if (!form.location || typeof form.location !== 'object') {
      alert(t("matches.pickLocation"))
      return
    }

    setSubmitting(true)
    try {
      const payload = { ...form }
      await api('/api/matches', { method: 'POST', body: JSON.stringify(payload) })
      await load() // refresh matches first
      // reset form safely
      setForm({
        birthYear: ageGroups[0] || null,
        date: '',
        time: '18:00',
        homeAway: 'home',
        location: null
      })
      setOpen(false) // close modal only after success
    } catch (e) {
      alert(e.message || t("matches.failedToPublish"))
    } finally {
      setSubmitting(false)
    }
  }

  async function accept(id) {
    try {
      await api(`/api/matches/${id}/accept`, {
        method: 'POST',
        body: JSON.stringify({ name: session?.name || 'Academy', phone: session?.phone || '' })
      })
      await load()
    } catch (e) {
      alert(e.message || t("matches.failedToAccept"))
    }
  }

  // ✅ Smarter filtering (search by status, U-group, date)
  const filtered = list.filter(m => {
    const uGroup = `U${new Date().getFullYear() - m.birthYear}`
    const text = `${m.status} ${m.date} ${m.time} ${uGroup}`.toLowerCase()
    return text.includes(query.toLowerCase())
  })

  return (
    <div className="min-h-screen text-brand-50">
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="text-2xl md:text-3xl font-bold">{t("matches.title")}</div>
          <div className="flex items-center gap-2">
            <input
              placeholder={t("matches.search")}
              value={query}
              onChange={e => setQuery(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white/10 border border-white/20 backdrop-blur outline-none"
            />
          </div>
        </div>

        {/* Matches List */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {filtered.map(m => {
            const matched = !!m.acceptedBy
            return (
              <div
                key={m._id}
                className="relative rounded-2xl p-4 bg-white/5 border border-white/10 backdrop-blur"
              >
                <AnimatePresence>
                  {matched && (
                    <motion.div
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.6, opacity: 0 }}
                      transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                      className="absolute -top-3 -right-3 z-10"
                    >
                      <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-600 text-white shadow-lg">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-xs font-semibold">{t("matches.matched")}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Status Timeline */}
                <div className="flex items-center justify-between mt-3">
                  {['requested', 'accepted', 'scheduled'].map((step, i) => {
                    const active = ['requested', 'accepted', 'scheduled'].indexOf(m.status) >= i
                    return (
                      <motion.div
                        key={step}
                        className="flex-1 flex flex-col items-center"
                        initial={{ scale: 0 }}
                        animate={{ scale: active ? 1 : 0.8 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      >
                        <div
                          className={
                            active
                              ? 'w-6 h-6 rounded-full bg-green-500 shadow-lg'
                              : 'w-6 h-6 rounded-full bg-gray-400'
                          }
                        ></div>
                        <span className="text-xs mt-1 text-white/80 capitalize">{t(`matches.${step}`)}</span>
                      </motion.div>
                    )
                  })}
                </div>

                <div className="flex items-center justify-between">
                  <div className="text-lg font-semibold flex items-center gap-2">
                    <Users className="w-5 h-5" /> {m.homeAway?.toUpperCase()} • U{new Date().getFullYear() - m.birthYear}
                  </div>
                  <div className="text-sm opacity-80 flex items-center gap-2">
                    <Calendar className="w-4 h-4" /> {m.date} {m.time}
                  </div>
                </div>

                <div className="mt-3">
                  <AcademyMap query={m.location} height={160} />
                </div>

                <div className="mt-4 flex items-center justify-between">
                  {matched ? (
                    <div className="text-sm">
                      <div className="opacity-80">{t("matches.contact")}</div>
                      <div className="font-semibold">{m.acceptedBy?.name || '—'}</div>
                      <div>{m.acceptedBy?.phone || '—'}</div>
                    </div>
                  ) : (
                    <button
                      onClick={() => accept(m._id)}
                      className="w-full py-2 rounded-xl bg-brand-800 text-white shadow hover:shadow-glow transition"
                    >
                      {t("matches.acceptAndShow")}
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Request Match Modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              className="w-full max-w-lg rounded-2xl bg-white text-brand-800 shadow-xl p-6"
            >
              <div className="text-xl font-bold mb-4">{t("matches.requestMatch")}</div>

              <div className="grid gap-4">
                {/* Age Group */}
                <div>
                  <div className="text-sm mb-2">{t("matches.ageGroup")}</div>
                  <div className="flex flex-wrap gap-2">
                    {ageGroups.map(y => (
                      <button
                        key={y}
                        onClick={() => setForm(prev => ({ ...prev, birthYear: y }))}
                        className={
                          'px-3 py-2 rounded-xl border ' +
                          (form.birthYear === y
                            ? 'bg-brand-800 text-white'
                            : 'bg-white text-brand-800')
                        }
                      >
                        U{new Date().getFullYear() - y}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Date + Time */}
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm">
                    {t("matches.date")}
                    <input
                      type="date"
                      value={form.date}
                      onChange={e => setForm(prev => ({ ...prev, date: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-brand-200"
                    />
                  </label>
                  <label className="text-sm">
                    {t("matches.time")}
                    <input
                      type="time"
                      value={form.time}
                      onChange={e => setForm(prev => ({ ...prev, time: e.target.value }))}
                      className="w-full px-3 py-2 rounded-xl border border-brand-200"
                    />
                  </label>
                </div>

                {/* Home / Away */}
                <div>
                  <div className="text-sm mb-2">{t("matches.homeAway")}</div>
                  <div className="flex gap-2">
                    {['home', 'away'].map(v => (
                      <button
                        key={v}
                        onClick={() => setForm(prev => ({ ...prev, homeAway: v }))}
                        className={
                          'px-4 py-2 rounded-xl border ' +
                          (form.homeAway === v
                            ? 'bg-brand-800 text-white'
                            : 'bg-white text-brand-800')
                        }
                      >
                        {t(`matches.${v}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Location Picker */}
                <div className="text-sm">
                  {t("matches.location")}
                  <div className="mt-2 rounded-2xl overflow-hidden border border-brand-200">
                    <LocationPicker onChange={pos => setForm(prev => ({ ...prev, location: pos }))} />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 flex justify-end gap-2">
                <button onClick={() => setOpen(false)} className="px-4 py-2 rounded-xl bg-brand-100">
                  {t("common.cancel")}
                </button>
                <button
                  disabled={submitting}
                  onClick={create}
                  className="px-4 py-2 rounded-xl bg-brand-800 text-white"
                >
                  {submitting ? t("matches.publishing") : t("matches.publish")}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
