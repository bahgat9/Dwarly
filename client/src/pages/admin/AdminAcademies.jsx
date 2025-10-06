// src/pages/admin/AdminAcademies.jsx
import React, { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Plus, Trash2 } from "lucide-react"
import Select from "react-select"
import { api } from "../../api"
import LoadingSkeleton from "../../components/LoadingSkeleton.jsx"
import LocationPicker from "../../components/LocationPicker.jsx"
import { useLanguage } from "../../context/LanguageContext"

const yearOptions = Array.from({ length: 2021 - 2005 + 1 }, (_, i) => {
  const year = 2005 + i
  return { value: year, label: year.toString() }
})

export default function AdminAcademies({ session }) {
  const nav = useNavigate()
  const { t } = useLanguage()
  const [list, setList] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [showAcademySelection, setShowAcademySelection] = useState(false)
  const [addingBranch, setAddingBranch] = useState(false)
  const [selectedAcademyForBranch, setSelectedAcademyForBranch] = useState(null)

  const [form, setForm] = useState({
    name: "",
    nameAr: "",
    location: "",
    locationDescription: "",
    locationGeo: null,
    phone: "",
    contact: "",
    description: "",
    rating: 4,
    verified: false,
    offersGirls: true,
    offersBoys: true,
    subscriptionPrice: 0,
    trainingTimes: [],
    branches: [],
    ages: [],
    // we use a file for upload; preview is generated via URL.createObjectURL
    logoFile: null,
  })

  const [branchForm, setBranchForm] = useState({
    name: "",
    nameAr: "",
    locationDescription: "",
    locationGeo: null,
    phone: "",
    contact: "",
    description: "",
    rating: 4,
    verified: false,
    offersGirls: true,
    offersBoys: true,
    subscriptionPrice: 0,
    trainingTimes: [],
    ages: [],
  })

  const logoPreviewUrl = useMemo(
    () => (form.logoFile ? URL.createObjectURL(form.logoFile) : null),
    [form.logoFile]
  )

  useEffect(() => {
    return () => {
      if (logoPreviewUrl) URL.revokeObjectURL(logoPreviewUrl)
    }
  }, [logoPreviewUrl])

  // Pagination
  const [page, setPage] = useState(1)
  const pageSize = 10
  const totalPages = Math.ceil(list.length / pageSize)
  const paginatedList = list.slice((page - 1) * pageSize, page * pageSize)

  useEffect(() => {
    if (!session || session.role !== "admin") nav("/login")
  }, [session, nav])

  async function load() {
    setLoading(true)
    setError(null)
    try {
      const data = await api("/api/academies") // api() auto-unwraps {data:...}
      console.log("Loaded academies data:", data)
      console.log("First academy branches:", data?.[0]?.branches)
      setList(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error("Failed to load academies:", err)
      setError(t("adminAcademies.failedToLoad"))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  function resetForm() {
    setForm({
      name: "",
      nameAr: "",
      location: "",
      locationDescription: "",
      locationGeo: null,
      phone: "",
      contact: "",
      description: "",
      rating: 4,
      verified: false,
      offersGirls: true,
      offersBoys: true,
      subscriptionPrice: 0,
      trainingTimes: [],
      branches: [],
      ages: [],
      logoFile: null,
    })
  }

  function resetBranchForm() {
    setBranchForm({
      name: "",
      nameAr: "",
      locationDescription: "",
      locationGeo: null,
      phone: "",
      contact: "",
      description: "",
      rating: 4,
      verified: false,
      offersGirls: true,
      offersBoys: true,
      subscriptionPrice: 0,
      trainingTimes: [],
      ages: [],
    })
  }

  // ---------- IMPORTANT FIX ----------
  // When sending FormData, JSON.stringify arrays/objects.
  function appendValue(fd, key, value) {
    if (value === undefined || value === null) return
    const t = typeof value
    if (value instanceof File) {
      fd.append(key, value)
    } else if (t === "object") {
      fd.append(key, JSON.stringify(value))
    } else {
      fd.append(key, String(value))
    }
  }

  // Helper: send JSON by default; switch to FormData only if a file is present
  // Helper: send JSON by default; switch to FormData only if a file is present
  async function postOrPatch(url, method, payload) {
    // 1) Normalize geo fields
    const geo = payload.locationGeo && typeof payload.locationGeo === "object"
      ? payload.locationGeo
      : null

    // 2) Remove file
    const { logoFile, ...cleanPayload } = payload

    // 3) Ensure name exists
    const safeName = (cleanPayload.name || "").trim()
    if (!safeName) throw new Error("Please enter a name for the academy.")

    // 4) Final payload includes BOTH
    const processedPayload = {
      ...cleanPayload,
      name: safeName,
      location: geo ? JSON.stringify(geo) : (cleanPayload.location || ""),
      locationGeo: geo, // ✅ keep proper lat/lng object
    }

    // 5) Send
    if (logoFile) {
      const fd = new FormData()
      fd.append("logo", logoFile)
      Object.entries(processedPayload).forEach(([k, v]) => appendValue(fd, k, v))
      return api(url, { method, body: fd })
    } else {
      return api(url, {
        method,
        body: JSON.stringify(processedPayload),
        headers: { "Content-Type": "application/json" },
      })
    }
  }


  async function create() {
    setSaving(true)
    try {
      if (!form.name || form.name.trim() === "") {
        alert(t("adminAcademies.nameRequired"))
        setSaving(false)
        return
      }
      const created = await postOrPatch("/api/academies", "POST", form)
      setList((prev) => [created, ...prev])
      setAdding(false)
      resetForm()
    } catch (err) {
      console.error(err)
      alert(t("adminAcademies.failedToCreate"))
    } finally {
      setSaving(false)
    }
  }

  async function update() {
    if (!editing) return
    setSaving(true)
    try {
      const updated = await postOrPatch(`/api/academies/${editing._id}`, "PATCH", form)
      setList((prev) => prev.map((x) => (x._id === updated._id ? updated : x)))
      setEditing(null)
    } catch (err) {
      console.error(err)
      alert(t("adminAcademies.failedToUpdate"))
    } finally {
      setSaving(false)
    }
  }

  async function remove(id) {
    if (!window.confirm(t("adminAcademies.confirmDelete"))) return
    try {
      await api("/api/academies/" + id, { method: "DELETE" })
      setList((prev) => prev.filter((a) => a._id !== id))
    } catch (err) {
      alert(t("adminAcademies.failedToDelete"))
    }
  }

  async function createBranch() {
    if (!selectedAcademyForBranch) return
    setSaving(true)
    try {
      if (!branchForm.name || branchForm.name.trim() === "") {
        alert("Please enter a name for the branch.")
        setSaving(false)
        return
      }

      // Prepare branch data
      const geo = branchForm.locationGeo && typeof branchForm.locationGeo === "object"
        ? branchForm.locationGeo
        : null

      const branchData = {
        name: branchForm.name.trim(),
        nameAr: branchForm.nameAr || "",
        locationDescription: branchForm.locationDescription || "",
        locationGeo: geo,
        phone: branchForm.phone || "",
        contact: branchForm.contact || "",
        description: branchForm.description || "",
        rating: Number(branchForm.rating) || 4,
        verified: !!branchForm.verified,
        offersGirls: !!branchForm.offersGirls,
        offersBoys: !!branchForm.offersBoys,
        subscriptionPrice: Number(branchForm.subscriptionPrice) || 0,
        trainingTimes: branchForm.trainingTimes || [],
        ages: branchForm.ages || [],
        isMain: false, // New branches are not main by default
      }

      // Add branch to academy
      const updated = await api(`/api/academies/${selectedAcademyForBranch._id}/branches`, {
        method: "POST",
        body: JSON.stringify(branchData),
        headers: { "Content-Type": "application/json" },
      })

      console.log("Branch creation response:", updated)
      console.log("Updated academy branches:", updated?.branches)
      console.log("Branch details:", updated?.branches?.[updated.branches.length - 1])

      // Update local list
      setList((prev) => prev.map((a) => (a._id === updated._id ? updated : a)))
      
      // Reset and close
      setAddingBranch(false)
      setSelectedAcademyForBranch(null)
      resetBranchForm()
      alert("Branch added successfully!")
    } catch (err) {
      console.error(err)
      alert("Failed to create branch.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 text-white">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-3xl font-extrabold">{t("adminAcademies.title")}</h2>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm()
              setAdding(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-accent-500 text-brand-900 font-semibold shadow hover:bg-accent-600 transition"
          >
            <Plus size={16} />
            {t("adminAcademies.addAcademy")}
          </button>
          <button
            onClick={() => {
              resetBranchForm()
              setShowAcademySelection(true)
            }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl bg-blue-500 text-white font-semibold shadow hover:bg-blue-600 transition"
          >
            <Plus size={16} />
            Add Branch
          </button>
        </div>
      </div>


      {/* Error state */}
      {error && (
        <div className="mt-6 bg-red-500/20 text-red-400 p-6 rounded-xl">
          {error}
          <button onClick={load} className="ml-4 px-3 py-1 bg-red-500 text-white rounded-xl">
            {t("adminAcademies.retry")}
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <LoadingSkeleton key={i} lines={6} />
          ))}
        </div>
      )}

      {/* Academy list */}
      {!loading && !error && (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
            {paginatedList.map((a) => (
              <div
                key={a._id}
                className="rounded-2xl p-5 bg-brand-900/50 border border-white/10 text-white shadow-lg hover:border-accent-500/30 transition"
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
                      {t("adminAcademies.verified")}
                    </span>
                  )}
                </div>

                {/* Branch info */}
                {Array.isArray(a.branches) && a.branches.length > 0 ? (
                  <div className="mt-3 text-sm opacity-90 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                        {a.branches.length} branch{a.branches.length > 1 ? 'es' : ''}
                      </span>
                      <span className="text-xs text-green-400">✓ Branches Active</span>
                    </div>
                    {(() => {
                      const mainBranch = a.branches.find(b => b.isMain) || a.branches[0]
                      console.log("Rendering branch info for academy:", a.name, "Main branch:", mainBranch)
                      return (
                        <>
                          <div className="font-medium text-accent-400">
                            🏢 {mainBranch?.name || "Main Branch"} {mainBranch?.isMain ? "(Main)" : ""}
                          </div>
                          <div>
                            📍 {mainBranch?.locationDescription || 
                              (mainBranch?.locationGeo ? `${mainBranch.locationGeo.lat}, ${mainBranch.locationGeo.lng}` : "—")}
                          </div>
                          <div>☎ {mainBranch?.phone || a.phone || "—"}</div>
                          {mainBranch?.contact && <div>✉ {mainBranch.contact}</div>}
                          {mainBranch?.description && (
                            <div className="text-xs opacity-75 mt-1">
                              {mainBranch.description.substring(0, 50)}...
                            </div>
                          )}
                        </>
                      )
                    })()}
                  </div>
                ) : (
                  <div className="mt-3 text-sm opacity-90 flex flex-col gap-1">
                    <div>
                      📍 {a.locationDescription
                        ? a.locationDescription
                        : a.location && typeof a.location === "object"
                          ? `${a.location.lat}, ${a.location.lng}`
                          : a.location || "—"}
                    </div>
                    <div>☎ {a.phone || "—"}</div>
                    {a.contact && <div>✉ {a.contact}</div>}
                  </div>
                )}

                {/* Rating + Price */}
                <div className="mt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span key={i}>{i < (a.rating || 0) ? "⭐" : "☆"}</span>
                    ))}
                  </div>
                  <div className="text-sm font-semibold">💰 {a.subscriptionPrice || 0} EGP</div>
                </div>

                {/* Girls/Boys */}
                <div className="mt-3 flex gap-2 flex-wrap">
                  {a.offersGirls && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-pink-500/20 text-pink-300 border border-pink-400/30">
                      {t("adminAcademies.girls")}
                    </span>
                  )}
                  {a.offersBoys && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-blue-500/20 text-blue-300 border border-blue-400/30">
                      {t("adminAcademies.boys")}
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
                    <div className="font-semibold mb-1">{t("adminAcademies.trainingTimes")}:</div>
                    <ul className="list-disc list-inside space-y-0.5">
                      {a.trainingTimes.slice(0, 2).map((t, i) => (
                        <li key={i}>
                          {t.day} – {t.time}
                        </li>
                      ))}
                      {a.trainingTimes.length > 2 && <li>+{a.trainingTimes.length - 2} more…</li>}
                    </ul>
                  </div>
                )}

                {/* All Branches List */}
                {Array.isArray(a.branches) && a.branches.length > 1 && (
                  <div className="mt-3 text-xs opacity-80 bg-white/5 p-2 rounded">
                    <div className="font-semibold mb-1">All Branches:</div>
                    {a.branches.map((branch, i) => (
                      <div key={i} className="ml-2 flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${branch.isMain ? 'bg-green-400' : 'bg-blue-400'}`}></span>
                        <span>{branch.name} {branch.isMain ? '(Main)' : ''}</span>
                        {branch.locationDescription && (
                          <span className="opacity-60">- {branch.locationDescription.substring(0, 20)}...</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Debug: Branch data */}
                {Array.isArray(a.branches) && a.branches.length > 0 && (
                  <div className="mt-3 text-xs opacity-60 bg-white/5 p-2 rounded">
                    <div className="font-semibold mb-1">Debug - Branch Data:</div>
                    <div>Total: {a.branches.length}</div>
                    {a.branches.map((branch, i) => (
                      <div key={i} className="ml-2">
                        {i + 1}. {branch.name} {branch.isMain ? '(Main)' : ''}
                      </div>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2">
                  <button
                    onClick={() => {
                      setEditing(a)
                      setForm({
                        ...a,
                        ages: a.ages || [],
                      trainingTimes: a.trainingTimes || [],
                      branches: a.branches || [],
                        logoFile: null, // reset file input
                        locationGeo: typeof a.location === "object" ? a.location : null,
                        locationDescription: typeof a.location === "string" ? a.location : "",
                      })
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-sm transition"
                  >
                    {t("adminAcademies.edit")}
                  </button>
                  <button
                    onClick={() => remove(a._id)}
                    className="px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm flex items-center gap-1 transition"
                  >
                    <Trash2 size={14} /> {t("adminAcademies.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-8">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 transition"
              >
                {t("adminAcademies.prev")}
              </button>
              <span className="text-sm">
                {t("adminAcademies.page")} {page} {t("adminAcademies.of")} {totalPages}
              </span>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1 rounded-xl bg-white/10 hover:bg-white/20 disabled:opacity-40 transition"
              >
                {t("adminAcademies.next")}
              </button>
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      {(adding || editing) && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => {
            setAdding(false)
            setEditing(null)
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-brand-800 text-white shadow-xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold mb-4 text-accent-500">
              {adding ? t("adminAcademies.addAcademyModal") : t("adminAcademies.editAcademyModal")}
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">{t("adminAcademies.nameEnglish")}</label>
                  <input
                    value={form.name ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder={t("adminAcademies.academyName")}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">{t("adminAcademies.nameArabic")}</label>
                  <input
                    value={form.nameAr ?? ""}
                    onChange={(e) => setForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder={t("adminAcademies.academyNameAr")}
                    className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.phone")}</label>
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder={t("adminAcademies.phoneNumber")}
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.contactEmail")}</label>
                <input
                  value={form.contact ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder={t("adminAcademies.contactEmail")}
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.description")}</label>
                <textarea
                  placeholder={t("adminAcademies.academyDescription")}
                  value={form.description ?? ""}
                  onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.locationDescription")}</label>
                <input
                  value={form.locationDescription ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, locationDescription: e.target.value }))
                  }
                  placeholder={t("adminAcademies.locationDescription")}
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.location")}</label>
                <div className="rounded-xl bg-brand-700 border border-brand-600 overflow-hidden">
                  <LocationPicker
                    onChange={(geo) => setForm((prev) => ({ ...prev, locationGeo: geo }))}
                  />
                </div>
                {form.locationGeo && (
                  <div className="mt-2 text-sm text-accent-500">
                    Selected: {form.locationGeo.lat.toFixed(6)}, {form.locationGeo.lng.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-2">
                <span className="font-medium">{t("adminAcademies.rating")}</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, rating: i + 1 }))}
                    className="text-2xl"
                  >
                    {i < (form.rating || 0) ? "⭐" : "☆"}
                  </button>
                ))}
              </div>

              {/* Multi-select dropdown for ages */}
              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.availableAges")}</label>
                <Select
                  isMulti
                  options={yearOptions}
                  value={(form.ages || []).map((y) => ({ value: y, label: y.toString() }))}
                  onChange={(selected) =>
                    setForm((prev) => ({
                      ...prev,
                      ages: selected.map((s) => s.value),
                    }))
                  }
                  className="text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.verified}
                    onChange={(e) => setForm((prev) => ({ ...prev, verified: e.target.checked }))}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>{t("adminAcademies.verified")}</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.offersGirls}
                    onChange={(e) => setForm({ ...form, offersGirls: e.target.checked })}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>{t("adminAcademies.girls")}</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!form.offersBoys}
                    onChange={(e) => setForm({ ...form, offersBoys: e.target.checked })}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>{t("adminAcademies.boys")}</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.subscriptionPrice")}</label>
                <input
                  type="number"
                  value={form.subscriptionPrice ?? 0}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      subscriptionPrice: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              {/* Training times */}
              <div>
                <div className="font-semibold mb-2">{t("adminAcademies.trainingTimes")}</div>
                <button
                  type="button"
                  className="px-3 py-1 rounded-xl bg-brand-700 hover:bg-brand-600 text-white text-sm mb-2"
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      trainingTimes: [...(f.trainingTimes || []), { day: "", time: "" }],
                    }))
                  }
                >
                  {t("adminAcademies.addTime")}
                </button>
                {(form.trainingTimes || []).map((trainingTime, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      className="px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder={t("adminAcademies.day")}
                      value={trainingTime.day ?? ""}
                      onChange={(e) => {
                        const arr = [...(form.trainingTimes || [])]
                        arr[i] = { ...arr[i], day: e.target.value }
                        setForm({ ...form, trainingTimes: arr })
                      }}
                    />
                    <input
                      className="px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder={t("adminAcademies.time")}
                      value={trainingTime.time ?? ""}
                      onChange={(e) => {
                        const arr = [...(form.trainingTimes || [])]
                        arr[i] = { ...arr[i], time: e.target.value }
                        setForm({ ...form, trainingTimes: arr })
                      }}
                    />
                  </div>
                ))}
              </div>

              {/* Logo upload (file) */}
              <div>
                <label className="block text-sm font-medium mb-1">{t("adminAcademies.logoImage")}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      logoFile: e.target.files && e.target.files[0] ? e.target.files[0] : null,
                    }))
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white file:mr-4 file:py-1 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-brand-600 file:text-white hover:file:bg-brand-500"
                />
                <div className="mt-2 flex items-center gap-3">
                  {logoPreviewUrl ? (
                    <img
                      src={logoPreviewUrl}
                      alt={t("adminAcademies.preview")}
                      className="w-20 h-20 object-cover rounded-xl border border-brand-600"
                    />
                  ) : editing && editing.logo ? (
                    <img
                      src={editing.logo}
                      alt={t("adminAcademies.currentLogo")}
                      className="w-20 h-20 object-cover rounded-xl border border-brand-600"
                    />
                  ) : null}
                </div>
                {form.logoFile && (
                  <p className="text-xs text-gray-400 mt-1">{t("adminAcademies.selected")} {form.logoFile.name}</p>
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setAdding(false)
                    setEditing(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-brand-600 text-white hover:bg-brand-700 transition"
                  disabled={saving}
                >
                  {t("adminAcademies.cancel")}
                </button>
                {adding ? (
                  <button
                    onClick={create}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold hover:bg-accent-600 disabled:opacity-50 transition"
                  >
                    {saving ? t("adminAcademies.creating") : t("adminAcademies.create")}
                  </button>
                ) : (
                  <button
                    onClick={update}
                    disabled={saving}
                    className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold hover:bg-accent-600 disabled:opacity-50 transition"
                  >
                    {saving ? t("adminAcademies.saving") : t("adminAcademies.save")}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Academy Selection Modal for Branch Creation */}
      {showAcademySelection && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => setShowAcademySelection(false)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl bg-brand-800 text-white shadow-xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold mb-4 text-accent-500">Select Academy for New Branch</div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((academy) => (
                <div
                  key={academy._id}
                  onClick={() => {
                    setSelectedAcademyForBranch(academy)
                    setShowAcademySelection(false)
                    setAddingBranch(true)
                  }}
                  className="p-4 rounded-xl bg-brand-700/40 border border-brand-600 hover:bg-brand-700/60 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3">
                    {academy.logo && (
                      <img
                        src={academy.logo}
                        alt={academy.name}
                        className="w-12 h-12 rounded-xl object-cover border border-white/10"
                      />
                    )}
                    <div>
                      <div className="font-semibold">{academy.name}</div>
                      <div className="text-sm text-white/70">{academy.nameAr}</div>
                      <div className="text-xs text-white/60">
                        {academy.branches?.length || 0} branches
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowAcademySelection(false)}
                className="px-4 py-2 rounded-xl border border-brand-600 text-white hover:bg-brand-700 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Branch Creation Modal */}
      {addingBranch && selectedAcademyForBranch && (
        <div
          className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4"
          onClick={() => {
            setAddingBranch(false)
            setSelectedAcademyForBranch(null)
          }}
        >
          <div
            className="w-full max-w-2xl rounded-2xl bg-brand-800 text-white shadow-xl p-6 overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-xl font-bold mb-4 text-accent-500">
              Add Branch to {selectedAcademyForBranch.name}
            </div>
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Name (English)*</label>
                  <input
                    value={branchForm.name ?? ""}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Branch name"
                    required
                    className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Name (Arabic)</label>
                  <input
                    value={branchForm.nameAr ?? ""}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, nameAr: e.target.value }))}
                    placeholder="اسم الفرع"
                    className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone</label>
                <input
                  value={branchForm.phone ?? ""}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, phone: e.target.value }))}
                  placeholder="Phone number"
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Contact Email</label>
                <input
                  value={branchForm.contact ?? ""}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, contact: e.target.value }))}
                  placeholder="Contact Email"
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  placeholder="Branch description"
                  value={branchForm.description ?? ""}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                  rows={3}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location Description</label>
                <input
                  value={branchForm.locationDescription ?? ""}
                  onChange={(e) => setBranchForm((prev) => ({ ...prev, locationDescription: e.target.value }))}
                  placeholder="Location Description"
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Location</label>
                <div className="rounded-xl bg-brand-700 border border-brand-600 overflow-hidden">
                  <LocationPicker
                    onChange={(geo) => setBranchForm((prev) => ({ ...prev, locationGeo: geo }))}
                  />
                </div>
                {branchForm.locationGeo && (
                  <div className="mt-2 text-sm text-accent-500">
                    Selected: {branchForm.locationGeo.lat.toFixed(6)}, {branchForm.locationGeo.lng.toFixed(6)}
                  </div>
                )}
              </div>

              {/* Rating stars */}
              <div className="flex items-center gap-2">
                <span className="font-medium">Rating:</span>
                {Array.from({ length: 5 }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setBranchForm((f) => ({ ...f, rating: i + 1 }))}
                    className="text-2xl"
                  >
                    {i < (branchForm.rating || 0) ? "⭐" : "☆"}
                  </button>
                ))}
              </div>

              {/* Multi-select dropdown for ages */}
              <div>
                <label className="block text-sm font-medium mb-1">Available Ages</label>
                <Select
                  isMulti
                  options={yearOptions}
                  value={(branchForm.ages || []).map((y) => ({ value: y, label: y.toString() }))}
                  onChange={(selected) =>
                    setBranchForm((prev) => ({
                      ...prev,
                      ages: selected.map((s) => s.value),
                    }))
                  }
                  className="text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!branchForm.verified}
                    onChange={(e) => setBranchForm((prev) => ({ ...prev, verified: e.target.checked }))}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>Verified</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!branchForm.offersGirls}
                    onChange={(e) => setBranchForm({ ...branchForm, offersGirls: e.target.checked })}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>Girls</span>
                </label>

                <label className="inline-flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!branchForm.offersBoys}
                    onChange={(e) => setBranchForm({ ...branchForm, offersBoys: e.target.checked })}
                    className="rounded bg-brand-700 border-brand-600 text-accent-500 focus:ring-accent-500"
                  />
                  <span>Boys</span>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Subscription price (EGP)</label>
                <input
                  type="number"
                  value={branchForm.subscriptionPrice ?? 0}
                  onChange={(e) =>
                    setBranchForm({
                      ...branchForm,
                      subscriptionPrice: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                />
              </div>

              {/* Training times */}
              <div>
                <div className="font-semibold mb-2">Training times</div>
                <button
                  type="button"
                  className="px-3 py-1 rounded-xl bg-brand-700 hover:bg-brand-600 text-white text-sm mb-2"
                  onClick={() =>
                    setBranchForm((f) => ({
                      ...f,
                      trainingTimes: [...(f.trainingTimes || []), { day: "", time: "" }],
                    }))
                  }
                >
                  Add time
                </button>
                {(branchForm.trainingTimes || []).map((trainingTime, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 mt-2">
                    <input
                      className="px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder="Day"
                      value={trainingTime.day ?? ""}
                      onChange={(e) => {
                        const arr = [...(branchForm.trainingTimes || [])]
                        arr[i] = { ...arr[i], day: e.target.value }
                        setBranchForm({ ...branchForm, trainingTimes: arr })
                      }}
                    />
                    <input
                      className="px-3 py-2 rounded-xl bg-brand-700 border border-brand-600 text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-accent-500"
                      placeholder="Time"
                      value={trainingTime.time ?? ""}
                      onChange={(e) => {
                        const arr = [...(branchForm.trainingTimes || [])]
                        arr[i] = { ...arr[i], time: e.target.value }
                        setBranchForm({ ...branchForm, trainingTimes: arr })
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end gap-2 pt-4">
                <button
                  onClick={() => {
                    setAddingBranch(false)
                    setSelectedAcademyForBranch(null)
                  }}
                  className="px-4 py-2 rounded-xl border border-brand-600 text-white hover:bg-brand-700 transition"
                  disabled={saving}
                >
                  Cancel
                </button>
                <button
                  onClick={createBranch}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold hover:bg-accent-600 disabled:opacity-50 transition"
                >
                  {saving ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
