'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { User, Heart, ArrowLeft } from 'lucide-react'

interface RegisterForm {
  name: string
  email: string
  password: string
  confirmPassword: string
  role: 'seeker' | 'landlord'
  interests: string[]
}

const interestOptions = [
  'non-fumeur', 'calme', 'étudiant', 'animal ok', 'soirées ok',
  'vegan', 'sport', 'musique', 'cuisine', 'télétravail'
]

export default function Register() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [selectedInterests, setSelectedInterests] = useState<string[]>([])

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      return
    }

    setLoading(true)
    try {
      await signUp(data.email, data.password, {
        name: data.name,
        role: data.role,
        interests: selectedInterests,
      })

      // Redirect based on role
      if (data.role === 'seeker') {
        router.push('/home')
      } else {
        router.push('/post')
      }
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev =>
      prev.includes(interest)
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="flex items-center mb-6">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-dark-gray">
            Créer un compte
          </h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2 text-primary" />
              Informations personnelles
            </h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom complet
                </label>
                <input
                  {...register('name', { required: 'Nom requis' })}
                  className="input"
                  placeholder="Ton nom"
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  {...register('email', {
                    required: 'Email requis',
                    pattern: {
                      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                      message: 'Email invalide'
                    }
                  })}
                  type="email"
                  className="input"
                  placeholder="ton@email.com"
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Mot de passe
                </label>
                <input
                  {...register('password', {
                    required: 'Mot de passe requis',
                    minLength: {
                      value: 6,
                      message: 'Minimum 6 caractères'
                    }
                  })}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                />
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirmer le mot de passe
                </label>
                <input
                  {...register('confirmPassword', {
                    required: 'Confirmation requise',
                    validate: value => value === password || 'Les mots de passe ne correspondent pas'
                  })}
                  type="password"
                  className="input"
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
                )}
              </div>
            </div>
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4">
              Tu es...
            </h2>

            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  {...register('role', { required: 'Choix requis' })}
                  type="radio"
                  value="seeker"
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium">🔍 Je cherche un logement</div>
                  <div className="text-sm text-gray-600">Swipe pour trouver ton appart idéal</div>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-4 border rounded-xl cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  {...register('role', { required: 'Choix requis' })}
                  type="radio"
                  value="landlord"
                  className="text-primary focus:ring-primary"
                />
                <div>
                  <div className="font-medium">🏠 Je loue un logement</div>
                  <div className="text-sm text-gray-600">Trouve le colocataire parfait</div>
                </div>
              </label>
            </div>

            {errors.role && (
              <p className="text-red-500 text-sm mt-2">{errors.role.message}</p>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-primary" />
              Tes préférences
            </h2>

            <div className="grid grid-cols-2 gap-2">
              {interestOptions.map((interest) => (
                <button
                  key={interest}
                  type="button"
                  onClick={() => toggleInterest(interest)}
                  className={`p-3 rounded-lg text-sm font-medium transition-all ${
                    selectedInterests.includes(interest)
                      ? 'bg-primary text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {interest}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Création...' : 'Créer mon compte'}
          </button>

          <p className="text-center text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary font-medium">
              Se connecter
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}