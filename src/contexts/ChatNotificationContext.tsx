'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useSession } from 'next-auth/react'
import ChatNotification from '@/components/ChatNotification'

interface ChatNotificationData {
  id: string
  sender: {
    id: string
    username: string
  }
  message: string
  roomId: string
  timestamp: Date
}

interface ChatNotificationContextType {
  unreadCounts: { [roomId: string]: number }
  showNotification: (notification: ChatNotificationData) => void
  markAsRead: (roomId: string) => void
  openChat: (roomId: string) => void
  setOpenChatCallback: (callback: (roomId: string) => void) => void
  setChatOpen: (isOpen: boolean, roomId?: string) => void
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined)

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: string]: number }>({})
  const [currentNotification, setCurrentNotification] = useState<ChatNotificationData | null>(null)
  const [openChatCallback, setOpenChatCallback] = useState<((roomId: string) => void) | null>(null)
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set())
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [openChatRoomId, setOpenChatRoomId] = useState<string | null>(null)
  const [lastNotificationTime, setLastNotificationTime] = useState<{ [messageId: string]: number }>({})

  // Load shown notifications from localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Clear old notifications to start fresh
      localStorage.removeItem('shownNotifications')
      setShownNotifications(new Set())
    }
  }, [])

  // Save shown notifications to localStorage
  const saveShownNotifications = (notifications: Set<string>) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('shownNotifications', JSON.stringify(Array.from(notifications)))
    }
  }

  // Poll for unread messages
  useEffect(() => {
    if (!session?.user?.id) return

    const pollUnreadMessages = async () => {
      try {
        console.log('Polling for unread messages...')
        // Use AbortController to prevent interference with navigation
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout
        
        const response = await fetch('/api/chat/unread', {
          signal: controller.signal,
          cache: 'no-cache'
        })
        
        clearTimeout(timeoutId)
        
        if (response.ok) {
          const { unreadMessages } = await response.json()
          console.log('Unread messages response:', unreadMessages)
          
          // Update unread counts
          const counts: { [roomId: string]: number } = {}
          unreadMessages.forEach((item: any) => {
            counts[item.roomId] = item.unreadCount
          })
          setUnreadCounts(counts)

          // Show notification for new messages using time-based tracking
          unreadMessages.forEach((item: any) => {
            if (item.latestMessage && item.unreadCount > 0) {
              const messageId = item.latestMessage.id
              const messageTime = new Date(item.latestMessage.createdAt).getTime()
              
              // Don't show notification if chat is open for this room
              if (isChatOpen && openChatRoomId === item.roomId) {
                return
              }
              
              // Check if this notification was already shown using time-based tracking
              const lastShownTime = lastNotificationTime[messageId] || 0
              const timeSinceLastShown = Date.now() - lastShownTime
              
              // Only show if not shown in the last 10 seconds (prevent duplicates)
              if (timeSinceLastShown > 10000) {
                console.log('Showing notification for message:', item.latestMessage)
                const notification: ChatNotificationData = {
                  id: item.latestMessage.id,
                  sender: item.latestMessage.sender,
                  message: item.latestMessage.message,
                  roomId: item.roomId,
                  timestamp: new Date(item.latestMessage.createdAt)
                }
                
                showNotification(notification)
                
                // Update tracking
                setLastNotificationTime(prev => ({
                  ...prev,
                  [messageId]: Date.now()
                }))
                
                // Clean up old tracking data (keep last 100)
                setLastNotificationTime(prev => {
                  const entries = Object.entries(prev)
                  if (entries.length > 100) {
                    const recentEntries = entries.slice(-50)
                    return Object.fromEntries(recentEntries)
                  }
                  return prev
                })
              }
            }
          })
        } else {
          console.error('Failed to fetch unread messages:', response.status, response.statusText)
        }
      } catch (error) {
        // Silently handle errors to not interfere with navigation
        if (error.name !== 'AbortError') {
          console.error('Error polling unread messages:', error)
        }
      }
    }

    // Poll for unread messages every 8 seconds (less frequent to prevent mobile issues)
    const interval = setInterval(pollUnreadMessages, 8000)
    
    return () => {
      clearInterval(interval)
    }
  }, [session?.user?.id, isChatOpen, openChatRoomId])

  const showNotification = (notification: ChatNotificationData) => {
    console.log('Setting current notification:', notification)
    setCurrentNotification(notification)
  }

  const markAsRead = async (roomId: string) => {
    try {
      const response = await fetch('/api/chat/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ roomId })
      })

      if (response.ok) {
        setUnreadCounts(prev => ({
          ...prev,
          [roomId]: 0
        }))
      }
    } catch (error) {
      console.error('Error marking messages as read:', error)
    }
  }

  const openChat = (roomId: string) => {
    if (openChatCallback) {
      openChatCallback(roomId)
    }
  }

  const closeNotification = () => {
    setCurrentNotification(null)
  }

  const setChatOpen = (isOpen: boolean, roomId?: string) => {
    setIsChatOpen(isOpen)
    setOpenChatRoomId(roomId || null)
  }

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCounts,
        showNotification,
        markAsRead,
        openChat,
        setOpenChatCallback,
        setChatOpen
      }}
    >
      {children}
      <ChatNotification
        notification={currentNotification}
        onClose={closeNotification}
        onOpenChat={openChat}
      />
    </ChatNotificationContext.Provider>
  )
}

export function useChatNotifications() {
  const context = useContext(ChatNotificationContext)
  if (context === undefined) {
    throw new Error('useChatNotifications must be used within a ChatNotificationProvider')
  }
  return context
}

// Hook to set the chat opening callback
export function useSetChatCallback(callback: (roomId: string) => void) {
  const context = useContext(ChatNotificationContext)
  if (context === undefined) {
    throw new Error('useSetChatCallback must be used within a ChatNotificationProvider')
  }
  const { setOpenChatCallback } = context
  
  useEffect(() => {
    setOpenChatCallback(() => callback)
  }, [callback, setOpenChatCallback])
}
