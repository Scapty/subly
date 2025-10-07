'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Image from 'next/image'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Listing } from '@/lib/supabase-client'
import { ArrowLeft, Heart, X, MapPin, Calendar, Home, Users, Wifi, Car, Star, MessageCircle } from 'lucide-react'

export default function ListingDetailPage() {
  const { user } = useAuth()
  const router = useRouter()
  const params = useParams()
  const [listing, setListing] = useState<Listing | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [liked, setLiked] = useState(false)

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    loadListing()
  }, [user, params.id])

  const loadListing = async () => {
    try {
      const listingData = await SupabaseService.getListingById(params.id as string)
      if (!listingData) {
        router.push('/search')
        return
      }
      setListing(listingData)
    } catch (error) {
      console.error('Error loading listing:', error)
      router.push('/search')
    } finally {
      setLoading(false)
    }
  }

  const handleLike = async () => {
    if (!user || !listing || liked) return

    try {
      await SupabaseService.likeListing(user.id, listing.id)
      setLiked(true)

      // Show success message
      setTimeout(() => {
        router.push('/home')
      }, 1000)
    } catch (error) {
      console.error('Error liking listing:', error)
    }
  }

  const handlePass = () => {
    router.push('/home')
  }

  const nextImage = () => {
    if (!listing) return
    setCurrentImageIndex((prev) =>
      prev === listing.photos.length - 1 ? 0 : prev + 1
    )
  }

  const prevImage = () => {
    if (!listing) return
    setCurrentImageIndex((prev) =>
      prev === 0 ? listing.photos.length - 1 : prev - 1
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement du logement...</p>
        </div>
      </div>
    )
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Logement non trouvé</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="relative">
        <button
          onClick={() => router.back()}
          className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur-sm p-2 rounded-full shadow-lg"
        >
          <ArrowLeft className="w-6 h-6 text-gray-700" />
        </button>

        {/* Image carousel */}
        <div className="relative h-80 overflow-hidden">
          <Image
            src={listing.photos[currentImageIndex] || 'https://picsum.photos/400/300?random=default'}
            alt={listing.title}
            fill
            className="object-cover"
          />

          {/* Image navigation */}
          {listing.photos.length > 1 && (
            <>
              <button
                onClick={prevImage}
                className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <button
                onClick={nextImage}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 rounded-full shadow-lg"
              >
                <ArrowLeft className="w-5 h-5 transform rotate-180" />
              </button>

              {/* Image indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {listing.photos.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`w-2 h-2 rounded-full ${
                      index === currentImageIndex ? 'bg-white' : 'bg-white/50'
                    }`}
                  />
                ))}
              </div>
            </>
          )}

          {/* Price badge */}
          <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full">
            <span className="text-xl font-bold text-primary">{listing.price}€</span>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <h1 className="text-2xl font-bold text-dark-gray mb-4">
          {listing.title}
        </h1>

        {/* Basic info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <MapPin className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">{listing.location}</span>
          </div>

          <div className="flex items-center space-x-2">
            <Calendar className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Dispo {listing.available}</span>
          </div>

          {listing.rooms && (
            <div className="flex items-center space-x-2">
              <Home className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">{listing.rooms} pièce{listing.rooms > 1 ? 's' : ''}</span>
            </div>
          )}

          {listing.size && (
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-gray-500" />
              <span className="text-gray-700">{listing.size}m²</span>
            </div>
          )}
        </div>

        {/* Description */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Description</h2>
          <p className="text-gray-700 leading-relaxed">
            {listing.description}
          </p>
        </div>

        {/* Amenities */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Équipements</h2>
          <div className="grid grid-cols-2 gap-3">
            {listing.amenities.map((amenity) => (
              <div key={amenity} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary rounded-full"></div>
                <span className="text-gray-700">{amenity}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Rules */}
        {listing.rules && listing.rules.length > 0 && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold mb-3">Règles du logement</h2>
            <div className="space-y-2">
              {listing.rules.map((rule, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-secondary rounded-full"></div>
                  <span className="text-gray-700">{rule}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Landlord info */}
        {listing.landlord && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-3">Propriétaire</h2>
            <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-xl">
              <div className="w-16 h-16 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-xl font-bold">
                {listing.landlord.name.charAt(0)}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-dark-gray">{listing.landlord.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                  {listing.landlord.interests?.map((interest) => (
                    <span key={interest} className="bg-white px-3 py-1 rounded-full text-sm text-gray-700">
                      {interest}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action buttons */}
      {user?.role === 'seeker' && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="flex justify-center space-x-4 max-w-md mx-auto">
            <button
              onClick={handlePass}
              className="w-16 h-16 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              <X className="w-8 h-8" />
            </button>

            <button
              onClick={handleLike}
              disabled={liked}
              className={`w-16 h-16 ${
                liked
                  ? 'bg-green-500'
                  : 'bg-green-500 hover:bg-green-600'
              } text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl disabled:opacity-50`}
            >
              <Heart className="w-8 h-8" fill={liked ? 'white' : 'none'} />
            </button>
          </div>

          {liked && (
            <div className="text-center mt-3">
              <p className="text-green-600 font-medium">
                Logement liké ! 💕
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}