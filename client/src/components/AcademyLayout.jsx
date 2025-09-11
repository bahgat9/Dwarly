// src/components/AcademyLayout.jsx
import { Outlet, useLocation } from "react-router-dom"
import AcademySidebar from "./AcademySidebar.jsx"
import AcademyTopbar from "./AcademyTopbar.jsx"

export default function AcademyLayout({ session, onLogout }) {
  const location = useLocation()

  return (
    <div className="flex min-h-screen bg-brand-900 text-white">
      {/* Sidebar */}
      <AcademySidebar />

      {/* Main Area */}
      <div className="flex flex-col flex-1">
        {/* Topbar */}
        <AcademyTopbar session={session} onLogout={onLogout} />

        {/* Page Content */}
        <main className="flex-1 p-4 md:p-6">
          <Outlet key={location.pathname} />
        </main>
      </div>
    </div>
  )
}
