'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Listing } from '@/lib/supabase-client'
import { Home, Plus, LogOut, Heart, MessageCircle, Edit, Eye } from 'lucide-react'

export default function Post() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [myListings, setMyListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.profile_completed) {
      router.push('/setup-profile')
      return
    }

    loadMyListings()
  }, [user, router])

  const loadMyListings = async () => {
    if (!user) return

    try {
      const listings = await SupabaseService.getListingsByLandlord(user.id)
      setMyListings(listings)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-display font-bold text-dark-gray">
                🏠 Mes annonces
              </h1>
            </div>

            <div className="flex items-center space-x-3">
              {/* Home */}
              <button
                onClick={() => router.push('/home')}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <Home className="w-5 h-5" />
              </button>

              {/* Messages */}
              <button
                onClick={() => router.push('/matches')}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Profile menu */}
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Create new listing button */}
        <div className="mb-8">
          <button
            onClick={() => router.push('/create-listing')}
            className="w-full btn-primary flex items-center justify-center space-x-2 text-lg py-4"
          >
            <Plus className="w-6 h-6" />
            <span>Créer une nouvelle annonce</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Chargement de vos annonces...</p>
          </div>
        ) : myListings.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-6">
              <Home className="w-16 h-16 mx-auto" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Aucune annonce pour le moment
            </h2>
            <p className="text-gray-600 mb-6">
              Créez votre première annonce pour commencer à recevoir des candidatures
            </p>
            <button
              onClick={() => router.push('/create-listing')}
              className="btn-primary"
            >
              Créer ma première annonce
            </button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">
              Vos annonces ({myListings.length})
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myListings.map((listing) => (
                <div key={listing.id} className="card overflow-hidden">
                  {/* Image */}
                  <div className="relative h-48">
                    <img
                      src={listing.photos[0] || 'https://picsum.photos/400/300?random=default'}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
                      <span className="text-sm font-bold text-primary">
                        {listing.rent_amount || listing.price}€
                      </span>
                    </div>
                    {!listing.is_active && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          Inactive
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-800 mb-2">
                      {listing.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {listing.neighborhood || listing.location}
                    </p>

                    {/* Stats */}
                    <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
                      <span>Créé le {new Date(listing.created_at).toLocaleDateString('fr-FR')}</span>
                      <span>{listing.is_active ? 'Active' : 'Inactive'}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex space-x-2">
                      <button
                        onClick={() => router.push(`/listing/${listing.id}`)}
                        className="flex-1 btn-secondary text-sm py-2 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Voir
                      </button>
                      <button
                        onClick={() => router.push(`/create-listing?edit=${listing.id}`)}
                        className="flex-1 btn-primary text-sm py-2 flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Modifier
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Info section */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-800 mb-3">
            💡 Conseils pour optimiser vos annonces
          </h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>• Ajoutez des photos de qualité pour attirer plus de candidats</li>
            <li>• Décrivez précisément l'ambiance de la colocation</li>
            <li>• Mentionnez les équipements et commodités disponibles</li>
            <li>• Soyez transparents sur les règles de vie en colocation</li>
          </ul>
        </div>
      </div>
    </div>
  )
}