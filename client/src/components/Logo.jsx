import React, { useEffect, useState } from 'react'
export default function Logo({ size='text-2xl', stacked=false }){
  const mainSrc = '/assets/Main Logo.jpg'
  const altSrc = '/assets/Outside App Logo.jpg'
  const [hasMain,setHasMain]=useState(true); const [hasAlt,setHasAlt]=useState(true)
  useEffect(()=>{ const i1=new Image(); i1.onload=()=>setHasMain(true); i1.onerror=()=>setHasMain(false); i1.src=mainSrc
    const i2=new Image(); i2.onload=()=>setHasAlt(true); i2.onerror=()=>setHasAlt(false); i2.src=altSrc },[])
  return (
    <div className={`flex items-center ${stacked?'flex-col gap-1':'gap-3'}`}>
      {hasMain ? <img src={mainSrc} alt="DWARLY" className="h-10 w-10 rounded-2xl shadow-glow"/> :
      <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center shadow"><span className="text-white font-bold">D</span></div>}
      <div className={`${size} leading-tight font-extrabold tracking-wide text-white drop-shadow`}>DWARLY
        <div className="text-xs opacity-80">دورلي</div>
      </div>
    </div>
  )
}
