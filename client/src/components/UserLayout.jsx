// src/components/UserLayout.jsx
import { Outlet, NavLink } from "react-router-dom"

export default function UserLayout({ session, onLogout }) {
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 text-white flex flex-col">
        <div className="p-4 border-b border-brand-800">
          <div className="font-bold text-lg">⚽ Player Panel</div>
          <p className="text-sm text-brand-300 mt-1 truncate">
            {session?.name || "Player"}
          </p>
        </div>

        <nav className="flex-1 py-4">
          <NavLink
            to="/user/dashboard"
            className={({ isActive }) =>
              `block px-4 py-2 rounded hover:bg-brand-800 ${
                isActive ? "bg-brand-700 font-semibold" : ""
              }`
            }
          >
            📊 Dashboard
          </NavLink>
          <NavLink
            to="/user/academies"
            className={({ isActive }) =>
              `block px-4 py-2 rounded hover:bg-brand-800 ${
                isActive ? "bg-brand-700 font-semibold" : ""
              }`
            }
          >
            🏟 Academies
          </NavLink>
          <NavLink
            to="/user/matches"
            className={({ isActive }) =>
              `block px-4 py-2 rounded hover:bg-brand-800 ${
                isActive ? "bg-brand-700 font-semibold" : ""
              }`
            }
          >
            📅 Matches
          </NavLink>
          <NavLink
            to="/user/requests"
            className={({ isActive }) =>
              `block px-4 py-2 rounded hover:bg-brand-800 ${
                isActive ? "bg-brand-700 font-semibold" : ""
              }`
            }
          >
            📝 My Requests
          </NavLink>
        </nav>

        <div className="p-4 border-t border-brand-800">
          <button
            onClick={onLogout}
            className="w-full bg-red-600 hover:bg-red-700 px-3 py-2 rounded text-sm font-medium"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 bg-gray-50 overflow-y-auto p-6 text-black">
        <Outlet />
      </main>
    </div>
  )
}
