'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import {
  Camera, User, Heart, Home, Users, Calendar,
  ChevronLeft, ChevronRight, Upload, X
} from 'lucide-react'
import {
  ProfileSetupFormData,
  Lifestyle,
  Gender,
  HOBBIES_OPTIONS
} from '@/types/new-types'

interface SetupForm {
  avatar_url?: string
  description: string
  age: number
  gender?: Gender
  hobbies: string[]
  lifestyle: Lifestyle
  preferred_roommate_count?: number
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: Gender
}

const genderOptions: { value: Gender; label: string }[] = [
  { value: 'homme', label: 'Homme' },
  { value: 'femme', label: 'Femme' },
  { value: 'autre', label: 'Autre' },
  { value: 'non-précisé', label: 'Préfère ne pas dire' }
]

export default function SetupProfile() {
  const { user } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([])
  const [profileImage, setProfileImage] = useState<string | null>(null)

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<SetupForm>({
    defaultValues: {
      lifestyle: {
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

  const lifestyle = watch('lifestyle')

  const onSubmit = async (data: SetupForm) => {
    setLoading(true)
    try {
      // Ici on appellera le service pour mettre à jour le profil
      console.log('Profile setup data:', {
        ...data,
        hobbies: selectedHobbies,
        avatar_url: profileImage
      })

      // TODO: Appeler SupabaseService.updateUserProfile(data)

      // Rediriger vers l'accueil après setup complet
      router.push('/home')
    } catch (error) {
      console.error('Profile setup error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby)
        ? prev.filter(h => h !== hobby)
        : [...prev, hobby]
    )
  }

  const updateLifestyle = (key: keyof Lifestyle, value: any) => {
    setValue('lifestyle', { ...lifestyle, [key]: value })
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfileImage(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4))
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1))

  const steps = [
    'Infos de base',
    'Style de vie',
    'Préférences',
    'Finalisation'
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-2xl mx-auto pt-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-display font-bold text-dark-gray mb-2">
            Complète ton profil
          </h1>
          <p className="text-gray-600">
            Ces informations nous aident à te proposer les meilleures colocations
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            {steps.map((step, index) => (
              <div
                key={step}
                className={`text-sm font-medium ${
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
          {/* Étape 1: Infos de base */}
          {currentStep === 1 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <User className="w-5 h-5 mr-2 text-primary" />
                Parle-nous de toi
              </h2>

              {/* Photo de profil */}
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                    {profileImage ? (
                      <img
                        src={profileImage}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Camera className="w-8 h-8 text-gray-400" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 bg-primary text-white p-2 rounded-full cursor-pointer hover:bg-primary-dark transition-colors">
                    <Upload className="w-4 h-4" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Ajoute une photo pour un profil plus attractif
                </p>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description personnelle
                </label>
                <textarea
                  {...register('description', { required: 'Description requise' })}
                  className="input min-h-[100px] resize-y"
                  placeholder="Décris-toi en quelques mots... Tes passions, ton style de vie, ce que tu recherches dans une colocation..."
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">{errors.description.message}</p>
                )}
              </div>

              {/* Âge et genre */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Âge
                  </label>
                  <input
                    {...register('age', {
                      required: 'Âge requis',
                      min: { value: 18, message: 'Minimum 18 ans' },
                      max: { value: 100, message: 'Maximum 100 ans' }
                    })}
                    type="number"
                    className="input"
                    placeholder="25"
                  />
                  {errors.age && (
                    <p className="text-red-500 text-xs mt-1">{errors.age.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre (optionnel)
                  </label>
                  <select {...register('gender')} className="input">
                    <option value="">Non précisé</option>
                    {genderOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Hobbies */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Tes centres d'intérêt
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {HOBBIES_OPTIONS.map((hobby) => (
                    <button
                      key={hobby}
                      type="button"
                      onClick={() => toggleHobby(hobby)}
                      className={`p-2 rounded-lg text-sm font-medium transition-all ${
                        selectedHobbies.includes(hobby)
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {hobby}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Étape 2: Style de vie */}
          {currentStep === 2 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Home className="w-5 h-5 mr-2 text-primary" />
                Ton style de vie
              </h2>

              {/* Niveau social */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Niveau social (1: calme / 5: très social)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={lifestyle.social_level}
                  onChange={(e) => updateLifestyle('social_level', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Calme</span>
                  <span>Équilibré</span>
                  <span>Très social</span>
                </div>
              </div>

              {/* Propreté */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Niveau de propreté (1: décontracté / 5: maniaque)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={lifestyle.cleanliness}
                  onChange={(e) => updateLifestyle('cleanliness', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Décontracté</span>
                  <span>Normal</span>
                  <span>Très ordonné</span>
                </div>
              </div>

              {/* Sensibilité au bruit */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Sensibilité au bruit (1: pas sensible / 5: très sensible)
                </label>
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={lifestyle.noise_sensitivity}
                  onChange={(e) => updateLifestyle('noise_sensitivity', parseInt(e.target.value))}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-600 mt-1">
                  <span>Pas sensible</span>
                  <span>Modéré</span>
                  <span>Très sensible</span>
                </div>
              </div>

              {/* Rythme de sommeil */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rythme de sommeil
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'early', label: 'Couche-tôt' },
                    { value: 'normal', label: 'Normal' },
                    { value: 'late', label: 'Couche-tard' },
                    { value: 'flexible', label: 'Flexible' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateLifestyle('sleep_schedule', option.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        lifestyle.sleep_schedule === option.value
                          ? 'bg-primary text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activités week-end */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Le week-end tu préfères...
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'sortir', label: 'Sortir' },
                    { value: 'maison', label: 'Rester à la maison' },
                    { value: 'flexible', label: 'Les deux' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateLifestyle('weekend_activity', option.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
                        lifestyle.weekend_activity === option.value
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

          {/* Étape 3: Préférences de colocation */}
          {currentStep === 3 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Users className="w-5 h-5 mr-2 text-primary" />
                Tes préférences de colocation
              </h2>

              {/* Nombre de colocataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de colocataires souhaité
                </label>
                <select {...register('preferred_roommate_count')} className="input">
                  <option value="">Pas de préférence</option>
                  <option value="0">Vivre seul(e)</option>
                  <option value="1">1 colocataire</option>
                  <option value="2">2 colocataires</option>
                  <option value="3">3 colocataires</option>
                  <option value="4">4+ colocataires</option>
                </select>
              </div>

              {/* Tranche d'âge préférée */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tranche d'âge préférée des colocataires
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    {...register('preferred_age_min')}
                    type="number"
                    placeholder="Âge min"
                    className="input"
                    min="18"
                    max="100"
                  />
                  <input
                    {...register('preferred_age_max')}
                    type="number"
                    placeholder="Âge max"
                    className="input"
                    min="18"
                    max="100"
                  />
                </div>
              </div>

              {/* Genre préféré */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Genre préféré des colocataires
                </label>
                <select {...register('preferred_gender')} className="input">
                  <option value="">Pas de préférence</option>
                  {genderOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Style de cohabitation */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de cohabitation recherchée
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { value: 'amis', label: 'Amis proches' },
                    { value: 'indépendants', label: 'Indépendants' },
                    { value: 'familial', label: 'Ambiance familiale' }
                  ].map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => updateLifestyle('cohabitation_style', option.value)}
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
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
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fréquence d'invités acceptable
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
                      className={`p-3 rounded-lg text-sm font-medium transition-all ${
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

          {/* Étape 4: Finalisation */}
          {currentStep === 4 && (
            <div className="card p-6 space-y-6">
              <h2 className="text-xl font-semibold flex items-center">
                <Heart className="w-5 h-5 mr-2 text-primary" />
                Prêt à trouver ta colocation ?
              </h2>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">
                  🎉 Profil presque terminé !
                </h3>
                <p className="text-green-700 text-sm">
                  Ton profil va nous permettre de te proposer les colocations les plus compatibles avec ton style de vie.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-800 mb-2">
                  🔍 Prochaines étapes :
                </h3>
                <ul className="text-blue-700 text-sm space-y-1">
                  <li>• Découvre les annonces qui te correspondent</li>
                  <li>• Swipe sur celles qui t'intéressent</li>
                  <li>• Chatte avec les propriétaires en cas de match</li>
                  <li>• Publie ta propre annonce si tu loues</li>
                </ul>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed text-lg py-4"
              >
                {loading ? 'Finalisation...' : 'Finaliser mon profil'}
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