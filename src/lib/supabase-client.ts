import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key'

// Debug: Log environment variables in development
if (process.env.NODE_ENV === 'development') {
  console.log('🔧 Supabase Config:', {
    url: supabaseUrl,
    keyLength: supabaseAnonKey.length,
    isPlaceholder: supabaseUrl.includes('placeholder')
  })
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types de base
export type Gender = 'homme' | 'femme' | 'autre' | 'non-précisé'
export type SleepSchedule = 'early' | 'normal' | 'late' | 'flexible'
export type WeekendActivity = 'sortir' | 'maison' | 'flexible'
export type GuestFrequency = 'jamais' | 'rarement' | 'souvent' | 'flexible'
export type CohabitationStyle = 'amis' | 'indépendants' | 'familial'
export type MatchStatus = 'active' | 'archived' | 'blocked'

// Interface pour le style de vie
export interface Lifestyle {
  social_level: number // 1-5 (1: calme, 5: très social)
  cleanliness: number // 1-5 (1: bordélique, 5: maniaque)
  noise_sensitivity: number // 1-5 (1: pas sensible, 5: très sensible)
  sleep_schedule: SleepSchedule
  weekend_activity: WeekendActivity
  guest_frequency: GuestFrequency
  cohabitation_style: CohabitationStyle
}

// Interface utilisateur (adaptée à la structure DB actuelle)
export interface User {
  id: string
  email: string
  name: string // Structure actuelle de la DB
  avatar?: string
  role: 'seeker' | 'landlord'
  interests: string[]

  // Timestamps
  created_at: string
  updated_at: string

  // Champs pour compatibilité avec le form d'inscription
  first_name?: string
  last_name?: string
  avatar_url?: string
  description?: string
  age?: number
  gender?: Gender

  // Profil de compatibilité (pour future mise à jour)
  hobbies?: string[]
  lifestyle?: Lifestyle

  // Préférences de cohabitation (pour future mise à jour)
  preferred_roommate_count?: number
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: Gender

  // Status (pour future mise à jour)
  profile_completed?: boolean
}

// Interface annonce logement (adaptée à la structure DB actuelle)
export interface Listing {
  id: string
  title: string
  photos: string[]
  price: number // Structure actuelle de la DB
  location: string // Structure actuelle de la DB
  available: string // Structure actuelle de la DB
  description: string
  amenities: string[]
  property_type: string
  rooms: number
  size?: number
  rules: string[]
  landlord_id: string
  landlord?: User

  // Timestamps
  created_at: string
  updated_at: string

  // Champs pour future mise à jour (version avancée)
  address?: string
  neighborhood?: string
  rent_amount?: number
  charges_included?: boolean
  available_from?: string // ISO date
  minimum_duration_months?: number
  total_rooms?: number
  available_rooms?: number
  apartment_size?: number // m²
  furnished?: boolean
  current_roommate_count?: number
  current_roommate_ages?: number[]
  roommate_lifestyle?: Lifestyle
  is_active?: boolean
}

// Interface like (adaptée à la structure DB actuelle)
export interface Like {
  id: string
  user_id: string // Structure actuelle de la DB
  listing_id: string
  created_at: string

  // Relations
  user?: User
  listing?: Listing

  // Compatibilité avec version avancée
  liker_id?: string
  liker?: User
}

// Interface match (enrichie)
export interface Match {
  id: string
  seeker_id: string
  landlord_id: string
  listing_id: string

  // Relations
  seeker?: User
  landlord?: User
  listing?: Listing

  // Score de compatibilité
  compatibility_score?: number

  // Status
  status: MatchStatus

  // Timestamps
  matched_at: string
  updated_at: string

  // Compatibilité avec l'ancien système
  created_at?: string
}

// Interface message (mise à jour)
export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  read_at?: string

  // Relations
  sender?: User
  receiver?: User
  match?: Match

  // Timestamps
  created_at: string

  // Compatibilité avec l'ancien système
  receiver_id?: string
}

// Types pour les filtres de recherche
export interface SearchFilters {
  neighborhoods?: string[]
  rent_min?: number
  rent_max?: number
  available_from?: string
  minimum_duration_months?: number
  property_type?: string
  furnished?: boolean
  amenities?: string[]
  rules?: string[]
  roommate_count_min?: number
  roommate_count_max?: number
  age_compatibility?: boolean
  lifestyle_compatibility?: boolean
}

// Résultat de calcul de compatibilité
export interface CompatibilityResult {
  total_score: number // 0-100
  breakdown: {
    age_compatibility: number
    lifestyle_compatibility: number
    hobbies_compatibility: number
    preferences_match: number
  }
  strengths: string[] // points forts du match
  potential_issues: string[] // points d'attention
}

// Les types sont exportés individuellement avec le mot-clé export
// Pas besoin d'export par défaut pour les types TypeScript