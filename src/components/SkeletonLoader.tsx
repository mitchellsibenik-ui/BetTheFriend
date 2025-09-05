import React from 'react'

interface SkeletonLoaderProps {
  type: 'card' | 'list' | 'button' | 'text' | 'avatar'
  count?: number
  className?: string
}

export default function SkeletonLoader({ type, count = 1, className = '' }: SkeletonLoaderProps) {
  const renderSkeleton = () => {
    switch (type) {
      case 'card':
        return (
          <div className={`bg-white/5 rounded-lg p-4 animate-pulse ${className}`}>
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-white/10 rounded-full"></div>
              <div className="flex-1">
                <div className="h-4 bg-white/10 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/10 rounded w-1/2"></div>
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded w-full"></div>
              <div className="h-3 bg-white/10 rounded w-2/3"></div>
            </div>
          </div>
        )
      
      case 'list':
        return (
          <div className={`space-y-3 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-lg p-3 animate-pulse">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                    <div className="space-y-1">
                      <div className="h-4 bg-white/10 rounded w-24"></div>
                      <div className="h-3 bg-white/10 rounded w-16"></div>
                    </div>
                  </div>
                  <div className="h-6 bg-white/10 rounded w-16"></div>
                </div>
              </div>
            ))}
          </div>
        )
      
      case 'button':
        return (
          <div className={`bg-white/10 rounded-lg py-3 px-4 animate-pulse ${className}`}>
            <div className="h-4 bg-white/10 rounded w-20"></div>
          </div>
        )
      
      case 'text':
        return (
          <div className={`space-y-2 ${className}`}>
            {Array.from({ length: count }).map((_, i) => (
              <div key={i} className="h-4 bg-white/10 rounded animate-pulse" style={{ width: `${Math.random() * 40 + 60}%` }}></div>
            ))}
          </div>
        )
      
      case 'avatar':
        return (
          <div className={`w-10 h-10 bg-white/10 rounded-full animate-pulse ${className}`}></div>
        )
      
      default:
        return <div className={`bg-white/10 rounded animate-pulse ${className}`}></div>
    }
  }

  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          {renderSkeleton()}
        </div>
      ))}
    </>
  )
}
