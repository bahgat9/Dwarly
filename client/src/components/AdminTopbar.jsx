// src/components/AdminTopbar.jsx
import React from "react";
import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";

export default function AdminTopbar({ session, onLogout }) {
  const location = useLocation();

  // Map route → page title
  const titles = {
    "/admin/dashboard": "Dashboard",
    "/admin/users": "Users",
    "/admin/academies": "Academies",
    "/admin/matches": "Matches",
    "/admin/requests": "Player Requests"
  };

  const pageTitle = titles[location.pathname] || "Admin Panel";

  return (
    <header className="flex items-center justify-between bg-brand-900 border-b border-brand-800 px-6 py-4">
      {/* Page title */}
      <h2 className="text-lg font-semibold tracking-wide">{pageTitle}</h2>

      {/* Right side: user + logout */}
      <div className="flex items-center gap-4">
        <span className="text-white/80 text-sm">
          👤 {session?.name || "Admin"}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
        >
          <LogOut size={16} /> Logout
        </button>
      </div>
    </header>
  );
}
