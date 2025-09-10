import React from "react";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export default function AcademyMap({ query, height = 300 }) {
  // If query is lat/lng object → show map
  if (query && typeof query === "object" && "lat" in query && "lng" in query) {
    return (
      <div style={{ height }}>
        <MapContainer center={[query.lat, query.lng]} zoom={14} style={{ height: "100%", width: "100%" }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <Marker position={[query.lat, query.lng]} />
        </MapContainer>
      </div>
    );
  }

  // Fallback for older records that still have plain text
  if (typeof query === "string" && query.trim()) {
    return <div className="text-white/80 text-sm">📍 {query}</div>;
  }

  return <div className="text-white/60 text-sm">No location provided.</div>;
}
