import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Users, Calendar, Check, Clock, FileText } from "lucide-react";
// import AcademyMap from "../../components/AcademyMap"; // Commented out as it's not available
import { api } from "../../api";

const steps = ["Details", "Location", "Confirm"];

export default function MatchRequestModal({ session, onClose, onCreated }) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState({
    date: "",
    time: "",
    ageGroup: [],
    description: "",
    location: { lat: "", lng: "", address: "" },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateLocation(field, value) {
    setForm((prev) => ({
      ...prev,
      location: { ...prev.location, [field]: value },
    }));
  }

  function canProceed() {
    if (step === 0) return form.date && form.time && (form.ageGroup && form.ageGroup.length > 0) && form.description;
    if (step === 1) return form.location.address && form.location.lat && form.location.lng;
    return true;
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      console.log("MatchRequestModal - Form data:", form);
      
      const payload = {
        dateTime: `${form.date}T${form.time}:00Z`,
        ageGroup: Array.isArray(form.ageGroup) ? form.ageGroup.join(", ") : form.ageGroup,
        description: form.description,
        locationDescription: form.location.address,
        locationGeo: {
          lat: parseFloat(form.location.lat),
          lng: parseFloat(form.location.lng),
        },
        homeAway: "home", // Default to home match
        phone: form.phone || "", // Use form phone or empty string
        duration: form.duration || "2", // Use form duration or default
      };
      
      console.log("MatchRequestModal - Sending payload:", payload);
      
      await api("/api/matches", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      onCreated();
      onClose();
    } catch (err) {
      console.error(err);
      setError("Failed to create request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <motion.div
        initial={{ y: 40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        className="bg-gradient-to-br from-blue-600 to-lime-500 w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-blue-700 to-lime-600 rounded-t-3xl">
          <h2 className="text-lg font-bold text-white">New Match Request</h2>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Stepper */}
        <div className="flex justify-center gap-6 px-6 py-4">
          {steps.map((s, i) => (
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
                {i < step ? <Check size={16} /> : i + 1}
              </div>
              <span className="text-sm text-white">{s}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 px-6 py-4">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-sm text-white/80 flex items-center gap-2">
                      <Calendar size={16} /> Match Date
                    </span>
                    <input
                      type="date"
                      value={form.date}
                      onChange={(e) => updateField("date", e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none"
                    />
                  </label>

                  <label className="block">
                    <span className="text-sm text-white/80 flex items-center gap-2">
                      <Clock size={16} /> Match Time
                    </span>
                    <input
                      type="time"
                      value={form.time}
                      onChange={(e) => updateField("time", e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm text-white/80 flex items-center gap-2 mb-3">
                    <Users size={16} /> Age Group
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {[
                      "2010, 2011", "2011, 2012", "2012, 2013", "2013, 2014", 
                      "2014, 2015", "2015, 2016", "2016, 2017", "2017, 2018", 
                      "2018, 2019", "2019, 2020", "2020, 2021", "Adults"
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
                            ? 'bg-green-600 text-white border-green-600'
                            : 'bg-white/10 text-white border-white/20 hover:border-green-500'
                        }`}
                      >
                        {ageGroup}
                      </button>
                    ))}
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-white/80 flex items-center gap-2">
                    <FileText size={16} /> Description
                  </span>
                  <textarea
                    placeholder="Describe the match (e.g. Friendly 7-a-side)"
                    value={form.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={3}
                    className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none resize-none"
                  />
                </label>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="location"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-white/80 mb-2 flex items-center gap-2">
                  <MapPin size={16} /> Select Location
                </p>
                {/* Map Placeholder */}
                <div className="h-64 rounded-xl overflow-hidden bg-gradient-to-br from-slate-700 to-slate-800 border border-white/20 flex items-center justify-center">
                  <div className="text-center text-white/60">
                    <div className="text-4xl mb-2">🗺️</div>
                    <p className="text-sm">Interactive Map Coming Soon</p>
                    <p className="text-xs mt-1">Enter location details below</p>
                  </div>
                </div>

                {/* Manual Location Inputs */}
                <div className="space-y-3">
                  <label className="block">
                    <span className="text-sm text-white/80">Address</span>
                    <input
                      type="text"
                      placeholder="e.g. Cairo Sports Complex"
                      value={form.location.address}
                      onChange={(e) => updateLocation("address", e.target.value)}
                      className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none"
                    />
                  </label>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="block">
                      <span className="text-sm text-white/80">Latitude</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="30.0444"
                        value={form.location.lat}
                        onChange={(e) => updateLocation("lat", e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm text-white/80">Longitude</span>
                      <input
                        type="number"
                        step="any"
                        placeholder="31.2357"
                        value={form.location.lng}
                        onChange={(e) => updateLocation("lng", e.target.value)}
                        className="w-full mt-1 px-3 py-2 bg-white/10 rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-green-500 focus:outline-none"
                      />
                    </label>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-4"
              >
                <p className="text-sm text-white/80">Review your request:</p>
                <div className="bg-white/5 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Calendar size={16} className="text-green-400" />
                    <span className="text-white/80 text-sm">
                      {form.date} at {form.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Users size={16} className="text-green-400" />
                    <span className="text-white/80 text-sm">{form.ageGroup}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin size={16} className="text-green-400" />
                    <span className="text-white/80 text-sm">{form.location.address}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <FileText size={16} className="text-green-400" />
                    <span className="text-white/80 text-sm">{form.description}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && <p className="text-sm text-red-400 mt-3">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/10 flex justify-end gap-3 bg-gradient-to-r from-blue-600 to-lime-500">
          {step > 0 && (
            <button
              onClick={() => setStep((s) => s - 1)}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition-colors"
            >
              Back
            </button>
          )}

          {step < steps.length - 1 ? (
            <button
              disabled={!canProceed()}
              onClick={() => setStep((s) => s + 1)}
              className={`px-4 py-2 rounded-xl transition-colors ${
                canProceed()
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-green-500/40 cursor-not-allowed text-white/60"
              }`}
            >
              Next
            </button>
          ) : (
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-4 py-2 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white transition-colors"
            >
              {loading ? "Submitting..." : "Submit"}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
