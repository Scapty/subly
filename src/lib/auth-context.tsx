'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { User } from '@/types'
import { auth } from './supabase'

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
    const currentUser = auth.getCurrentUser()
    setUser(currentUser)
    setLoading(false)
  }, [])

  const signIn = async (email: string, password: string): Promise<User> => {
    const user = await auth.signIn(email, password)
    setUser(user)
    return user
  }

  const signUp = async (email: string, password: string, userData: Partial<User>): Promise<User> => {
    const user = await auth.signUp(email, password, userData)
    setUser(user)
    return user
  }

  const signOut = async (): Promise<void> => {
    await auth.signOut()
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