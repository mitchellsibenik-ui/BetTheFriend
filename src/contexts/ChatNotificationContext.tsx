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
}

const ChatNotificationContext = createContext<ChatNotificationContextType | undefined>(undefined)

export function ChatNotificationProvider({ children }: { children: ReactNode }) {
  const { data: session } = useSession()
  const [unreadCounts, setUnreadCounts] = useState<{ [roomId: string]: number }>({})
  const [currentNotification, setCurrentNotification] = useState<ChatNotificationData | null>(null)
  const [openChatCallback, setOpenChatCallback] = useState<((roomId: string) => void) | null>(null)
  const [shownNotifications, setShownNotifications] = useState<Set<string>>(new Set())

  // Poll for unread messages
  useEffect(() => {
    if (!session?.user?.id) return

    const pollUnreadMessages = async () => {
      try {
        const response = await fetch('/api/chat/unread')
        if (response.ok) {
          const { unreadMessages } = await response.json()
          console.log('Chat notification polling - unread messages:', unreadMessages)
          
          // Update unread counts
          const counts: { [roomId: string]: number } = {}
          unreadMessages.forEach((item: any) => {
            counts[item.roomId] = item.unreadCount
          })
          setUnreadCounts(counts)

          // Show notification for new messages using state-based tracking
          unreadMessages.forEach((item: any) => {
            if (item.latestMessage && item.unreadCount > 0) {
              const messageId = item.latestMessage.id
              
              // Check if this notification was already shown using state
              if (!shownNotifications.has(messageId)) {
                console.log('Showing new chat notification:', item.latestMessage)
                const notification: ChatNotificationData = {
                  id: item.latestMessage.id,
                  sender: item.latestMessage.sender,
                  message: item.latestMessage.message,
                  roomId: item.roomId,
                  timestamp: new Date(item.latestMessage.createdAt)
                }
                
                showNotification(notification)
                setShownNotifications(prev => new Set(prev).add(messageId))
              }
            }
          })
        } else {
          console.log('Chat notification polling failed:', response.status)
        }
      } catch (error) {
        console.error('Error polling unread messages:', error)
      }
    }

    // Poll immediately, then every 5 seconds
    pollUnreadMessages()
    const interval = setInterval(pollUnreadMessages, 5000)

    return () => clearInterval(interval)
  }, [session?.user?.id])

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

  return (
    <ChatNotificationContext.Provider
      value={{
        unreadCounts,
        showNotification,
        markAsRead,
        openChat,
        setOpenChatCallback
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
