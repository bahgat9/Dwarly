import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { LogIn, LogOut, Menu, X } from 'lucide-react'
import Logo from './Logo.jsx'
import LanguageToggle from './LanguageToggle.jsx'
import { useLanguage } from '../context/LanguageContext'

export default function NavBar({ session, onLogout }){
  const [open,setOpen]=useState(false)
  const { t } = useLanguage()
  
  return (
    <div className="sticky top-0 z-40 backdrop-blur-md bg-brand-800/90 border-b border-white/10 shadow-lg">
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-3 md:py-4 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90 transition-opacity duration-200">
          <Logo/>
        </Link>
        <div className="hidden md:flex items-center gap-4 text-white">
          <NavLink to="/academies" label={t("nav.academies")} />
          <NavLink to="/job-opportunities" label={t("nav.jobs")} />
          <LanguageToggle />
          {session ? (
            <div className="flex items-center gap-3">
              <div className="text-sm text-white/70">
                {session.role === 'admin' ? t('admin.panel') : session.role === 'academy' ? t('academy.panel') : t('common.user')}
              </div>
              <button 
                onClick={onLogout} 
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200 shadow-sm border border-red-500/30"
              >
                <LogOut size={16}/>{t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <NavLink to="/login" label={<span className="inline-flex items-center gap-2"><LogIn size={16}/>{t("nav.login")}</span>} />
              <Link 
                to="/signup" 
                className="px-4 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold hover:bg-accent-400 transition-all duration-200 shadow-sm"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}
        </div>
        <button 
          className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors duration-200" 
          onClick={()=>setOpen(v=>!v)}
          aria-label={t("common.open")}
        >
          {open? <X size={20}/>:<Menu size={20}/>}
        </button>
      </div>
      {open && (
        <div className="md:hidden px-3 pb-4 text-white space-y-3 bg-brand-800/95 backdrop-blur-md border-t border-white/10">
          <MobileLink to="/academies" label={t("nav.academies")} onClick={()=>setOpen(false)} />
          <MobileLink to="/job-opportunities" label={t("nav.jobs")} onClick={()=>setOpen(false)} />
          <div className="px-3 py-2">
            <LanguageToggle />
          </div>
          {session ? (
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm text-white/70">
                {session.role === 'admin' ? t('admin.panel') : session.role === 'academy' ? t('academy.panel') : t('common.user')}
              </div>
              <button 
                onClick={()=>{onLogout(); setOpen(false);}} 
                className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 transition-all duration-200 shadow-sm border border-red-500/30"
              >
                <LogOut size={16}/>{t("nav.logout")}
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <MobileLink to="/login" label={<span className="inline-flex items-center gap-2"><LogIn size={16}/>{t("nav.login")}</span>} onClick={()=>setOpen(false)} />
              <Link 
                to="/signup" 
                onClick={()=>setOpen(false)}
                className="block w-full px-3 py-2 rounded-xl bg-accent-500 text-brand-900 font-semibold hover:bg-accent-400 transition-all duration-200 shadow-sm text-center"
              >
                {t("nav.signup")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
const NavLink = ({ to, label }) => (
  <Link to={to} className="relative group">
    <span className="px-4 py-2 rounded-xl bg-white/0 group-hover:bg-white/10 transition-all duration-200 shadow-sm text-sm font-medium">{label}</span>
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-500 group-hover:w-full transition-all duration-300"/>
  </Link>
);
const MobileLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} className="block px-4 py-3 rounded-xl bg-white/10 hover:bg-white/20 transition-all duration-200 shadow-sm text-sm font-medium">{label}</Link>
);
