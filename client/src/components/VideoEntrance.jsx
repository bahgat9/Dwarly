import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

const VideoEntrance = ({ onComplete }) => {
  const { t } = useLanguage()
  const [currentScene, setCurrentScene] = useState(0)
  const [isComplete, setIsComplete] = useState(false)

  const scenes = [
    {
      id: 'logo',
      duration: 2000,
      content: (
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="text-center"
        >
          <div className="text-8xl mb-4">⚽</div>
          <motion.h1
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-6xl font-black text-white mb-2"
          >
            DWARLY
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="text-2xl text-accent-400 font-semibold"
          >
            دورلي
          </motion.div>
        </motion.div>
      )
    },
    {
      id: 'football',
      duration: 2500,
      content: (
        <motion.div className="text-center">
          <motion.div
            initial={{ x: -200, y: 100, rotate: 0 }}
            animate={{ 
              x: [0, 100, 200, 300, 400, 500, 600, 700, 800],
              y: [100, 80, 60, 40, 20, 0, -20, -40, -60],
              rotate: [0, 180, 360, 540, 720, 900, 1080, 1260, 1440]
            }}
            transition={{ duration: 2.5, ease: "easeInOut" }}
            className="text-6xl mb-8"
          >
            ⚽
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1 }}
            className="text-4xl font-bold text-white mb-4"
          >
            {t("public.welcome")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-xl text-white/80"
          >
            {t("public.tagline")}
          </motion.p>
        </motion.div>
      )
    },
    {
      id: 'academies',
      duration: 3000,
      content: (
        <motion.div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-3 gap-8 mb-8"
          >
            {[1, 2, 3].map((i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: i * 0.3, duration: 0.8, ease: "easeOut" }}
                className="bg-gradient-to-br from-brand-700 to-brand-800 rounded-2xl p-6 border border-white/20"
              >
                <div className="text-4xl mb-2">🏆</div>
                <div className="text-white font-semibold">Academy {i}</div>
              </motion.div>
            ))}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-3xl font-bold text-white mb-4"
          >
            {t("public.findAcademies")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-lg text-white/80"
          >
            {t("public.findAcademiesDesc")}
          </motion.p>
        </motion.div>
      )
    },
    {
      id: 'community',
      duration: 2500,
      content: (
        <motion.div className="text-center">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center items-center space-x-4 mb-8"
          >
            {['👥', '⚽', '🏆', '🌟', '💪'].map((emoji, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ 
                  delay: i * 0.2, 
                  duration: 0.6,
                  repeat: 1,
                  repeatType: "reverse"
                }}
                className="text-5xl"
              >
                {emoji}
              </motion.div>
            ))}
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 1 }}
            className="text-3xl font-bold text-white mb-4"
          >
            {t("home.connected")}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-lg text-white/80"
          >
            {t("home.connectedDesc")}
          </motion.p>
        </motion.div>
      )
    },
    {
      id: 'finale',
      duration: 2000,
      content: (
        <motion.div className="text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="mb-8"
          >
            <div className="text-8xl mb-4">🚀</div>
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 1 }}
              className="text-5xl font-black text-white mb-2"
            >
              DWARLY
            </motion.h1>
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 1, duration: 0.8 }}
              className="text-2xl text-accent-400 font-semibold mb-4"
            >
              دورلي
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5, duration: 1 }}
              className="text-xl text-white/80"
            >
              {t("public.aboutUsDesc")}
            </motion.p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2, duration: 1 }}
            className="text-white/60"
          >
            {t("common.loading")}...
          </motion.div>
        </motion.div>
      )
    }
  ]

  useEffect(() => {
    if (currentScene < scenes.length) {
      const timer = setTimeout(() => {
        if (currentScene === scenes.length - 1) {
          setIsComplete(true)
          setTimeout(() => {
            onComplete()
          }, 1000)
        } else {
          setCurrentScene(currentScene + 1)
        }
      }, scenes[currentScene].duration)

      return () => clearTimeout(timer)
    }
  }, [currentScene, scenes.length, onComplete])

  return (
    <AnimatePresence>
      {!isComplete && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-900 via-brand-800 to-brand-900"
        >
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: 0
                }}
                animate={{ 
                  x: Math.random() * window.innerWidth,
                  y: Math.random() * window.innerHeight,
                  opacity: [0, 0.3, 0],
                  scale: [0, 1, 0]
                }}
                transition={{ 
                  duration: 3,
                  repeat: Infinity,
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="absolute w-2 h-2 bg-accent-400 rounded-full"
              />
            ))}
          </div>

          {/* Progress bar */}
          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-80 h-1 bg-white/20 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ 
                width: `${((currentScene + 1) / scenes.length) * 100}%` 
              }}
              transition={{ duration: 0.5 }}
              className="h-full bg-gradient-to-r from-accent-400 to-accent-500 rounded-full"
            />
          </div>

          {/* Scene content */}
          <motion.div
            key={currentScene}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.5 }}
            className="relative z-10 max-w-4xl mx-auto px-8"
          >
            {scenes[currentScene].content}
          </motion.div>

          {/* Skip button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={() => {
              setIsComplete(true)
              onComplete()
            }}
            className="absolute bottom-8 right-8 px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-full border border-white/20 transition-all duration-300"
          >
            Skip Intro
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default VideoEntrance
