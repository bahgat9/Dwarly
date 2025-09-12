import React, { useEffect, useState } from "react"
import { Routes, Route, useLocation, Navigate, useNavigate } from "react-router-dom"
import { AnimatePresence, motion } from "framer-motion"

import NavBar from "./components/NavBar.jsx"
import TransitionOverlay from "./components/PageTransition.jsx"
import AdminLayout from "./components/AdminLayout.jsx"
import UserLayout from "./components/UserLayout.jsx"
import AcademyLayout from "./components/AcademyLayout.jsx"

import Home from "./pages/Home.jsx"
import Academies from "./pages/Academies.jsx"
import Matches from "./pages/Matches.jsx"
import JobOpportunities from "./pages/JobOpportunities.jsx"
import AdminAcademies from "./pages/admin/AdminAcademies.jsx"
import Login from "./pages/Login.jsx"
import Signup from "./pages/Signup.jsx"
import AcademyAccessRequest from "./pages/AcademyAccessRequest.jsx"
import AdminRequests from "./pages/AdminRequests.jsx"
import AdminUsers from "./pages/admin/AdminUsers.jsx"

import AdminDashboard from "./pages/admin/AdminDashboard.jsx"
import AcademyDashboard from "./pages/academy/AcademyDashboard.jsx"
import UserDashboard from "./pages/user/UserDashboard.jsx"

import Forbidden from "./pages/Forbidden.jsx"
import LoadingSkeleton from "./components/LoadingSkeleton.jsx" // ✅ skeleton

import { useAuth } from "./context/AuthContext";
import { useLanguage } from "./context/LanguageContext";

// ✅ new academy pages
import AcademyMatchRequests from "./pages/academy/AcademyMatchRequests.jsx"
import MatchRequestModal from "./pages/academy/MatchRequestModal.jsx"
import MatchCardModal from "./pages/academy/MatchCardModal.jsx"
import AcademyRequests from "./pages/academy/AcademyRequests.jsx"
import AcademyPlayers from "./pages/academy/AcademyPlayers.jsx"
import AcademyAnalysis from "./pages/academy/AcademyAnalysis.jsx"
import AcademyJobs from "./pages/academy/AcademyJobs.jsx"

// ✅ new admin academy account page
import CreateAcademyAccount from "./pages/admin/CreateAcademyAccount.jsx"


import { api } from "./api"

const Page = ({ children }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.15 }}
  >
    {children}
  </motion.div>
)

export default function App() {
  const { user: session, loading, logout: authLogout } = useAuth();
  const { t } = useLanguage();
  const [academies, setAcademies] = useState([])
  const [matches, setMatches] = useState([])

  const location = useLocation()
  const navigate = useNavigate()

  // Load basic data (academies + matches)
  async function loadBasics() {
    try {
      const a = await api("/api/academies")
      setAcademies(a)
      const m = await api("/api/matches")
      setMatches(m)
    } catch (e) {
      console.error("Failed to load basics:", e)
    }
  }

  useEffect(() => {
    loadBasics()
  }, [])

  // ✅ Cookie-based logout
  async function logout() {
    try {
      await authLogout()
      navigate("/login")
    } catch (e) {
      console.error("Logout failed", e)
    }
  }

  // ✅ Show skeleton while fetching session
  if (loading) {
    return <LoadingSkeleton />
  }

  return (
    <div className="text-white">
      <TransitionOverlay />

      {/* Public navbar only for non-admin, non-user, non-academy pages */}
      {!location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/user") &&
        !location.pathname.startsWith("/academy") && (
          <NavBar session={session} onLogout={logout} />
        )}

      <main className="min-h-[70vh]">
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* --- Public Pages --- */}
            <Route
              path="/"
              element={
                <Page>
                  {session?.role === "academy" ? (
                    <Navigate to="/academy/dashboard" replace />
                  ) : session?.role === "admin" ? (
                    <Navigate to="/admin/dashboard" replace />
                  ) : (
                    <Home />
                  )}
                </Page>
              }
            />
            <Route path="/academies" element={<Page><Academies session={session} /></Page>} />
            <Route path="/matches" element={<Page><JobOpportunities /></Page>} />
            <Route path="/login" element={<Page><Login academies={academies} /></Page>} />
            <Route path="/signup" element={<Page><Signup academies={academies} /></Page>} />
            <Route path="/academy-request" element={<Page><AcademyAccessRequest /></Page>} />

            {/* --- User Layout --- */}
            <Route
              path="/user"
              element={
                session?.role === "user" ? (
                  <Navigate to="/" replace />
                ) : session ? (
                  <Forbidden />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route path="dashboard" element={<Navigate to="/" replace />} />
              <Route path="academies" element={<Navigate to="/academies" replace />} />
              <Route path="requests" element={<Navigate to="/academy-request" replace />} />
            </Route>

            {/* --- Academy Layout --- */}
            <Route
              path="/academy"
              element={
                session?.role === "academy" ? (
                  <AcademyLayout session={session} onLogout={logout} />
                ) : session ? (
                  <Forbidden />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route path="dashboard" element={<AcademyDashboard session={session} />} />
              <Route path="players" element={<AcademyPlayers session={session} />} />
              <Route path="matches" element={<AcademyMatchRequests session={session} />} />
              <Route path="requests" element={<AcademyRequests session={session} />} />
              <Route path="analysis" element={<AcademyAnalysis session={session} />} />
              <Route path="jobs" element={<AcademyJobs session={session} />} />
            </Route>


            {/* --- Admin Layout --- */}
            <Route
              path="/admin"
              element={
                session?.role === "admin" ? (
                  <AdminLayout session={session} onLogout={logout} />
                ) : session ? (
                  <Forbidden />
                ) : (
                  <Navigate to="/login" replace />
                )
              }
            >
              <Route path="dashboard" element={<AdminDashboard session={session} />} />
              <Route path="academies" element={<AdminAcademies session={session} />} />
              <Route path="matches" element={<Matches session={session} />} />
              <Route path="requests" element={<AdminRequests session={session} />} />
              <Route path="users" element={<AdminUsers session={session} />} />
              <Route path="create-academy-account" element={<CreateAcademyAccount />} />
            </Route>

            {/* --- Fallback --- */}
            <Route
              path="*"
              element={
                <Page>
                  <div className="mx-auto max-w-3xl px-4 py-10">Not Found</div>
                </Page>
              }
            />
          </Routes>
        </AnimatePresence>
      </main>

      {/* Footer only for public pages */}
      {!location.pathname.startsWith("/admin") &&
        !location.pathname.startsWith("/user") &&
        !location.pathname.startsWith("/academy") && (
          <div className="mt-12 border-t border-white/10">
            <div className="mx-auto max-w-7xl px-4 py-8 text-white/80 flex items-center justify-between flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <span className="font-bold">DWARLY</span>
                <span>© {new Date().getFullYear()}</span>
              </div>
              <div className="text-sm">{t("public.madeForEgyptian")}</div>
            </div>
          </div>
        )}
    </div>
  )
}
