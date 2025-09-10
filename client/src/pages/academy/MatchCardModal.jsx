import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, CheckCircle, Trash2, MapPin, Phone } from "lucide-react";
import AcademyMap from "../../components/AcademyMap.jsx";
import { api } from "../../api";

/* OSM static preview helper */
function osmStatic(lat, lng, w = 800, h = 400, zoom = 14) {
  if (!lat || !lng) return `https://via.placeholder.com/${w}x${h}/4a5568/ffffff?text=No+Location`;

  // Use a working static map service
  const tileSize = 256;
  const scale = Math.pow(2, zoom);
  const worldSize = tileSize * scale;

  const x = Math.floor((lng + 180) / 360 * scale);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * scale);

  // Use OpenStreetMap tiles directly
  return `https://tile.openstreetmap.org/${zoom}/${x}/${y}.png`;
}

export default function MatchCardModal({ match, session, onClose, onAccept, onDelete }) {
  const [busy, setBusy] = useState(false);
  if (!match) return null;

  const matchId = match.id || match._id;
  const isCreator = (match.creatorId === (session?.id || session?.userId));

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

  async function handleAccept() {
    if (busy) return;
    setBusy(true);
    const ok = await onAccept(matchId);
    setBusy(false);
    if (ok) onClose();
  }

  async function handleDelete() {
    if (busy) return;
    setBusy(true);
    const ok = await onDelete(matchId);
    setBusy(false);
    if (ok) onClose();
  }

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="relative w-full max-w-2xl bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-white/20 shadow-2xl p-8 text-white rounded-3xl max-h-[90vh] overflow-y-auto backdrop-blur-sm"
      >
        <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl hover:bg-white/10 transition-colors"><X className="w-5 h-5" /></button>

        {/* Enhanced Header */}
        <div className="bg-gradient-to-r from-blue-600/20 via-purple-600/20 to-pink-600/20 rounded-3xl p-8 mb-8 border border-white/20 shadow-xl backdrop-blur-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden border-3 border-white/30 flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg">
                {match.academy?.logo && match.academy.logo !== '' ? (
                  <img
                    src={match.academy.logo}
                    alt={`${match.academy.name} Logo`}
                    className="w-full h-full object-cover"
                    loading="eager"
                    onLoad={(e) => {
                      e.target.style.display = 'block';
                      e.target.nextSibling.style.display = 'none';
                    }}
onError={(e) => {
  e.target.style.display = 'none';
  if (e.target.nextSibling) {
    e.target.nextSibling.style.display = 'flex';
  }
}}
                  />
                ) : null}
                <div
                  className="w-full h-full flex items-center justify-center text-white font-bold text-xl"
                  style={{ display: match.academy?.logo ? 'none' : 'flex' }}
                >
                  {match.academy?.name?.charAt(0) || 'A'}
                </div>
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full border-3 border-slate-900 flex items-center justify-center shadow-lg">
                <span className="text-white text-sm font-bold">✓</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-2xl font-bold text-white mb-2 bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">{match.academy?.name || match.academyName}</div>
              <div className="text-sm text-white/80 font-medium bg-white/10 px-3 py-1 rounded-full inline-block">{processAgeGroup(match.ageGroup)}</div>

            </div>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-white/70" />
              </div>
              <span className="text-white/80">{match.location?.address || `${match.location?.lat ?? "—"}, ${match.location?.lng ?? "—"}`}</span>
            </div>
            {match.phone && (
              <div className="flex items-center gap-3 text-sm">
                <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                  <Phone className="w-4 h-4 text-white/70" />
                </div>
                <span className="text-white/80">{match.phone}</span>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-blue-300 font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">📅</span>
                Match Date & Time
              </div>
              <div className="font-bold text-lg text-white">{match.date ? new Date(match.date).toLocaleString() : "—"}</div>
            </div>

            <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-green-300 font-semibold mb-2 flex items-center gap-2">
                <span className="text-lg">👥</span>
                Age Group
              </div>
              <div className="font-bold text-lg text-white">{processAgeGroup(match.ageGroup)}</div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-orange-300 font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">📞</span>
                Contact & Duration
              </div>
              <div className="space-y-3">
                {match.phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-orange-400" />
                    <span className="font-bold text-white text-lg">{match.phone}</span>
                  </div>
                )}
                {match.duration && (
                  <div className="flex items-center gap-3">
                    <span className="text-orange-400 text-xl">⏱️</span>
                    <span className="font-bold text-white text-lg">{match.duration} {match.duration === '1' ? 'hour' : 'hours'}</span>
                  </div>
                )}
                {!match.phone && !match.duration && (
                  <div className="font-medium text-white/60">No contact info provided</div>
                )}
              </div>
            </div>
          </div>

          <div>
            <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 rounded-2xl p-6 border border-white/10">
              <div className="text-sm text-purple-300 font-semibold mb-3 flex items-center gap-2">
                <span className="text-lg">📍</span>
                Location Preview
              </div>
              <div className="rounded-xl overflow-hidden border border-white/20 shadow-lg relative">
              {(() => {
                // Get location coordinates
                let lat = match.location?.lat;
                let lng = match.location?.lng;

                // Parse as numbers if they exist
                if (lat && lng) {
                  lat = parseFloat(lat);
                  lng = parseFloat(lng);

                  // Check if valid coordinates
                  if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
                    return (
                      <div
                        className="relative w-full h-44 cursor-pointer group"
                        onClick={() => window.open(`https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}&zoom=16`, '_blank')}
                        title="Click to open location in OpenStreetMap"
                      >
                        {/* Use react-leaflet map component for accurate pin */}
                        <div className="w-full h-44 rounded-xl overflow-hidden border border-white/20 shadow-lg">
                          <AcademyMap query={{ lat, lng }} height={176} />
                        </div>
                        {/* Hover overlay */}
                        <div className="absolute inset-0 bg-black/0 hover:bg-black/10 transition-colors duration-300 flex items-center justify-center opacity-0 hover:opacity-100 rounded-xl">
                          <div className="text-white text-sm font-medium bg-black/60 px-3 py-1 rounded-full backdrop-blur-sm">
                            📍 View on OpenStreetMap
                          </div>
                        </div>
                      </div>
                    );
                  }
                }

                return (
                  <div className="w-full h-44 bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center text-white/60">
                    <div className="text-center">
                      <MapPin className="w-12 h-12 mx-auto mb-3 opacity-50 text-purple-400" />
                      <p className="text-lg font-medium">No location specified</p>
                    </div>
                  </div>
                );
              })()}
              </div>
            </div>
            <div className="mt-6 flex gap-3 justify-end">
            {!isCreator ? (
              <button onClick={handleAccept} disabled={busy} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 flex items-center gap-3 text-white font-semibold shadow-lg hover:shadow-emerald-500/25 transition-all duration-300 transform hover:scale-105">
                <CheckCircle className="w-5 h-5" /> {busy ? "Accepting..." : "Accept Request"}
              </button>
            ) : (
              <>
                {match.status === "confirmed" && (
                  <button
                    onClick={async () => {
                      if (busy) return;
                      setBusy(true);
                      try {
                        await api(`/api/matches/${match.id}/finish`, {
                          method: "POST",
                        });
                        window.location.reload(); // Refresh to update status
                      } catch (error) {
                        console.error(error);
                        alert("Failed to mark match as finished.");
                      }
                      setBusy(false);
                    }}
                    disabled={busy}
                    className="px-6 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 flex items-center gap-3 text-white font-semibold shadow-lg hover:shadow-pink-500/25 transition-all duration-300 transform hover:scale-105"
                  >
                    Finish Match
                  </button>
                )}
                {match.status === "finished" && (
                  <button onClick={handleDelete} disabled={busy} className="px-6 py-3 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 flex items-center gap-3 text-white font-semibold shadow-lg hover:shadow-red-500/25 transition-all duration-300 transform hover:scale-105">
                    <Trash2 className="w-5 h-5" /> {busy ? "Deleting..." : "Delete Request"}
                  </button>
                )}
              </>
            )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
