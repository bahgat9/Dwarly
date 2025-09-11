import React from "react"
import { useLanguage } from "../context/LanguageContext"

export default function LanguageToggle() {
  const { language, switchLanguage, t } = useLanguage()

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => switchLanguage(language === 'en' ? 'ar' : 'en')}
        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
        title={t("lang.switchTo") + " " + (language === 'en' ? t("lang.arabic") : t("lang.english"))}
      >
        <span className="text-sm font-medium">
          {language === 'en' ? 'العربية' : 'English'}
        </span>
        <span className="text-xs opacity-70">
          {language === 'en' ? 'AR' : 'EN'}
        </span>
      </button>
    </div>
  )
}
