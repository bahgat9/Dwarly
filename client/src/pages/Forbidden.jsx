import React from "react"
import { Link } from "react-router-dom"
import { useLanguage } from "../context/LanguageContext"

export default function Forbidden() {
  const { t } = useLanguage()
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] text-center space-y-4">
      <h1 className="text-5xl font-bold text-red-500">403</h1>
      <p className="text-lg text-white/80">
        {t("common.accessDenied")}
      </p>
      <Link
        to="/"
        className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 shadow"
      >
        ⬅️ {t("nav.home")}
      </Link>
    </div>
  )
}
