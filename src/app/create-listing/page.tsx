'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import ImageUpload from '@/components/ImageUpload'
import { ArrowLeft, Home, Plus } from 'lucide-react'

interface ListingForm {
  title: string
  description: string
  price: number
  location: string
  available: string
  property_type: string
  rooms: number
  size?: number
  amenities: string[]
  rules: string[]
}

const amenityOptions = [
  'WiFi', 'Cuisine équipée', 'Douche', 'Balcon', 'Lave-vaisselle',
  'Salon commun', 'Terrasse', 'Parking', 'Cave', 'Lave-linge',
  'Climatisation', 'Chauffage', 'Ascenseur', 'Jardin'
]

const ruleOptions = [
  'Non-fumeur', 'Animaux interdits', 'Pas de fêtes', 'Calme exigé',
  'Étudiants uniquement', 'Professionnels uniquement', 'Mixte accepté'
]

export default function CreateListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [images, setImages] = useState<File[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedRules, setSelectedRules] = useState<string[]>([])

  const { register, handleSubmit, formState: { errors }, watch } = useForm<ListingForm>()

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  const onSubmit = async (data: ListingForm) => {
    if (!user) return

    if (images.length === 0) {
      alert('Veuillez ajouter au moins une photo')
      return
    }

    setLoading(true)
    try {
      // Upload images to Supabase Storage
      const photoUrls = await SupabaseService.uploadMultipleImages('listings', images)

      // Create listing
      const listingData = {
        ...data,
        photos: photoUrls,
        amenities: selectedAmenities,
        rules: selectedRules,
        landlord_id: user.id,
      }

      await SupabaseService.createListing(listingData)

      // Success! Redirect to appropriate page
      if (user.role === 'seeker') {
        router.push('/home')
      } else {
        router.push('/post')
      }

      alert('Annonce créée avec succès ! 🎉')
    } catch (error) {
      console.error('Error creating listing:', error)
      alert('Erreur lors de la création de l\'annonce')
    } finally {
      setLoading(false)
    }
  }

  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities(prev =>
      prev.includes(amenity)
        ? prev.filter(a => a !== amenity)
        : [...prev, amenity]
    )
  }

  const toggleRule = (rule: string) => {
    setSelectedRules(prev =>
      prev.includes(rule)
        ? prev.filter(r => r !== rule)
        : [...prev, rule]
    )
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="flex items-center p-4 bg-white shadow-sm">
        <button
          onClick={() => router.back()}
          className="mr-3"
        >
          <ArrowLeft className="w-6 h-6 text-gray-600" />
        </button>
        <h1 className="text-xl font-display font-bold text-dark-gray">
          Créer une annonce
        </h1>
      </div>

      <div className="p-4 max-w-md mx-auto">
        <div className="text-center mb-6">
          <Home className="w-16 h-16 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-dark-gray mb-2">
            Nouvelle annonce
          </h2>
          <p className="text-gray-600">
            Décris ton logement pour attirer les bonnes personnes
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Photos */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Photos du logement</h3>
            <ImageUpload
              images={images}
              onImagesChange={setImages}
              maxImages={5}
            />
          </div>

          {/* Basic info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Informations de base</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Titre de l'annonce
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de logement
                  </label>
                  <select
                    {...register('property_type', { required: 'Type requis' })}
                    className="input"
                  >
                    <option value="">Sélectionner</option>
                    <option value="studio">Studio</option>
                    <option value="apartment">Appartement</option>
                    <option value="house">Maison</option>
                    <option value="room">Chambre</option>
                  </select>
                  {errors.property_type && (
                    <p className="text-red-500 text-sm mt-1">{errors.property_type.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de pièces
                  </label>
                  <select
                    {...register('rooms', { required: 'Nombre de pièces requis' })}
                    className="input"
                  >
                    <option value="">Sélectionner</option>
                    {[1, 2, 3, 4, 5, 6].map(num => (
                      <option key={num} value={num}>{num}</option>
                    ))}
                  </select>
                  {errors.rooms && (
                    <p className="text-red-500 text-sm mt-1">{errors.rooms.message}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surface (m²)
                  </label>
                  <input
                    {...register('size')}
                    type="number"
                    className="input"
                    placeholder="25"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Disponibilité
                  </label>
                  <input
                    {...register('available', { required: 'Disponibilité requise' })}
                    className="input"
                    placeholder="Immédiatement"
                  />
                  {errors.available && (
                    <p className="text-red-500 text-sm mt-1">{errors.available.message}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Amenities */}
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

          {/* Rules */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Règles du logement</h3>
            <div className="space-y-2">
              {ruleOptions.map((rule) => (
                <button
                  key={rule}
                  type="button"
                  onClick={() => toggleRule(rule)}
                  className={`w-full p-3 rounded-lg text-sm font-medium transition-all text-left ${
                    selectedRules.includes(rule)
                      ? 'bg-secondary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {rule}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                Création en cours...
              </div>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Publier l'annonce
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}