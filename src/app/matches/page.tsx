'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Match } from '@/lib/supabase-client'
import { ArrowLeft, Heart, Home, MessageCircle, MapPin, Euro } from 'lucide-react'

export default function Matches() {
  const { user } = useAuth()
  const router = useRouter()
  const [matches, setMatches] = useState<Match[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const loadMatches = useCallback(async () => {
    if (!user) return

    try {
      const userMatches = await SupabaseService.getMatchesForUser(user.id)
      setMatches(userMatches)
    } catch (error) {
      console.error('Error loading matches:', error)
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadMatches()
  }, [user, router, loadMatches])

  const handleBack = () => {
    if (user?.role === 'seeker') {
      router.push('/home')
    } else {
      router.push('/post')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des matchs...</p>
        </div>
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center">
          <button onClick={handleBack} className="mr-3">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-display font-bold text-dark-gray">
              Mes Matchs
            </h1>
            <p className="text-sm text-gray-600">{matches.length} match{matches.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        <Heart className="w-6 h-6 text-primary" />
      </div>

      <div className="p-4 max-w-md mx-auto">
        {matches.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">💔</div>
            <h2 className="text-2xl font-bold text-dark-gray mb-2">
              Aucun match pour l'instant
            </h2>
            <p className="text-gray-600 mb-6">
              {user.role === 'seeker'
                ? 'Continue à swiper pour trouver ton logement idéal !'
                : 'Sois patient, tes futurs colocataires arrivent !'
              }
            </p>
            <button
              onClick={handleBack}
              className="btn-primary"
            >
              {user.role === 'seeker' ? 'Continuer à swiper' : 'Retour'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-dark-gray">
                Félicitations !
              </h2>
              <p className="text-gray-600">
                Tu as des matchs ! C'est le moment de connecter.
              </p>
            </div>

            {matches.map((match) => (
              <div key={match.id} className="card p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-start space-x-4">
                  {/* Listing image */}
                  <div className="relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                    <Image
                      src={match.listing?.photos[0] || 'https://picsum.photos/400/300?random=default'}
                      alt={match.listing?.title || 'Listing'}
                      fill
                      className="object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold text-dark-gray mb-1 truncate">
                          {match.listing?.title}
                        </h3>

                        <div className="flex items-center text-gray-600 text-sm mb-2">
                          <MapPin className="w-3 h-3 mr-1" />
                          <span className="mr-3">{match.listing?.location}</span>
                          <Euro className="w-3 h-3 mr-1" />
                          <span>{match.listing?.price}€</span>
                        </div>

                        {/* Match partner info */}
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-secondary to-primary rounded-full flex items-center justify-center text-white text-sm font-bold">
                            {user.role === 'seeker'
                              ? match.landlord.name.charAt(0)
                              : match.seeker.name.charAt(0)
                            }
                          </div>
                          <div>
                            <p className="text-sm font-medium text-dark-gray">
                              {user.role === 'seeker'
                                ? match.landlord.name
                                : match.seeker.name
                              }
                            </p>
                            <div className="flex space-x-1">
                              {(user.role === 'seeker'
                                ? match.landlord.interests
                                : match.seeker.interests
                              ).slice(0, 2).map((interest) => (
                                <span key={interest} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                                  {interest}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Action button */}
                    <div className="mt-3 flex justify-end">
                      <button
                        onClick={() => {
                          const otherUserId = user?.role === 'seeker' ? match.landlord_id : match.seeker_id
                          router.push(`/chat/${otherUserId}`)
                        }}
                        className="bg-secondary hover:bg-secondary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center text-sm"
                      >
                        <MessageCircle className="w-4 h-4 mr-1" />
                        Chatter
                      </button>
                    </div>
                  </div>
                </div>

                {/* Match date */}
                <div className="mt-3 pt-3 border-t border-gray-100 text-center">
                  <p className="text-xs text-gray-500">
                    Match créé le {new Date(match.createdAt).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>
            ))}

            <div className="text-center mt-8 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">
                🚀 Prochaine étape
              </h3>
              <p className="text-sm text-blue-700">
                Le chat sera bientôt disponible pour discuter avec tes matchs !
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}