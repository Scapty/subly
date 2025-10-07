'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Message, User } from '@/lib/supabase-client'
import { Send, ArrowLeft } from 'lucide-react'

interface ChatInterfaceProps {
  otherUser: User
  onBack: () => void
}

export default function ChatInterface({ otherUser, onBack }: ChatInterfaceProps) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const channelRef = useRef<any>(null)

  useEffect(() => {
    if (!user) return

    loadMessages()
    setupRealtimeSubscription()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [user, otherUser])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const loadMessages = async () => {
    if (!user) return

    try {
      const messageData = await SupabaseService.getMessages(user.id, otherUser.id)
      setMessages(messageData)
    } catch (error) {
      console.error('Error loading messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    channelRef.current = SupabaseService.subscribeToMessages(
      user.id,
      otherUser.id,
      (newMessage: Message) => {
        setMessages(prev => [...prev, newMessage])
      }
    )
  }

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !newMessage.trim() || sending) return

    setSending(true)
    try {
      await SupabaseService.sendMessage(user.id, otherUser.id, newMessage.trim())
      setNewMessage('')
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b bg-white shadow-sm">
        <button onClick={onBack} className="mr-3">
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>

        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
            {otherUser.name.charAt(0)}
          </div>
          <div>
            <h3 className="font-semibold text-dark-gray">{otherUser.name}</h3>
            <div className="flex space-x-1">
              {otherUser.interests?.slice(0, 2).map((interest) => (
                <span key={interest} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                  {interest}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">💬</div>
            <p className="text-gray-600">
              Commencez la conversation !
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.sender_id === user?.id ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                  message.sender_id === user?.id
                    ? 'bg-primary text-white rounded-br-sm'
                    : 'bg-gray-100 text-dark-gray rounded-bl-sm'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.sender_id === user?.id ? 'text-white/70' : 'text-gray-500'
                  }`}
                >
                  {formatTime(message.created_at)}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 border-t bg-white">
        <div className="flex space-x-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Tapez votre message..."
            className="flex-1 px-4 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="w-10 h-10 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full flex items-center justify-center transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  )
}