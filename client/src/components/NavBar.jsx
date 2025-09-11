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
    <div className="sticky top-0 z-40 backdrop-blur bg-brand-800/80 border-b border-white/10">
      <div className="mx-auto max-w-7xl px-3 md:px-4 py-2 md:py-3 flex items-center justify-between">
        <Link to="/" className="hover:opacity-90"><Logo/></Link>
        <div className="hidden md:flex items-center gap-3 text-white">
          <NavLink to="/academies" label={t("nav.academies")} />
          <NavLink to="/matches" label={t("nav.jobs")} />
          <LanguageToggle />
          {session ? (
            <button onClick={onLogout} className="inline-flex items-center gap-2 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 transition shadow"><LogOut size={16}/>{t("nav.logout")}</button>
          ) : (
            <NavLink to="/login" label={<span className="inline-flex items-center gap-2"><LogIn size={16}/>{t("nav.login")}</span>} />
          )}
        </div>
        <button className="md:hidden text-white p-2" onClick={()=>setOpen(v=>!v)}>{open? <X size={20}/>:<Menu size={20}/>}</button>
      </div>
      {open && (
        <div className="md:hidden px-3 pb-4 text-white space-y-2">
          <MobileLink to="/academies" label={t("nav.academies")} onClick={()=>setOpen(false)} />
          <MobileLink to="/matches" label={t("nav.jobs")} onClick={()=>setOpen(false)} />
          <div className="px-3 py-2">
            <LanguageToggle />
          </div>
          {session ? (
            <button onClick={()=>{onLogout(); setOpen(false);}} className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-2xl bg-white/10 hover:bg-white/20 transition shadow"><LogOut size={16}/>{t("nav.logout")}</button>
          ) : (
            <MobileLink to="/login" label={<span className="inline-flex items-center gap-2"><LogIn size={16}/>{t("nav.login")}</span>} onClick={()=>setOpen(false)} />
          )}
        </div>
      )}
    </div>
  )
}
const NavLink = ({ to, label }) => (
  <Link to={to} className="relative group">
    <span className="px-3 py-2 rounded-2xl bg-white/0 group-hover:bg-white/10 transition shadow-sm text-sm">{label}</span>
    <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-accent-500 group-hover:w-full transition-all"/>
  </Link>
);
const MobileLink = ({ to, label, onClick }) => (
  <Link to={to} onClick={onClick} className="block px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition shadow-sm text-sm">{label}</Link>
);
