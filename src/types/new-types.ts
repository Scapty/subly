// ===========================
// NOUVEAUX TYPES TYPESCRIPT
// Pour la refonte matching logement
// ===========================

// Enums et types de base
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

// Listes d'options prédéfinies
export const HOBBIES_OPTIONS = [
  'sport', 'musique', 'lecture', 'nature', 'cuisine', 'voyage',
  'cinéma', 'photographie', 'gaming', 'art', 'danse', 'yoga',
  'bricolage', 'jardinage', 'mode', 'technologie'
] as const

export const AMENITIES_OPTIONS = [
  'machine_a_laver', 'lave_vaisselle', 'balcon', 'jardin', 'parking',
  'ascenseur', 'climatisation', 'cheminee', 'cave', 'wifi_fibre',
  'salle_de_sport', 'piscine', 'concierge', 'interphone'
] as const

export const RULES_OPTIONS = [
  'non_fumeur', 'animaux_ok', 'calme_requis', 'fêtes_ok',
  'amis_ok', 'couple_ok', 'étudiant_ok', 'professionnel_ok'
] as const

export const NEIGHBORHOODS_PARIS = [
  '1er arrondissement', '2ème arrondissement', '3ème arrondissement',
  '4ème arrondissement', '5ème arrondissement', '6ème arrondissement',
  '7ème arrondissement', '8ème arrondissement', '9ème arrondissement',
  '10ème arrondissement', '11ème arrondissement', '12ème arrondissement',
  '13ème arrondissement', '14ème arrondissement', '15ème arrondissement',
  '16ème arrondissement', '17ème arrondissement', '18ème arrondissement',
  '19ème arrondissement', '20ème arrondissement',
  'Boulogne-Billancourt', 'Neuilly-sur-Seine', 'Vincennes',
  'Montreuil', 'Saint-Denis', 'Levallois-Perret'
] as const

// Interface utilisateur (nouvelle version)
export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  avatar_url?: string
  description?: string
  age?: number
  gender?: Gender

  // Profil de compatibilité
  hobbies: string[]
  lifestyle: Lifestyle

  // Préférences de cohabitation
  preferred_roommate_count?: number
  preferred_age_min?: number
  preferred_age_max?: number
  preferred_gender?: Gender

  // Status
  profile_completed: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

// Interface annonce logement (nouvelle version)
export interface Listing {
  id: string
  landlord_id: string
  landlord?: User

  // Infos basiques
  title: string
  description: string
  photos: string[]

  // Localisation & prix
  address: string
  neighborhood: string
  rent_amount: number
  charges_included: boolean

  // Disponibilité
  available_from: string // ISO date
  minimum_duration_months: number

  // Caractéristiques
  property_type: string
  total_rooms?: number
  available_rooms?: number
  apartment_size?: number // m²
  furnished: boolean

  // Tags
  amenities: string[]
  rules: string[]

  // Colocataires actuels
  current_roommate_count: number
  current_roommate_ages: number[]
  roommate_lifestyle: Lifestyle

  // Status
  is_active: boolean

  // Timestamps
  created_at: string
  updated_at: string
}

// Interface like (simplifiée)
export interface Like {
  id: string
  liker_id: string
  listing_id: string
  created_at: string
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
}

// Interface message
export interface Message {
  id: string
  match_id: string
  sender_id: string
  content: string
  read_at?: string

  // Relations
  sender?: User
  match?: Match

  // Timestamps
  created_at: string
}

// ===========================
// TYPES POUR LES FORMULAIRES
// ===========================

// Form data pour l'inscription simplifiée
export interface RegisterFormData {
  first_name: string
  last_name: string
  email: string
  password: string
  confirmPassword: string
}

// Form data pour le setup de profil
export interface ProfileSetupFormData {
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

// Form data pour créer une annonce
export interface ListingFormData {
  title: string
  description: string
  photos: string[]
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

// ===========================
// TYPES POUR LES FILTRES
// ===========================

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
  age_compatibility?: boolean // filtrer selon préférences d'âge
  lifestyle_compatibility?: boolean // filtrer selon compatibilité lifestyle
}

// ===========================
// TYPES POUR LE MATCHING
// ===========================

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

// Recommandation de listing avec score
export interface ListingRecommendation {
  listing: Listing
  compatibility: CompatibilityResult
  match_reasons: string[] // pourquoi recommandé
}

// Les types sont exportés individuellement avec le mot-clé export
// Pas besoin d'export par défaut pour les types TypeScript