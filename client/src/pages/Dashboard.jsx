// src/pages/Dashboard.jsx
import React from "react"
import AdminDashboard from "./admin/AdminDashboard"
import UserDashboard from "./user/UserDashboard"
import AcademyDashboard from "./academy/AcademyDashboard"

export default function Dashboard({ session }) {
  if (!session) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-white">
        Please login to access your dashboard.
      </div>
    )
  }

  const role = session.role

  if (role === "admin") {
    return <AdminDashboard session={session} />
  }

  if (role === "academy") {
    return <AcademyDashboard session={session} />
  }

  if (role === "user") {
    return <UserDashboard session={session} />
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 text-white">
      Unknown role. Please contact support.
    </div>
  )
}
