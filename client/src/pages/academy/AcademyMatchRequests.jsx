// client/src/pages/academy/AcademyMatchRequests.jsx
import React, { useEffect, useMemo, useState } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { motion, AnimatePresence } from "framer-motion";
import { Calendar, MapPin, Phone, Plus, Home, Plane, AlertTriangle } from "lucide-react";
import MatchCardModal from "./MatchCardModal";
import LocationPicker from "../../components/LocationPicker";
import { useLanguage } from "../../context/LanguageContext";

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Modal Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-gradient-to-br from-red-800/90 to-red-900/90 w-full max-w-md max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-white">Error</h2>
              </div>
              <button
                onClick={this.props.onClose}
                className="text-white/60 hover:text-white text-xl"
              >
                ×
              </button>
            </div>
            <div className="px-6 py-4 flex-1 flex items-center justify-center">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">Something went wrong</h3>
                <p className="text-white/70 text-sm mb-4">
                  There was an error loading the form. Please try again.
                </p>
                <button
                  onClick={() => this.setState({ hasError: false, error: null })}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl"
                >
                  Try Again
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Real API Integration ---
import { api } from "../../api";

const matchApi = {
fetchRequests: async () => {
    try {
      const matches = await api("/api/matches");
      return matches.map(match => ({
        id: match._id,
        creatorId: match.creatorId,
        academy: {
          _id: match.academy._id,
          name: match.academy.name,
          nameAr: match.academy.nameAr,
          phone: match.academy.phone,
          logo: match.academy.logo,
        },
        phone: match.phone,
        duration: match.duration,
        description: match.description || "Friendly match",
        location: {
          address: match.locationDescription || "TBD",
          lat: match.locationGeo?.lat,
          lng: match.locationGeo?.lng,
        },
        ageGroup: match.ageGroup,
        date: match.dateTime,
        status: match.status === "requested" ? "available" : match.status,
        createdAt: match.createdAt,
        opponent: match.opponent
      }));
    } catch (error) {
      console.error("Failed to fetch match requests:", error);
      return [];
    }
  },
  
  updateStatus: async (id, status) => {
    try {
      const updatedMatch = await api(`/api/matches/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      return { id, status: updatedMatch.status };
    } catch (error) {
      console.error("Failed to update match status:", error);
      throw error;
    }
  },
  
  acceptRequest: async (id, acceptorAcademyId) => {
    try {
      const acceptedMatch = await api(`/api/matches/${id}/accept`, {
        method: "POST"
      });
      return { id, status: "confirmed", acceptedBy: acceptorAcademyId };
    } catch (error) {
      console.error("Failed to accept match request:", error);
      throw error;
    }
  },
  
  createRequest: async (newReq) => {
    try {
      const matchData = {
        academy: {
          _id: newReq.academy._id,
          name: newReq.academy.name,
          logo: newReq.academy.logo
        },
        ageGroup: newReq.ageGroup,
        date: newReq.date,
        locationDescription: newReq.location.address,
        locationGeo: {
          lat: parseFloat(newReq.location.lat),
          lng: parseFloat(newReq.location.lng),
        },
        homeAway: newReq.isHome ? "home" : "away",
        phone: newReq.phone,
        duration: newReq.duration,
        description: newReq.description || "Friendly match"
      };
      
      const createdMatch = await api("/api/matches", {
        method: "POST",
        body: JSON.stringify(matchData)
      });
      return {
        id: createdMatch._id,
        creatorId: createdMatch.creatorId,
        academy: newReq.academy,
        phone: newReq.phone,
        duration: newReq.duration,
        location: newReq.location,
        ageGroup: newReq.ageGroup,
        date: newReq.date,
        status: "available",
        createdAt: createdMatch.createdAt
      };
    } catch (error) {
      console.error("Failed to create match request:", error);
      throw error;
    }
  },

  deleteRequest: async (id) => {
    try {
      await api(`/api/matches/${id}`, {
        method: "DELETE"
      });
      return { id };
    } catch (error) {
      console.error("Failed to delete match request:", error);
      throw error;
    }
  }
};

function toLocal(iso) {
  return new Date(iso).toLocaleString();
}

// --- Match Card ---
function MatchCard({ item, onOpen, onDelete, currentUser, column }) {
  const canDelete = currentUser?.id === item.creatorId || currentUser?.userId === item.creatorId;

  // Helper function to process and organize age groups
  const processAgeGroup = (ageGroup) => {
    if (!ageGroup) return "—";
    if (ageGroup === "Mixed Ages") return ageGroup;

    // Split by comma, trim, remove duplicates, sort, and join
    const groups = ageGroup.split(',')
      .map(group => group.trim())
      .filter((group, index, arr) => arr.indexOf(group) === index) // Remove duplicates
      .sort(); // Sort alphabetically/numerically

    return groups.join(", ");
  };
  
  return (
    <motion.article
      whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-white/5 border border-white/10 rounded-3xl p-6 shadow-xl cursor-pointer hover:shadow-2xl relative"
      onClick={() => onOpen(item.id)}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden border-2 border-white/20 flex items-center justify-center bg-gradient-to-br from-blue-500/20 to-purple-500/20">
            {item.academy?.logo && item.academy.logo !== '' ? (
              <img
                src={item.academy.logo}
                alt={`${item.academy.name} Logo`}
                className="w-full h-full object-cover"
                loading="eager"
                onLoad={(e) => {
                  e.target.style.display = 'block';
                  e.target.nextSibling.style.display = 'none';
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div 
              className="w-full h-full flex items-center justify-center text-white font-bold text-lg"
              style={{ display: item.academy?.logo ? 'none' : 'flex' }}
            >
              {item.academy?.name?.charAt(0) || 'A'}
            </div>
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{item.academy?.name}</h3>
            {item.academy?.nameAr && (
              <p className="text-white/70 text-sm">{item.academy.nameAr}</p>
            )}
          </div>
        </div>
      </div>
      <div className="space-y-2 text-sm text-white/70">
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4" /> {item.location?.address}
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" /> {toLocal(item.date)}
        </div>

      </div>
      <div className="mt-3 space-y-1">
        {item.phone && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <Phone className="w-4 h-4" />
            <span>{item.phone}</span>
          </div>
        )}
        {item.duration && (
          <div className="flex items-center gap-2 text-sm text-white/70">
            <span>⏱️</span>
            <span>{item.duration} {item.duration === '1' ? 'hour' : 'hours'}</span>
          </div>
        )}
      </div>
      
      {/* Delete Button */}
      {canDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(item.id);
          }}
          className="absolute top-3 right-3 w-8 h-8 bg-red-500/20 hover:bg-red-500/30 rounded-full flex items-center justify-center text-red-400 hover:text-red-300 transition-colors"
          title="Delete match request"
        >
          ×
        </button>
      )}
    </motion.article>
  );
}

// --- Column ---
function BoardColumn({ id, title, items, onOpen, onDelete, headerColors, currentUser }) {
  return (
    <div className="flex flex-col w-full md:w-[360px]">
      <div
        className={`rounded-3xl px-6 py-4 mb-4 font-semibold text-white shadow-xl ${headerColors}`}
      >
        {title} <span className="ml-2 text-white/80">({items.length})</span>
      </div>
      <Droppable droppableId={id}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 p-4 rounded-3xl bg-white/5 border border-white/10 min-h-[300px] space-y-4 shadow-xl"
          >
            {items.map((it, idx) => (
              <Draggable
                key={it.id}
                draggableId={it.id}
                index={idx}
                isDragDisabled={it.creatorId !== currentUser.id} // 🔒 Only creator can drag
              >
                {(prov) => (
                  <div
                    ref={prov.innerRef}
                    {...prov.draggableProps}
                    {...prov.dragHandleProps}
                  >
                    <MatchCard item={it} onOpen={onOpen} onDelete={onDelete} currentUser={currentUser} column={id} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}

// --- Add Match Modal ---
function AddMatchModal({ open, onClose, onCreate, currentUser }) {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    date: "",
    time: "",
    ageGroup: [],
    isHome: true,
    phone: "",
    duration: "",
    description: "",
    location: { lat: "", lng: "", address: "" },
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Helper function to process and organize age groups
  const processAgeGroup = (ageGroup) => {
    if (!ageGroup) return "—";
    if (Array.isArray(ageGroup)) {
      // If it's an array, join first, then process
      ageGroup = ageGroup.join(", ");
    }
    if (ageGroup === "Mixed Ages") return ageGroup;

    // Split by comma, trim, remove duplicates, sort, and join
    const groups = ageGroup.split(',')
      .map(group => group.trim())
      .filter((group, index, arr) => arr.indexOf(group) === index) // Remove duplicates
      .sort(); // Sort alphabetically/numerically

    return groups.join(", ");
  };

  function updateField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  function resetForm() {
    setForm({
      date: "",
      time: "",
      ageGroup: "",
      isHome: true,
      phone: "",
      duration: "",
      location: { lat: "", lng: "", address: "" },
    })
    setStep(0)
    setError(null)
  }

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      resetForm()
    }
  }, [open])

  const steps = ["Date & Time", "Year Group & Type", "Location", "Review"]

  // Calculate effective steps based on match type
  const getEffectiveSteps = () => {
    if (!form.isHome) {
      // For away matches, skip location step
      return steps.filter((_, i) => i !== 2)
    }
    return steps
  }

  const effectiveSteps = getEffectiveSteps()
  const maxStep = effectiveSteps.length - 1

  // Adjust step when effective steps change
  useEffect(() => {
    if (step >= effectiveSteps.length) {
      setStep(effectiveSteps.length - 1)
    }
  }, [effectiveSteps.length, step, form.isHome])

  function canProceed() {
    if (effectiveSteps[step] === "Date & Time") return form.date && form.time
    if (effectiveSteps[step] === "Year Group & Type") return (form.ageGroup && form.ageGroup.length > 0) && form.phone && form.duration
    if (effectiveSteps[step] === "Location") return form.isHome ? (form.location.lat && form.location.lng) : true
    return true
  }

  async function handleSubmit() {
    setLoading(true)
    setError(null)
    try {
      // Validate required data
      if (!currentUser?.id) {
        setError("User information is missing. Please refresh and try again.")
        return
      }
      if (!currentUser?.academyId) {
        setError("Academy information is missing. Please refresh and try again.")
        return
      }

      // Combine date and time into ISO string
      const dateTime = new Date(`${form.date}T${form.time}`).toISOString()
      const newReq = {
        academy: {
          _id: currentUser.academyId,
          name: currentUser.academyName,
          logo: currentUser.academyLogo || null
        },
        academyName: currentUser.academyName,
        phone: form.phone,
        duration: form.duration,
        location: form.location,
        ageGroup: Array.isArray(form.ageGroup) ? form.ageGroup.join(", ") : form.ageGroup,
        date: dateTime,
        status: "available",
        description: form.description || "Friendly match",
        isHome: form.isHome
      }
      const created = await matchApi.createRequest(newReq)
      onCreate(created)
      onClose()
    } catch (err) {
      console.error(err)
      setError("Failed to create request.")
    } finally {
      setLoading(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold">New Match Request</h2>
            <p className="text-sm text-white/60">{currentUser?.academy?.name || 'Academy'}</p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center gap-6 px-6 py-4">
          {effectiveSteps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div
                className={`w-8 h-8 flex items-center justify-center rounded-full ${
                  i === step
                    ? "bg-green-500 text-white"
                    : i < step
                    ? "bg-green-700 text-white"
                    : "bg-white/20 text-white/60"
                }`}
              >
                {i < step ? "✓" : i + 1}
              </div>
              <span className="text-sm">{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-4 overflow-y-auto min-h-0 pb-20">
          <AnimatePresence mode="wait">
            {effectiveSteps[step] === "Date & Time" && (
              <motion.div
                key="date-time"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Schedule Your Match</h3>
                  <p className="text-white/70 text-sm">Choose the date and time for your match</p>
                </div>

                <div className="space-y-8">
                  {/* Modern Date Picker */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <Calendar className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl">Match Date</h3>
                        <p className="text-white/60 text-sm">Select when you want to play</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="date"
                        value={form.date}
                        onChange={e => updateField("date", e.target.value)}
                        min={new Date().toISOString().split('T')[0]}
                        className="w-full px-6 py-4 bg-slate-700/50 border-2 border-white/20 rounded-2xl text-white text-lg font-medium focus:outline-none focus:ring-4 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300 hover:border-white/30"
                        style={{ colorScheme: 'dark' }}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  {/* Modern Time Picker */}
                  <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-white/10 rounded-3xl p-8 shadow-2xl">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <span className="text-white text-xl">⏰</span>
                      </div>
                      <div>
                        <h3 className="text-white font-bold text-xl">Match Time</h3>
                        <p className="text-white/60 text-sm">Choose the best time for your match</p>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="time"
                        value={form.time}
                        onChange={e => updateField("time", e.target.value)}
                        className="w-full px-6 py-4 bg-slate-700/50 border-2 border-white/20 rounded-2xl text-white text-lg font-medium focus:outline-none focus:ring-4 focus:ring-green-500/30 focus:border-green-500 transition-all duration-300 hover:border-white/30"
                        style={{ colorScheme: 'dark' }}
                      />
                      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-green-500/5 to-emerald-500/5 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    </div>
                  </div>

                  {(form.date || form.time) && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-4"
                    >
                      <div className="flex items-center gap-3 text-indigo-300">
                        <div className="w-8 h-8 bg-indigo-500/20 rounded-full flex items-center justify-center">
                          📅
                        </div>
                        <div>
                          <p className="font-medium text-sm">Selected Schedule</p>
                          <p className="text-xs text-indigo-200">
                            {form.date && form.time
                              ? new Date(`${form.date}T${form.time}`).toLocaleString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: 'numeric',
                                  minute: '2-digit',
                                  hour12: true
                                })
                              : form.date
                              ? new Date(form.date).toLocaleDateString('en-US', {
                                  weekday: 'long',
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric'
                                })
                              : form.time
                              ? `Time: ${form.time}`
                              : "Incomplete"}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}

            {effectiveSteps[step] === "Year Group & Type" && (
              <motion.div
                key="year-group-type"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Match Details</h3>
                  <p className="text-white/70 text-sm">Specify your match requirements</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Year Group
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        "2010, 2011", "2011, 2012", "2012, 2013", "2013, 2014", 
                        "2014, 2015", "2015, 2016", "2016, 2017", "2017, 2018", 
                        "2018, 2019", "2019, 2020", "2020, 2021", "Mixed Ages"
                      ].map(ageGroup => (
                        <button
                          key={ageGroup}
                          type="button"
                          onClick={() => {
                            const currentAgeGroups = form.ageGroup || []
                            const isSelected = currentAgeGroups.includes(ageGroup)
                            const newAgeGroups = isSelected
                              ? currentAgeGroups.filter(age => age !== ageGroup)
                              : [...currentAgeGroups, ageGroup]
                            updateField("ageGroup", newAgeGroups)
                          }}
                          className={`px-3 py-2 rounded-xl border transition-all ${
                            (form.ageGroup || []).includes(ageGroup)
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'bg-slate-800 text-white border-white/20 hover:border-blue-500'
                          }`}
                        >
                          {ageGroup}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-3">
                      Match Type
                    </label>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => updateField("isHome", true)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                          form.isHome
                            ? "bg-green-500 text-white shadow-lg"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        <Home className="w-5 h-5" />
                        Home
                      </button>
                      <button
                        type="button"
                        onClick={() => updateField("isHome", false)}
                        className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-medium transition-all ${
                          !form.isHome
                            ? "bg-blue-500 text-white shadow-lg"
                            : "bg-white/10 text-white/70 hover:bg-white/20"
                        }`}
                      >
                        <Plane className="w-5 h-5" />
                        Away
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Contact Phone
                      </label>
                      <input
                        type="tel"
                        placeholder="+20 100 000 0000"
                        value={form.phone}
                        onChange={e => updateField("phone", e.target.value)}
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-white mb-2">
                        Match Duration
                      </label>
                      <select
                        value={form.duration}
                        onChange={e => updateField("duration", e.target.value)}
                        className="w-full px-4 py-3 bg-slate-800 border border-white/20 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        style={{ colorScheme: 'dark' }}
                      >
                        <option value="">Select duration</option>
                        <option value="1">1 hour</option>
                        <option value="1.5">1.5 hours</option>
                        <option value="2">2 hours</option>
                        <option value="2.5">2.5 hours</option>
                        <option value="3">3 hours</option>
                        <option value="custom">Custom duration</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Match Description
                    </label>
                    <textarea
                      placeholder="Describe the match (e.g., Friendly 7-a-side, Tournament match, etc.)"
                      value={form.description}
                      onChange={e => updateField("description", e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                      rows={3}
                    />
                  </div>

                </div>
              </motion.div>
            )}

            {effectiveSteps[step] === "Location" && (
              <motion.div
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <h3 className="text-xl font-semibold text-white mb-2">Match Location</h3>
                  <p className="text-white/70 text-sm">
                    {form.isHome ? "This will be at your academy's home ground" : "Enter the location for this away match"}
                  </p>
                </div>

                {form.isHome ? (
                  <div className="space-y-6">
                    {/* Home Match Header */}
                    <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl p-6">
                      <div className="flex items-center gap-4 text-green-400 mb-4">
                        <div className="w-12 h-12 bg-green-500/20 rounded-xl flex items-center justify-center text-2xl">
                          🏠
                        </div>
                        <div>
                          <p className="font-semibold text-lg">Home Match</p>
                          <p className="text-sm text-green-300/80">Will be played at your academy's home ground</p>
                        </div>
                      </div>
                    </div>

                    {/* Location Description */}
                    <div className="space-y-3">
                      <label className="block text-sm font-semibold text-white mb-3 flex items-center gap-2">
                        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                          📝
                        </div>
                        Academy Location Description
                      </label>
                      <div className="relative">
                        <textarea
                          placeholder="Provide detailed directions to your academy (e.g., 'Main football field behind the school building, accessible via the parking lot entrance. Look for the green gates.')"
                          value={form.location.address}
                          onChange={(e) => updateField("location", { ...form.location, address: e.target.value })}
                          className="w-full px-4 py-4 bg-white/10 border-2 border-white/20 rounded-2xl text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 resize-none text-sm leading-relaxed"
                          rows={4}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-white/40">
                          {form.location.address.length}/200
                        </div>
                      </div>
                    </div>

                    {/* Interactive Map Location Picker */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <label className="block text-sm font-semibold text-white flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                            📍
                          </div>
                          Select Location on Map
                        </label>
                        <span className="text-xs text-white/60">Click on the map to set location</span>
                      </div>

                      {/* Location Picker Component */}
                      <div className="border-2 border-white/10 rounded-2xl overflow-hidden">
                        <LocationPicker
                          onChange={({ lat, lng }) => {
                            updateField("location", {
                              ...form.location,
                              lat: lat.toString(),
                              lng: lng.toString(),
                            });
                          }}
                        />
                      </div>

                      {/* Location Status */}
                      {(form.location.lat && form.location.lng) && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-xl p-4"
                        >
                          <div className="flex items-center gap-3 text-green-300">
                            <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                              ✅
                            </div>
                            <div>
                              <p className="font-medium text-sm">Location Set Successfully</p>
                              <p className="text-xs text-green-200">
                                Coordinates: {parseFloat(form.location.lat).toFixed(4)}, {parseFloat(form.location.lng).toFixed(4)}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative">
                      <label className="block text-sm font-medium text-white mb-2">
                        Venue Name
                      </label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/40" />
                        <input
                          type="text"
                          placeholder="e.g. Cairo Sports Complex, Giza Stadium"
                          value={form.location.address}
                          onChange={(e) => updateField("location", { ...form.location, address: e.target.value })}
                          className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Latitude (Optional)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="30.0444"
                          value={form.location.lat}
                          onChange={(e) => updateField("location", { ...form.location, lat: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-white mb-2">
                          Longitude (Optional)
                        </label>
                        <input
                          type="number"
                          step="any"
                          placeholder="31.2357"
                          value={form.location.lng}
                          onChange={(e) => updateField("location", { ...form.location, lng: e.target.value })}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                      </div>
                    </div>

                    {form.location.address && (
                      <div className="bg-white/5 border border-white/10 rounded-xl p-4">
                        <div className="flex items-center gap-3 text-white/80">
                          <MapPin className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="font-medium">Selected Location</p>
                            <p className="text-sm text-white/60">{form.location.address}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {effectiveSteps[step] === "Review" && (
              <motion.div
                key="review"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {/* Enhanced Header */}
                <div className="text-center space-y-4">
                  <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full flex items-center justify-center mx-auto shadow-lg">
                    <div className="text-3xl">✅</div>
                  </div>
                  <div>
                    <h3 className="text-3xl font-bold text-white mb-2">Ready to Submit?</h3>
                    <p className="text-white/70 text-lg">Review your match request details below</p>
                  </div>
                </div>

                {/* Summary Cards Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Match Schedule Card - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-gradient-to-br from-blue-500/20 via-indigo-500/20 to-purple-500/20 border border-blue-500/30 rounded-3xl p-6 shadow-xl hover:shadow-blue-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-2xl">📅</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-2">Match Schedule</h4>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <p className="text-blue-200 font-medium">
                              {form.date && form.time
                                ? new Date(`${form.date}T${form.time}`).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })
                                : "Date not set"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                            <p className="text-blue-200 font-medium">
                              {form.time
                                ? new Date(`${form.date}T${form.time}`).toLocaleTimeString('en-US', {
                                    hour: 'numeric',
                                    minute: '2-digit',
                                    hour12: true
                                  })
                                : "Time not set"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Match Details Card - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-gradient-to-br from-green-500/20 via-emerald-500/20 to-teal-500/20 border border-green-500/30 rounded-3xl p-6 shadow-xl hover:shadow-green-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-2xl">⚽</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-2">Match Details</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-green-200 font-medium">Age Group:</span>
                            <span className="bg-green-500/20 text-green-100 px-3 py-1 rounded-full text-sm font-semibold">
                              {Array.isArray(form.ageGroup) && form.ageGroup.length > 0
                                ? processAgeGroup(form.ageGroup)
                                : "Not specified"}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-green-200 font-medium">Match Type:</span>
                            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                              form.isHome
                                ? "bg-green-500/20 text-green-100"
                                : "bg-blue-500/20 text-blue-100"
                            }`}>
                              {form.isHome ? "🏠 Home Match" : "✈️ Away Match"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Location Card - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-rose-500/20 border border-purple-500/30 rounded-3xl p-6 shadow-xl hover:shadow-purple-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-2xl">📍</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-2">Location</h4>
                        <div className="space-y-2">
                          <p className="text-purple-200 text-sm leading-relaxed">
                            {form.location.address || "Location description not provided"}
                          </p>
                          {form.location.lat && form.location.lng && (
                            <div className="flex items-center gap-2 mt-3">
                              <div className="w-2 h-2 bg-purple-400 rounded-full"></div>
                              <p className="text-purple-300 text-xs font-mono">
                                {parseFloat(form.location.lat).toFixed(4)}, {parseFloat(form.location.lng).toFixed(4)}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Academy Info Card - Enhanced */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-gray-500/20 via-slate-500/20 to-zinc-500/20 border border-gray-500/30 rounded-3xl p-6 shadow-xl hover:shadow-gray-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-gray-500 to-slate-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-2xl">🏫</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-2">Academy</h4>
                        <div className="space-y-2">
                          <p className="text-gray-200 font-semibold text-lg">
                            {currentUser?.academy?.name || 'Academy'}
                          </p>
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            <p className="text-gray-300 text-sm">
                              Match Organizer
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Contact & Duration Card - Full Width */}
                {(form.phone || form.duration) && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-r from-orange-500/20 via-red-500/20 to-pink-500/20 border border-orange-500/30 rounded-3xl p-6 shadow-xl hover:shadow-orange-500/10 transition-all duration-300"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center shadow-lg">
                        <div className="text-2xl">📞</div>
                      </div>
                      <div className="flex-1">
                        <h4 className="text-white font-bold text-xl mb-3">Contact & Duration</h4>
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10 space-y-3">
                          {form.phone && (
                            <div className="flex items-center gap-3">
                              <Phone className="w-5 h-5 text-orange-300" />
                              <span className="text-orange-200 font-medium">{form.phone}</span>
                            </div>
                          )}
                          {form.duration && (
                            <div className="flex items-center gap-3">
                              <span className="text-orange-300 text-xl">⏱️</span>
                              <span className="text-orange-200 font-medium">{form.duration} {form.duration === '1' ? 'hour' : 'hours'}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Enhanced Warning/Confirmation Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="bg-gradient-to-r from-amber-500/10 via-yellow-500/10 to-orange-500/10 border border-amber-500/20 rounded-3xl p-6"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-2xl flex items-center justify-center shadow-lg">
                      <div className="text-xl">⚠️</div>
                    </div>
                    <div className="flex-1">
                      <h5 className="text-amber-300 font-bold text-lg mb-2">Final Check</h5>
                      <p className="text-amber-200 text-sm leading-relaxed mb-3">
                        Please ensure all information is correct. Once submitted, your match request will be visible to other academies in your area.
                      </p>
                      <div className="flex items-center gap-2 text-amber-300 text-sm">
                        <div className="w-2 h-2 bg-amber-400 rounded-full"></div>
                        <span>You can edit or cancel this request later if needed</span>
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Quick Stats */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-2xl p-4"
                >
                  <div className="flex items-center justify-center gap-8 text-center">
                    <div>
                      <div className="text-2xl font-bold text-indigo-300">
                        {form.date && form.time ? "✅" : "❌"}
                      </div>
                      <div className="text-xs text-indigo-200">Schedule</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-green-300">
                        {(Array.isArray(form.ageGroup) && form.ageGroup.length > 0) ? "✅" : "❌"}
                      </div>
                      <div className="text-xs text-green-200">Details</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-purple-300">
                        {form.location.address ? "✅" : "❌"}
                      </div>
                      <div className="text-xs text-purple-200">Location</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-orange-300">
                        {(form.phone && form.duration) ? "✅" : "❌"}
                      </div>
                      <div className="text-xs text-orange-200">Contact & Duration</div>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="text-sm text-red-400 mt-3">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(s => s - 1)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20"
            >
              Back
            </button>
          )}

          {step < maxStep ? (
            <button
              disabled={!canProceed()}
              onClick={() => setStep(s => s + 1)}
              className={`px-4 py-2 rounded-xl ${
                canProceed()
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-green-500/40 cursor-not-allowed"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}

// --- Main Component ---
import { useAuth } from "../../context/AuthContext"

export default function AcademyMatchRequests() {
  const { t } = useLanguage();
  const { user: session, loading } = useAuth()
  const [requests, setRequests] = useState([])
  const [openCardId, setOpenCardId] = useState(null)
  const [openAdd, setOpenAdd] = useState(false)

  useEffect(() => {
    const fetchRequests = async () => {
      const data = await matchApi.fetchRequests()
      setRequests(data)
    }

    fetchRequests()

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchRequests, 30000)

    return () => clearInterval(interval)
  }, [])

  const grouped = useMemo(
    () => ({
      available: requests.filter((r) => r.status === "available"),
      confirmed: requests.filter((r) => r.status === "confirmed"),
      finished: requests.filter((r) => r.status === "finished"),
    }),
    [requests]
  )

  async function onDragEnd(result) {
    const { destination, source, draggableId } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId) return

    const id = draggableId
    const item = requests.find((r) => r.id === id)
    if (!item || item.creatorId !== session?.id) return

    // Map frontend column names to backend status values
    const statusMapping = {
      available: "requested",
      confirmed: "confirmed",
      finished: "finished"
    }

    const backendStatus = statusMapping[destination.droppableId] || destination.droppableId

    setRequests((s) =>
      s.map((r) => (r.id === id ? { ...r, status: destination.droppableId } : r))
    )
    await matchApi.updateStatus(id, backendStatus)
  }

  async function handleAcceptRequest(id) {
    const item = requests.find((r) => r.id === id)
    if (!item || item.creatorId === (session?.id || session?.userId)) return false

    setRequests((s) =>
      s.map((r) =>
        r.id === id ? { ...r, status: "confirmed", acceptedBy: session.academyId } : r
      )
    )
    try {
      await matchApi.acceptRequest(id, session.academyId)
      return true
    } catch (error) {
      console.error("Failed to accept match request:", error)
      return false
    }
  }

  function handleCreateRequest(newReq) {
    setRequests((s) => [...s, newReq])
  }

  async function handleDeleteRequest(id) {
    if (!window.confirm("Are you sure you want to delete this match request?")) {
      return false;
    }
    
    try {
      await matchApi.deleteRequest(id);
      setRequests((s) => s.filter((r) => r.id !== id));
      return true;
    } catch (error) {
      console.error("Failed to delete match request:", error);
      alert("Failed to delete match request. Please try again.");
      return false;
    }
  }

  const selectedRequest = requests.find((r) => r.id === openCardId)

  if (loading) return <p>Loading...</p>
  if (!session) return <p>Please log in to view match requests.</p>

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-700 to-indigo-900 rounded-3xl p-8 border border-white/10 shadow-2xl"
      >
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">{t("academyMatch.title")}</h1>
            <p className="text-white/80 text-lg">
              {t("academyMatch.description")}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <motion.button
              onClick={() => setOpenAdd(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-green-500/25 border-2 border-white/20 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              {t("academyMatch.newRequest")}
            </motion.button>
            <div className="text-6xl opacity-20">⚽</div>
          </div>
        </div>
      </motion.div>

      {/* Board */}
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex flex-col md:flex-row gap-6">
          <BoardColumn
            id="available"
            title="Available"
            items={grouped.available}
            onOpen={setOpenCardId}
            onDelete={handleDeleteRequest}
            currentUser={session}
            headerColors="bg-gradient-to-r from-blue-600 to-blue-700"
          />
          <BoardColumn
            id="confirmed"
            title="Confirmed"
            items={grouped.confirmed}
            onOpen={setOpenCardId}
            onDelete={handleDeleteRequest}
            currentUser={session}
            headerColors="bg-gradient-to-r from-green-500 to-green-600"
          />
          <BoardColumn
            id="finished"
            title="Finished"
            items={grouped.finished}
            onOpen={setOpenCardId}
            onDelete={handleDeleteRequest}
            currentUser={session}
            headerColors="bg-gradient-to-r from-purple-500 to-purple-600"
          />
        </div>
      </DragDropContext>

      {/* Modals */}
      <AnimatePresence>
        {openCardId && selectedRequest && (
          <MatchCardModal
            key={selectedRequest.id}
            match={selectedRequest}
            session={session}
            onClose={() => setOpenCardId(null)}
            onAccept={handleAcceptRequest}
            onDelete={handleDeleteRequest}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {openAdd && (
          <ErrorBoundary onClose={() => setOpenAdd(false)}>
            <AddMatchModal
              open={openAdd}
              onClose={() => setOpenAdd(false)}
              onCreate={handleCreateRequest}
              currentUser={session}
            />
          </ErrorBoundary>
        )}
      </AnimatePresence>
    </div>
  )
}
