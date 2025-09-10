import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
export default function TransitionOverlay(){
  const [show,setShow]=useState(false)
  useEffect(()=>{
    const unlisten = ()=>{}; // router will re-mount, simple timeout trigger from App
    return ()=>unlisten()
  },[])
 useEffect(() => {
  setShow(true);
  const t = setTimeout(() => setShow(false), 1700);
  return () => clearTimeout(t);
}, []); // <-- this is the fix

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center bg-brand-900/80 backdrop-blur">
          <motion.div initial={{scale:.9, rotate:-2}} animate={{scale:1, rotate:0}} exit={{scale:.95, opacity:.7}} transition={{ type:'spring', stiffness:120, damping:14}} className="text-center">
            <div className="text-5xl md:text-6xl font-black text-white tracking-wide bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(90deg, rgba(255,255,255,.35), rgba(255,255,255,1), rgba(255,255,255,.35))', backgroundSize:'200% 100%', animation:'shine 2.2s linear infinite'}}>DWARLY</div>
            <div className="text-2xl md:text-3xl mt-2 text-accent-500 bg-clip-text text-transparent" style={{backgroundImage:'linear-gradient(90deg, rgba(178,255,58,.4), rgba(178,255,58,1), rgba(178,255,58,.4))', backgroundSize:'200% 100%', animation:'shine 2.2s linear infinite'}}>دورلي</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
