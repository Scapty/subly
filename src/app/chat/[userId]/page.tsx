'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { User } from '@/lib/supabase-client'
import ChatInterface from '@/components/ChatInterface'

export default function ChatPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [otherUser, setOtherUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadOtherUser()
  }, [user, params.userId])

  const loadOtherUser = async () => {
    try {
      // In a real app, you'd fetch user by ID
      // For now, we'll check if they have a match to validate the chat
      const matches = await SupabaseService.getMatchesForUser(user!.id)
      const relevantMatch = matches.find(match =>
        match.seeker_id === params.userId || match.landlord_id === params.userId
      )

      if (!relevantMatch) {
        router.push('/matches')
        return
      }

      // Get the other user from the match
      const otherUserData = relevantMatch.seeker_id === user!.id
        ? relevantMatch.landlord
        : relevantMatch.seeker

      setOtherUser(otherUserData!)
    } catch (error) {
      console.error('Error loading user:', error)
      router.push('/matches')
    } finally {
      setLoading(false)
    }
  }

  const handleBack = () => {
    router.push('/matches')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du chat...</p>
        </div>
      </div>
    )
  }

  if (!otherUser) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Utilisateur non trouvé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <ChatInterface otherUser={otherUser} onBack={handleBack} />
    </div>
  )
}