'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline'

interface ChatNotificationProps {
  notification: {
    id: string
    sender: {
      id: string
      username: string
    }
    message: string
    roomId: string
    timestamp: Date
  } | null
  onClose: () => void
  onOpenChat: (roomId: string) => void
}

export default function ChatNotification({ notification, onClose, onOpenChat }: ChatNotificationProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (notification) {
      console.log('ChatNotification: Received notification, setting visible:', notification)
      setIsVisible(true)
      
      // Sound removed as requested
      
      // Auto-hide after 3.5 seconds
      const timer = setTimeout(() => {
        console.log('ChatNotification: Auto-hiding notification')
        setIsVisible(false)
        setTimeout(onClose, 300) // Wait for animation to complete
      }, 3500)

      return () => clearTimeout(timer)
    }
  }, [notification, onClose])

  if (!notification || !isVisible) return null

  const handleClick = async () => {
    // Add haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(50)
    }
    
    console.log('Notification clicked, opening chat for room:', notification.roomId)
    
    // Close notification first
    onClose()
    
    // Small delay to ensure notification closes before opening chat
    setTimeout(() => {
      onOpenChat(notification.roomId)
    }, 100)
  }

  const truncateMessage = (message: string, maxLength: number = 50) => {
    return message.length > maxLength ? message.substring(0, maxLength) + '...' : message
  }

  return (
    <div className="fixed top-4 right-4 sm:top-4 sm:right-4 z-[9999] transform transition-all duration-300 ease-out max-w-[calc(100vw-2rem)] sm:max-w-sm animate-in slide-in-from-right-5 fade-in">
      <div 
        className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-2xl border border-white/20 backdrop-blur-xl p-3 sm:p-4 cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 touch-manipulation"
        onClick={handleClick}
      >
        <div className="flex items-start gap-2 sm:gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white/20 rounded-full flex items-center justify-center">
              <ChatBubbleLeftRightIcon className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <p className="text-white font-semibold text-xs sm:text-sm truncate">
                {notification.sender.username}
              </p>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onClose()
                }}
                className="flex-shrink-0 text-white/70 hover:text-white transition-colors p-1"
              >
                <XMarkIcon className="w-3 h-3 sm:w-4 sm:h-4" />
              </button>
            </div>
            
            <p className="text-white/90 text-xs sm:text-sm leading-relaxed">
              {truncateMessage(notification.message, 40)}
            </p>
            
            <p className="text-white/60 text-xs mt-1">
              Tap to reply
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
