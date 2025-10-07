'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Listing } from '@/lib/supabase-client'
import SwipeCard from '@/components/SwipeCard'
import { LogOut, MessageCircle, Search, Plus } from 'lucide-react'

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'seeker') {
      router.push('/post')
      return
    }

    loadListings()
  }, [user, router])

  const loadListings = async () => {
    try {
      const listingsData = await SupabaseService.getListings()
      setListings(listingsData)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentListing = listings[currentIndex]

    if (direction === 'right' && user) {
      try {
        // Like the listing
        await SupabaseService.likeListing(user.id, currentListing.id)
      } catch (error) {
        console.error('Error liking listing:', error)
      }
    }

    // Move to next listing
    setCurrentIndex(prev => prev + 1)
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des logements...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  const currentListing = listings[currentIndex]
  const nextListing = listings[currentIndex + 1]
  const hasFinished = currentIndex >= listings.length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div>
          <h1 className="text-xl font-display font-bold text-dark-gray">
            Sublet
          </h1>
          <p className="text-sm text-gray-600">Salut {user.name} ! 👋</p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => router.push('/search')}
            className="p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push('/create-listing')}
            className="p-2 bg-accent/10 text-accent rounded-lg hover:bg-accent/20 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.push('/matches')}
            className="p-2 bg-secondary/10 text-secondary rounded-lg hover:bg-secondary/20 transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
          </button>

          <button
            onClick={handleSignOut}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="p-4">
        {hasFinished ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl font-bold text-dark-gray mb-2">
              Plus de logements !
            </h2>
            <p className="text-gray-600 mb-6">
              Tu as vu tous les appartements disponibles.
              <br />
              Reviens plus tard pour de nouvelles offres !
            </p>
            <button
              onClick={() => router.push('/matches')}
              className="btn-primary"
            >
              Voir mes matchs
            </button>
          </div>
        ) : (
          <div className="relative max-w-sm mx-auto h-[600px]">
            {/* Next card (background) */}
            {nextListing && (
              <SwipeCard
                key={`${nextListing.id}-next`}
                listing={nextListing}
                onSwipe={() => {}}
                isTopCard={false}
              />
            )}

            {/* Current card (top) */}
            {currentListing && (
              <SwipeCard
                key={`${currentListing.id}-current`}
                listing={currentListing}
                onSwipe={handleSwipe}
                isTopCard={true}
              />
            )}
          </div>
        )}

        {!hasFinished && (
          <div className="max-w-sm mx-auto mt-6">
            <div className="text-center text-gray-600 text-sm">
              <p>← Swipe pour passer</p>
              <p>→ Swipe pour liker</p>
            </div>

            <div className="flex justify-center mt-4">
              <div className="bg-gray-200 rounded-full h-2 w-32">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((currentIndex + 1) / listings.length) * 100}%`,
                  }}
                />
              </div>
            </div>

            <p className="text-center text-gray-500 text-sm mt-2">
              {currentIndex + 1} / {listings.length}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}