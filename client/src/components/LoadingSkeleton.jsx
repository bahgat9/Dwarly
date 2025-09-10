import React from "react"

export default function LoadingSkeleton({ lines = 3 }) {
  return (
    <div className="space-y-4">
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className="h-6 rounded-2xl bg-gradient-to-r from-white/10 via-white/20 to-white/10 
                     animate-pulse shadow-lg relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent 
                         animate-shimmer transform -skew-x-12" />
        </div>
      ))}
    </div>
  )
}
