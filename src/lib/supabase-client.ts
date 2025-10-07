import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'seeker' | 'landlord'
  interests: string[]
  created_at: string
}

export interface Listing {
  id: string
  title: string
  photos: string[]
  price: number
  location: string
  available: string
  description: string
  amenities: string[]
  landlord_id: string
  landlord?: User
  property_type?: string
  rooms?: number
  size?: number
  rules?: string[]
  created_at: string
}

export interface Message {
  id: string
  sender_id: string
  receiver_id: string
  content: string
  created_at: string
  sender?: User
  receiver?: User
}

export interface Like {
  id: string
  user_id: string
  listing_id: string
  created_at: string
}

export interface Match {
  id: string
  seeker_id: string
  landlord_id: string
  listing_id: string
  listing?: Listing
  seeker?: User
  landlord?: User
  created_at: string
}