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
  const [currentNotificationId, setCurrentNotificationId] = useState<string | null>(null)

  // Clear notifications on mount
  useEffect(() => {
    setShownNotifications(new Set())
    setCurrentNotificationId(null)
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
        console.log('Polling for unread messages...', { 
          shownNotifications: Array.from(shownNotifications), 
          currentNotificationId,
          isChatOpen,
          openChatRoomId 
        })
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

          // Show notification for new messages - SIMPLE APPROACH
          unreadMessages.forEach((item: any) => {
            if (item.latestMessage && item.unreadCount > 0) {
              const messageId = item.latestMessage.id
              
              // Don't show notification if chat is open for this room
              if (isChatOpen && openChatRoomId === item.roomId) {
                return
              }
              
              // Don't show if already shown or if there's already a notification showing
              if (shownNotifications.has(messageId) || currentNotificationId === messageId) {
                return
              }
              
              console.log('Showing notification for message:', item.latestMessage)
              const notification: ChatNotificationData = {
                id: item.latestMessage.id,
                sender: item.latestMessage.sender,
                message: item.latestMessage.message,
                roomId: item.roomId,
                timestamp: new Date(item.latestMessage.createdAt)
              }
              
              showNotification(notification)
              setCurrentNotificationId(messageId)
              
              // Mark as shown immediately
              setShownNotifications(prev => {
                const newSet = new Set(prev)
                newSet.add(messageId)
                return newSet
              })
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

    // Poll for unread messages every 15 seconds (much less frequent to prevent looping)
    const interval = setInterval(pollUnreadMessages, 15000)
    
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
    setCurrentNotificationId(null)
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
