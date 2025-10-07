'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { ArrowLeft, LogIn } from 'lucide-react'

interface LoginForm {
  email: string
  password: string
}

export default function Login() {
  const { signIn } = useAuth()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>()

  const onSubmit = async (data: LoginForm) => {
    setLoading(true)
    setError('')

    try {
      const user = await signIn(data.email, data.password)

      // Redirect based on role
      if (user.role === 'seeker') {
        router.push('/home')
      } else {
        router.push('/post')
      }
    } catch (error) {
      setError('Email ou mot de passe incorrect')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <div className="max-w-md mx-auto pt-16">
        <div className="flex items-center mb-8">
          <Link href="/" className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-display font-bold text-dark-gray">
            Se connecter
          </h1>
        </div>

        <div className="card p-6 mb-6">
          <div className="text-center mb-6">
            <LogIn className="w-12 h-12 text-primary mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-gray-800">
              Bon retour !
            </h2>
            <p className="text-gray-600">
              Connecte-toi pour continuer à swiper
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                {...register('password', { required: 'Mot de passe requis' })}
                type="password"
                className="input"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
        </div>

        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Pas encore de compte ?
          </p>
          <Link
            href="/register"
            className="btn-secondary inline-block"
          >
            Créer un compte
          </Link>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">🧪 Comptes de test:</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Chercheur:</strong> alice@student.com</p>
            <p><strong>Loueur:</strong> bob@student.com</p>
            <p><strong>Mot de passe:</strong> password</p>
          </div>
        </div>
      </div>
    </div>
  )
}