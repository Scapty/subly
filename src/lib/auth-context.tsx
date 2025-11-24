'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/lib/supabase-client'
import { SupabaseService } from './supabase-service'
import { supabase } from './supabase-client'

interface AuthContextType {
  user: User | null
  signIn: (email: string, password: string) => Promise<User>
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<User>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check if user is already logged in
    const checkUser = async () => {
      try {
        const currentUser = await SupabaseService.getCurrentUser()
        setUser(currentUser)
      } catch (error) {
        console.error('Error checking current user:', error)
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.id)

      if (event === 'SIGNED_OUT' || !session?.user) {
        setUser(null)
        setLoading(false)
        return
      }

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        setLoading(true)
        try {
          const userData = await SupabaseService.getCurrentUser()
          setUser(userData)
        } catch (error) {
          console.error('Error fetching user data:', error)
          // Si erreur de récupération des données utilisateur, déconnecter
          await supabase.auth.signOut()
          setUser(null)
        } finally {
          setLoading(false)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<User> => {
    try {
      const user = await SupabaseService.signIn(email, password)
      setUser(user)
      return user
    } catch (error) {
      console.error('Sign in error:', error)
      setUser(null)
      throw error
    }
  }

  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<User> => {
    try {
      const user = await SupabaseService.signUp(email, password, userData)
      setUser(user)
      return user
    } catch (error) {
      console.error('Sign up error:', error)
      setUser(null)
      throw error
    }
  }

  const signOut = async (): Promise<void> => {
    await SupabaseService.signOut()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{
      user,
      signIn,
      signUp,
      signOut,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}