import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css';
import App from './App.jsx'
import './styles.css'
import { AuthProvider } from './context/AuthContext.jsx' // ✅ import
import { LanguageProvider } from './context/LanguageContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <LanguageProvider>
      <AuthProvider>  {/* ✅ wrap the app */}
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </LanguageProvider>
  </BrowserRouter>
)
