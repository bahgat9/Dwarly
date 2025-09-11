// src/components/AdminTopbar.jsx
import React from "react";
import { LogOut, Menu } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../context/LanguageContext";
import LanguageToggle from "./LanguageToggle";

export default function AdminTopbar({ session, onLogout, onToggleSidebar }) {
  const location = useLocation();
  const { t } = useLanguage();

  // Map route → page title
  const titles = {
    "/admin/dashboard": t("admin.dashboard"),
    "/admin/users": t("admin.users"),
    "/admin/academies": t("admin.academies"),
    "/admin/matches": t("admin.matches"),
    "/admin/requests": t("admin.requests")
  };

  const pageTitle = titles[location.pathname] || t("admin.panel");

  return (
    <header className="flex items-center justify-between bg-brand-900 border-b border-brand-800 px-4 md:px-6 py-4">
      {/* Left side: mobile menu + page title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-2 hover:bg-brand-800 rounded-lg transition"
        >
          <Menu size={20} />
        </button>
        <h2 className="text-lg font-semibold tracking-wide">{pageTitle}</h2>
      </div>

      {/* Right side: language toggle + user + logout */}
      <div className="flex items-center gap-2 md:gap-4">
        <LanguageToggle />
        <span className="text-white/80 text-sm hidden sm:block">
          👤 {session?.name || "Admin"}
        </span>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition"
        >
          <LogOut size={16} /> <span className="hidden sm:inline">{t("auth.logoutButton")}</span>
        </button>
      </div>
    </header>
  );
}
