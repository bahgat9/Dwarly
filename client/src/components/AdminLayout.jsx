// src/components/AdminLayout.jsx
import React from "react"
import { Outlet, useLocation, Link } from "react-router-dom"
import { LogOut } from "lucide-react"
import AdminSidebar from "./AdminSidebar"
import AdminTopbar from "./AdminTopbar"

export default function AdminLayout({ session, onLogout }) {
  const location = useLocation()

  // ✅ If not logged in as admin, redirect
  if (!session || session.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-900 text-white">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Access Denied</h1>
          <p className="text-white/60">You must be an admin to view this page.</p>
          <Link
            to="/login"
            className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-brand-900 text-white">
      {/* Sidebar */}
      <AdminSidebar />

      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <AdminTopbar session={session} onLogout={onLogout} />

        {/* Page Content */}
        <main className="flex-1 p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}
