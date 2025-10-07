'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { database } from '@/lib/supabase'
import { Home, Plus, LogOut, Heart, MessageCircle } from 'lucide-react'

interface ApartmentForm {
  title: string
  price: number
  location: string
  available: string
  description: string
  amenities: string[]
}

const amenityOptions = [
  'WiFi', 'Cuisine équipée', 'Douche', 'Balcon', 'Lave-vaisselle',
  'Salon commun', 'Terrasse', 'Parking', 'Cave', 'Lave-linge',
  'Climatisation', 'Chauffage', 'Ascenseur'
]

export default function Post() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [myApartment, setMyApartment] = useState<any>(null)
  const [likesReceived, setLikesReceived] = useState<any[]>([])

  const { register, handleSubmit, formState: { errors }, reset } = useForm<ApartmentForm>()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'landlord') {
      router.push('/home')
      return
    }

    // Check if user already has an apartment
    const existingApartments = database.getApartmentsByLandlord(user.id)
    if (existingApartments.length > 0) {
      setMyApartment(existingApartments[0])
      // Get likes for this apartment
      const likes = database.getUsersWhoLikedApartment(existingApartments[0].id)
      setLikesReceived(likes)
    }
  }, [user, router])

  const onSubmit = (data: ApartmentForm) => {
    if (!user) return

    const apartmentData = {
      ...data,
      photos: [
        'https://picsum.photos/400/300?random=100',
        'https://picsum.photos/400/300?random=101',
      ],
      amenities: selectedAmenities,
      landlordId: user.id,
    }

    const newApartment = database.createApartment(apartmentData)
    setMyApartment(newApartment)
    reset()
    setSelectedAmenities([])
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const handleLikeBack = (userId: string) => {
    if (!user || !myApartment) return

    // Create a match
    database.createMatch(userId, user.id, myApartment.id)

    // Remove from likes list (they're now matched)
    setLikesReceived(prev => prev.filter(like => like.id !== userId))

    // Show success message or navigate
    alert('Match créé ! 🎉')
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div>
          <h1 className="text-xl font-display font-bold text-dark-gray">
            Sublet
          </h1>
          <p className="text-sm text-gray-600">Salut {user.name} ! 🏠</p>
        </div>

        <div className="flex items-center space-x-2">
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

      <div className="p-4 max-w-md mx-auto">
        {!myApartment ? (
          // Apartment posting form
          <div className="space-y-6">
            <div className="text-center">
              <Home className="w-16 h-16 text-primary mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-dark-gray mb-2">
                Poste ton logement
              </h2>
              <p className="text-gray-600">
                Trouve le colocataire parfait !
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="card p-6">
                <h3 className="font-semibold mb-4">Informations de base</h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Titre
                    </label>
                    <input
                      {...register('title', { required: 'Titre requis' })}
                      className="input"
                      placeholder="Ex: Studio cosy centre-ville"
                    />
                    {errors.title && (
                      <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Prix (€/mois)
                      </label>
                      <input
                        {...register('price', {
                          required: 'Prix requis',
                          min: { value: 1, message: 'Prix invalide' }
                        })}
                        type="number"
                        className="input"
                        placeholder="550"
                      />
                      {errors.price && (
                        <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Quartier
                      </label>
                      <input
                        {...register('location', { required: 'Quartier requis' })}
                        className="input"
                        placeholder="Quartier Latin"
                      />
                      {errors.location && (
                        <p className="text-red-500 text-sm mt-1">{errors.location.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Disponibilité
                    </label>
                    <input
                      {...register('available', { required: 'Disponibilité requise' })}
                      className="input"
                      placeholder="Ex: Immédiatement, Mars 2024"
                    />
                    {errors.available && (
                      <p className="text-red-500 text-sm mt-1">{errors.available.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description
                    </label>
                    <textarea
                      {...register('description', { required: 'Description requise' })}
                      rows={4}
                      className="input resize-none"
                      placeholder="Décris ton logement, l'ambiance, ce qui le rend spécial..."
                    />
                    {errors.description && (
                      <p className="text-red-500 text-sm mt-1">{errors.description.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="card p-6">
                <h3 className="font-semibold mb-4">Équipements</h3>
                <div className="grid grid-cols-2 gap-2">
                  {amenityOptions.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amenity}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full btn-primary"
              >
                <Plus className="w-5 h-5 mr-2" />
                Publier mon logement
              </button>
            </form>
          </div>
        ) : (
          // Apartment posted - show likes
          <div className="space-y-6">
            <div className="card p-6">
              <h2 className="text-xl font-bold text-dark-gray mb-2">
                {myApartment.title}
              </h2>
              <div className="flex items-center justify-between text-gray-600">
                <span>{myApartment.location}</span>
                <span className="text-primary font-bold">{myApartment.price}€</span>
              </div>
              <p className="text-gray-700 mt-2">{myApartment.description}</p>
            </div>

            <div className="card p-6">
              <h3 className="text-lg font-bold text-dark-gray mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-2 text-primary" />
                Likes reçus ({likesReceived.length})
              </h3>

              {likesReceived.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⏳</div>
                  <p className="text-gray-600">
                    Aucun like pour l'instant...
                    <br />
                    Sois patient, ça va venir !
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {likesReceived.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white font-bold">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">{user.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {user.interests.slice(0, 2).map((interest: string) => (
                              <span key={interest} className="text-xs bg-white px-2 py-1 rounded-full text-gray-600">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => handleLikeBack(user.id)}
                        className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                      >
                        Like back
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}