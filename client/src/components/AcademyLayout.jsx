// src/components/AcademyLayout.jsx
import { Outlet, useLocation } from "react-router-dom"
import { useState } from "react"
import AcademySidebar from "./AcademySidebar.jsx"
import AcademyTopbar from "./AcademyTopbar.jsx"

export default function AcademyLayout({ session, onLogout }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen)
  const closeSidebar = () => setSidebarOpen(false)

  return (
    <div className="flex min-h-screen bg-brand-900 text-white">
      {/* Sidebar */}
      <AcademySidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <AcademyTopbar 
          session={session} 
          onLogout={onLogout} 
          onToggleSidebar={toggleSidebar}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}
