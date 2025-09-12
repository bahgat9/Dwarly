// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

axios.defaults.withCredentials = true // always send cookies
const fallbackBase = import.meta.env.VITE_API_URL || "https://dwarly-production.up.railway.app"
if (typeof window !== "undefined") {
  // Always use relative in browser so calls go through Vercel rewrites (first-party cookies)
  axios.defaults.baseURL = ""
} else {
  axios.defaults.baseURL = fallbackBase
}

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [token, setToken] = useState(() => (typeof window !== 'undefined' ? localStorage.getItem('dwarly_token') : null))

  // Attach token to axios if present
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      delete axios.defaults.headers.common['Authorization']
    }
  }, [token])

  // Fetch current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/session")
        setUser(res.data.user)
        // If server re-issued token on session, store it
        if (res.data.token) {
          if (typeof window !== 'undefined') {
            localStorage.setItem('dwarly_token', res.data.token)
          }
          setToken(res.data.token)
        }
      } catch (err) {
        console.error("AuthContext session error:", err)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }
    fetchUser()
  }, [])

  const login = async (email, password) => {
    const res = await axios.post("/api/auth/login", { email, password })
    setUser(res.data.user)
    if (res.data.token) {
      setToken(res.data.token)
      if (typeof window !== 'undefined') localStorage.setItem('dwarly_token', res.data.token)
    }
    return res.data.user
  }

  const register = async (name, email, password, phone) => {
    const res = await axios.post("/api/auth/register", {
      name,
      email,
      password,
      phone,
      role: "user", // default role unless specified
    })
    setUser(res.data.user)
    return res.data.user
  }

  const logout = async () => {
    await axios.post("/api/auth/logout")
    setUser(null)
    setToken(null)
    if (typeof window !== 'undefined') localStorage.removeItem('dwarly_token')
  }

  const getRole = () => user?.role || null

  return (
    <AuthContext.Provider value={{ user, login, logout, register, getRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
