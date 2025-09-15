import React from 'react'
import { motion } from 'framer-motion'

export default function RealtimeStatusIndicator({ isActive, lastUpdated }) {
  return (
    <div className="fixed bottom-4 left-4 z-40">
      <div className="flex items-center gap-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2 text-white/70 text-sm">
        <motion.div
          className={`w-2 h-2 rounded-full ${
            isActive ? 'bg-green-400' : 'bg-gray-400'
          }`}
          animate={{
            scale: isActive ? [1, 1.2, 1] : 1,
            opacity: isActive ? [0.7, 1, 0.7] : 0.7
          }}
          transition={{
            duration: 2,
            repeat: isActive ? Infinity : 0
          }}
        />
        <span className="text-xs">
          {isActive ? 'Live updates' : 'Offline'}
        </span>
        {lastUpdated && (
          <span className="text-xs text-white/50">
            • {new Date(lastUpdated).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  )
}
