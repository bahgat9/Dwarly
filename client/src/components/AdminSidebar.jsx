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

const links = [
  {
    to: "/admin/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    to: "/admin/users",
    label: "Users",
    icon: Users
  },
  {
    to: "/admin/academies",
    label: "Academies",
    icon: Building2
  },
  {
    to: "/admin/create-academy-account",
    label: "Create Academy Account",
    icon: Building2 // you can swap for another Lucide icon if you prefer
  },
  {
    to: "/admin/matches",
    label: "Matches",
    icon: Calendar
  },
  {
    to: "/admin/requests",
    label: "Requests",
    icon: FileText
  }
];


export default function AdminSidebar() {
  return (
    <aside className="w-64 bg-brand-900 border-r border-brand-800 p-4 flex flex-col">
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
  );
}
