'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { User, ArrowLeft } from 'lucide-react'
import { RegisterFormData } from '@/types/new-types'

interface RegisterForm {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
}

export default function Register() {
  const { signUp } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>()
  const password = watch('password')

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      return
    }

    setLoading(true)
    try {
      await signUp(data.email, data.password, {
        first_name: data.first_name,
        last_name: data.last_name,
        profile_completed: false
      })

      // Redirection vers setup de profil
      router.push('/setup-profile')
    } catch (error) {
      console.error('Registration error:', error)
    } finally {
      setLoading(false)
    }
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

        <div className="card p-6 mb-6">
          <div className="text-center mb-6">
            <User className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800">
              Bienvenue sur Sublet !
            </h2>
            <p className="text-gray-600">
              Créé ton compte pour trouver ta colocation idéale
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prénom
                </label>
                <input
                  {...register('first_name', { required: 'Prénom requis' })}
                  className="input"
                  placeholder="Ton prénom"
                />
                {errors.first_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.first_name.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nom
                </label>
                <input
                  {...register('last_name', { required: 'Nom requis' })}
                  className="input"
                  placeholder="Ton nom"
                />
                {errors.last_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.last_name.message}</p>
                )}
              </div>
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
                <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
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
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
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
                <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Création...' : 'Créer mon compte'}
            </button>
          </form>
        </div>

        <div className="text-center space-y-3">
          <p className="text-gray-600">
            Déjà un compte ?{' '}
            <Link href="/login" className="text-primary font-medium">
              Se connecter
            </Link>
          </p>

          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              🏠 <strong>Étape suivante :</strong> Tu pourras compléter ton profil<br />
              et définir tes préférences de cohabitation !
            </p>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🧪 Comptes de test:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Utilisateur 1:</strong> alice@student.com</p>
            <p><strong>Utilisateur 2:</strong> bob@student.com</p>
            <p><strong>Mot de passe:</strong> password</p>
          </div>
        </div>
      </div>
    </div>
  )
}