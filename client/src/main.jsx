import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import 'leaflet/dist/leaflet.css';
import App from './App.jsx'
import './styles.css'
import { AuthProvider } from './context/AuthContext.jsx' // ✅ import

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <AuthProvider>  {/* ✅ wrap the app */}
      <App />
    </AuthProvider>
  </BrowserRouter>
)
