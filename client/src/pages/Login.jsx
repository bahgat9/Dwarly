// src/pages/Login.jsx
import React, { useState } from "react"
import { useNavigate, Link } from "react-router-dom"
import { api } from "../api"
import { useAuth } from "../context/AuthContext"
import { useLanguage } from "../context/LanguageContext"

export default function Login() {
  const { login } = useAuth()
  const { t } = useLanguage()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const user = await login(email, password)

      // redirect based on role
      if (user.role === "admin") navigate("/admin/dashboard")
      else if (user.role === "academy") navigate("/academy/dashboard")
      else navigate("/user/dashboard")
    } catch (err) {
      setError(err.error || err.message || t("auth.invalidCredentials"))
      console.error("Login failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto py-12">
      <h1 className="text-2xl font-bold mb-6 text-brand-600">{t("auth.login")}</h1>
      {error && <p className="text-red-500 mb-2">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="email"
          placeholder={t("auth.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full p-2 rounded bg-white/10"
          required
          autoFocus
        />
        <input
          type="password"
          placeholder={t("auth.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full p-2 rounded bg-white/10"
          required
          minLength={6}
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-gradient-to-r from-brand-600 to-accent-500 text-white p-2 rounded"
        >
          {loading ? t("common.loading") : t("auth.loginButton")}
        </button>
      </form>

      <p className="text-sm text-white/70 mt-4 text-center">
        {t("auth.dontHaveAccount")}{" "}
        <Link to="/signup" className="text-blue-400 hover:underline">
          {t("auth.signup")}
        </Link>
      </p>
    </div>
  )
}
