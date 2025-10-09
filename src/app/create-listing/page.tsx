'use client'

export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import ImageUpload from '@/components/ImageUpload'
import {
  ArrowLeft, Home, Euro, Calendar, MapPin, Users,
  Camera, Tag, Ruler, Bed, ChevronLeft, ChevronRight
} from 'lucide-react'
import {
  ListingFormData,
  Lifestyle,
  AMENITIES_OPTIONS,
  RULES_OPTIONS,
  NEIGHBORHOODS_PARIS
} from '@/types/new-types'

interface ListingForm {
  title: string
  description: string
  address: string
  neighborhood: string
  rent_amount: number
  charges_included: boolean
  available_from: string
  minimum_duration_months: number
  property_type: string
  total_rooms?: number
  available_rooms?: number
  apartment_size?: number
  furnished: boolean
  amenities: string[]
  rules: string[]
  current_roommate_count: number
  current_roommate_ages: number[]
  roommate_lifestyle: Lifestyle
}

const propertyTypes = [
  'Appartement', 'Maison', 'Studio', 'Loft', 'Duplex', 'Colocation'
]

export default function CreateListingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [images, setImages] = useState<File[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedRules, setSelectedRules] = useState<string[]>([])
  const [roommateAges, setRoommateAges] = useState<string>('')

  const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm<ListingForm>({
    defaultValues: {
      charges_included: false,
      furnished: false,
      minimum_duration_months: 1,
      current_roommate_count: 0,
      roommate_lifestyle: {
        social_level: 3,
        cleanliness: 3,
        noise_sensitivity: 3,
        sleep_schedule: 'normal',
        weekend_activity: 'flexible',
        guest_frequency: 'rarement',
        cohabitation_style: 'amis'
      }
    }
  })

  const lifestyle = watch('roommate_lifestyle')

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }
  }, [user, router])

  const onSubmit = async (data: ListingForm) => {
    setLoading(true)
    try {
      // Upload images first
      let photoUrls: string[] = []
      if (images.length > 0) {
        photoUrls = await SupabaseService.uploadMultipleImages('listings', images)
      }

      // Parse roommate ages
      const ageArray = roommateAges
        .split(',')
        .map(age => parseInt(age.trim()))
        .filter(age => !isNaN(age))

      const listingData = {
        ...data,
        landlord_id: user!.id,
        photos: photoUrls,
        amenities: selectedAmenities,
        rules: selectedRules,
        current_roommate_ages: ageArray,
        is_active: true
      }

      await SupabaseService.createListing(listingData)
      router.push('/post')
    } catch (error) {
      console.error('Error creating listing:', error)
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

  const updateLifestyle = (key: keyof Lifestyle, value: any) => {
    setValue('roommate_lifestyle', { ...lifestyle, [key]: value })
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const steps = [
    'Informations de base',
    'Détails du logement',
    'Colocataires actuels',
    'Photos et finalisation'
  ]

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => router.push('/post')} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <h1 className="text-2xl font-display font-bold text-dark-gray">
            Créer une annonce
          </h1>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`text-xs font-medium ${
                  index + 1 <= currentStep ? 'text-primary' : 'text-gray-400'
                }`}
              >
                {step}
              </div>
            ))}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Étape 1: Informations de base */}
          {currentStep === 1 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Home className="w-5 h-5 mr-2 text-primary" />
                Informations de base
              </h2>

              {/* Titre */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Titre de l'annonce
                </label>
                <input
                  {...register('title', { required: 'Titre requis' })}
                  className="input"
                  placeholder="Chambre dans colocation sympa 11ème"
                />
                {errors.title && (
                  <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  {...register('description', { required: 'Description requise' })}
                  className="input min-h-[120px] resize-y"
                  placeholder="Décris ton logement, l'ambiance, le quartier..."
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Adresse et quartier */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Adresse complète
                  </label>
                  <input
                    {...register('address', { required: 'Adresse requise' })}
                    className="input"
                    placeholder="123 rue de la Paix, 75001 Paris"
                  />
                  {errors.address && (
                    <p className="text-red-500 text-xs mt-1">{errors.address.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quartier
                  </label>
                  <select
                    {...register('neighborhood', { required: 'Quartier requis' })}
                    className="input"
                  >
                    <option value="">Sélectionne un quartier</option>
                    {NEIGHBORHOODS_PARIS.map(neighborhood => (
                      <option key={neighborhood} value={neighborhood}>
                        {neighborhood}
                      </option>
                    ))}
                  </select>
                  {errors.neighborhood && (
                    <p className="text-red-500 text-xs mt-1">{errors.neighborhood.message}</p>
                  )}
                </div>
              </div>

              {/* Prix */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Loyer mensuel (€)
                  </label>
                  <input
                    {...register('rent_amount', {
                      required: 'Loyer requis',
                      min: { value: 100, message: 'Minimum 100€' }
                    })}
                    type="number"
                    className="input"
                    placeholder="800"
                  />
                  {errors.rent_amount && (
                    <p className="text-red-500 text-xs mt-1">{errors.rent_amount.message}</p>
                  )}
                </div>

                <div className="flex items-end">
                  <label className="flex items-center space-x-2">
                    <input
                      {...register('charges_included')}
                      type="checkbox"
                      className="text-primary focus:ring-primary"
                    />
                    <span className="text-sm text-gray-700">Charges incluses</span>
                  </label>
                </div>
              </div>

              {/* Disponibilité */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Disponible à partir du
                  </label>
                  <input
                    {...register('available_from', { required: 'Date requise' })}
                    type="date"
                    className="input"
                  />
                  {errors.available_from && (
                    <p className="text-red-500 text-xs mt-1">{errors.available_from.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Durée minimum (mois)
                  </label>
                  <select {...register('minimum_duration_months')} className="input">
                    <option value="1">1 mois</option>
                    <option value="3">3 mois</option>
                    <option value="6">6 mois</option>
                    <option value="12">12 mois</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Détails du logement */}
          {currentStep === 2 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Ruler className="w-5 h-5 mr-2 text-primary" />
                Détails du logement
              </h2>

              {/* Type de logement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de logement
                </label>
                <select
                  {...register('property_type', { required: 'Type requis' })}
                  className="input"
                >
                  <option value="">Sélectionne le type</option>
                  {propertyTypes.map(type => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                {errors.property_type && (
                  <p className="text-red-500 text-xs mt-1">{errors.property_type.message}</p>
                )}
              </div>

              {/* Chambres et superficie */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre total de pièces
                  </label>
                  <input
                    {...register('total_rooms')}
                    type="number"
                    className="input"
                    placeholder="4"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Chambres disponibles
                  </label>
                  <input
                    {...register('available_rooms')}
                    type="number"
                    className="input"
                    placeholder="1"
                    min="1"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Superficie (m²)
                  </label>
                  <input
                    {...register('apartment_size')}
                    type="number"
                    className="input"
                    placeholder="80"
                  />
                </div>
              </div>

              {/* Meublé */}
              <div>
                <label className="flex items-center space-x-2">
                  <input
                    {...register('furnished')}
                    type="checkbox"
                    className="text-primary focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Logement meublé</span>
                </label>
              </div>

              {/* Équipements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Équipements disponibles
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {AMENITIES_OPTIONS.map((amenity) => (
                    <button
                      key={amenity}
                      type="button"
                      onClick={() => toggleAmenity(amenity)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        selectedAmenities.includes(amenity)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {amenity.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>

              {/* Règles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Règles du logement
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {RULES_OPTIONS.map((rule) => (
                    <button
                      key={rule}
                      type="button"
                      onClick={() => toggleRule(rule)}
                      className={`p-2 rounded-lg text-xs font-medium transition-all ${
                        selectedRules.includes(rule)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {rule.replace('_', ' ')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 3: Colocataires actuels */}
          {currentStep === 3 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Colocataires actuels
              </h2>

              {/* Nombre de colocataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de colocataires actuels
                </label>
                <select {...register('current_roommate_count')} className="input">
                  <option value="0">Aucun (logement vide)</option>
                  <option value="1">1 colocataire</option>
                  <option value="2">2 colocataires</option>
                  <option value="3">3 colocataires</option>
                  <option value="4">4+ colocataires</option>
                </select>
              </div>

              {/* Âges des colocataires */}
              {watch('current_roommate_count') > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Âges des colocataires actuels
                  </label>
                  <input
                    value={roommateAges}
                    onChange={(e) => setRoommateAges(e.target.value)}
                    className="input"
                    placeholder="25, 28, 30"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Sépare les âges par des virgules
                  </p>
                </div>
              )}

              {/* Style de vie des colocataires actuels */}
              {watch('current_roommate_count') > 0 && (
                <div className="space-y-4">
                  <h3 className="font-medium text-gray-700">
                    Style de vie général des colocataires
                  </h3>

                  {/* Niveau social */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Niveau social (1: calme / 5: très social)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={lifestyle.social_level}
                      onChange={(e) => updateLifestyle('social_level', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Propreté */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Niveau de propreté (1: décontracté / 5: maniaque)
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={lifestyle.cleanliness}
                      onChange={(e) => updateLifestyle('cleanliness', parseInt(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  {/* Style de cohabitation */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Style de cohabitation
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { value: 'amis', label: 'Amis proches' },
                        { value: 'indépendants', label: 'Indépendants' },
                        { value: 'familial', label: 'Familiale' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateLifestyle('cohabitation_style', option.value)}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            lifestyle.cohabitation_style === option.value
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Invités */}
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Fréquence d'invités
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { value: 'jamais', label: 'Jamais' },
                        { value: 'rarement', label: 'Rarement' },
                        { value: 'souvent', label: 'Souvent' },
                        { value: 'flexible', label: 'Flexible' }
                      ].map(option => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => updateLifestyle('guest_frequency', option.value)}
                          className={`p-2 rounded-lg text-xs font-medium transition-all ${
                            lifestyle.guest_frequency === option.value
                              ? 'bg-primary text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Étape 4: Photos et finalisation */}
          {currentStep === 4 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Camera className="w-5 h-5 mr-2 text-primary" />
                Photos et finalisation
              </h2>

              {/* Upload photos */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Photos du logement
                </label>
                <ImageUpload
                  images={images}
                  onImagesChange={setImages}
                  maxImages={8}
                />
                <p className="text-xs text-gray-600 mt-2">
                  Ajoute jusqu'à 8 photos de qualité pour attirer plus de candidats
                </p>
              </div>

              {/* Résumé */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  📋 Résumé de ton annonce :
                </h3>
                <div className="text-blue-700 text-sm space-y-1">
                  <p><strong>Titre :</strong> {watch('title') || 'À définir'}</p>
                  <p><strong>Quartier :</strong> {watch('neighborhood') || 'À définir'}</p>
                  <p><strong>Loyer :</strong> {watch('rent_amount') || 0}€{watch('charges_included') ? ' CC' : ' HC'}</p>
                  <p><strong>Disponible :</strong> {watch('available_from') || 'À définir'}</p>
                  <p><strong>Photos :</strong> {images.length} ajoutée(s)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
              >
                {loading ? 'Publication...' : 'Publier mon annonce'}
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </button>

            {currentStep < 4 && (
              <button
                type="button"
                onClick={nextStep}
                className="flex items-center px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
              >
                Suivant
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}