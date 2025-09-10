// client/src/context/AuthContext.jsx
import { createContext, useContext, useState, useEffect } from "react"
import axios from "axios"

axios.defaults.withCredentials = true // always send cookies
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:4000"

const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Fetch current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get("/api/auth/session")
        setUser(res.data.user)
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
  }

  const getRole = () => user?.role || null

  return (
    <AuthContext.Provider value={{ user, login, logout, register, getRole, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
