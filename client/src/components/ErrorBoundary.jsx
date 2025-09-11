import React from "react"
import { useLanguage } from "../context/LanguageContext"

function ErrorFallback() {
  const { t } = useLanguage()
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-900 text-white p-6">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-2xl font-bold">{t("common.somethingWentWrong")}</h1>
        <p className="text-white/70">{t("common.pleaseRefresh")}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 rounded-lg bg-white text-brand-900 font-semibold"
        >
          {t("common.refresh")}
        </button>
      </div>
    </div>
  )
}

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, info) {
    console.error("Global error boundary caught: ", error, info)
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback />
    }
    return this.props.children
  }
}


