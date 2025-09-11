// src/components/AdminSidebar.jsx
import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Building2,
  Calendar,
  FileText
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

export default function AdminSidebar({ isOpen, onClose }) {
  const { t } = useLanguage();

  const links = [
    {
      to: "/admin/dashboard",
      label: t("admin.dashboard"),
      icon: LayoutDashboard
    },
    {
      to: "/admin/users",
      label: t("admin.users"),
      icon: Users
    },
    {
      to: "/admin/academies",
      label: t("admin.academies"),
      icon: Building2
    },
    {
      to: "/admin/create-academy-account",
      label: t("admin.createAcademy"),
      icon: Building2
    },
    {
      to: "/admin/matches",
      label: t("admin.matches"),
      icon: Calendar
    },
    {
      to: "/admin/requests",
      label: t("admin.requests"),
      icon: FileText
    }
  ];
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed md:relative inset-y-0 left-0 z-50 md:z-auto
        w-64 bg-brand-900 border-r border-brand-800 p-4 flex-col
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        flex
      `}>
      {/* Logo / title */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white tracking-wide">
          DWARLY&nbsp;Admin
        </h1>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                isActive
                  ? "bg-brand-700 text-white"
                  : "text-white/70 hover:bg-brand-800 hover:text-white"
              }`
            }
          >
            <Icon size={18} />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>
      </aside>
    </>
  );
}
