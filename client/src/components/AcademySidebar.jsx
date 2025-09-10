import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  FileText,
  BarChart,
  Briefcase
} from "lucide-react";

const links = [
  {
    to: "/academy/dashboard",
    label: "Dashboard",
    icon: LayoutDashboard
  },
  {
    to: "/academy/players",
    label: "Players",
    icon: Users
  },
  {
    to: "/academy/matches",
    label: "Matches",
    icon: Calendar
  },
  {
    to: "/academy/requests",
    label: "Requests",
    icon: FileText
  },
  {
    to: "/academy/analysis",
    label: "Analysis",
    icon: BarChart
  },
  {
    to: "/academy/jobs",
    label: "Jobs",
    icon: Briefcase
  }
];

export default function AcademySidebar() {
  return (
    <aside className="w-64 bg-brand-900 border-r border-brand-800 p-4 flex flex-col">
      {/* Logo / title */}
      <div className="mb-8">
        <h1 className="text-xl font-bold text-white tracking-wide">
          DWARLY Academy
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
