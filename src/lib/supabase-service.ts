import { supabase } from './supabase-client'
import { User, Listing, Message, Like, Match } from './supabase-client'

export class SupabaseService {
  // Authentication
  static async signUp(email: string, password: string, userData: Partial<User>) {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
    })

    if (authError) throw authError

    if (authData.user) {
      // Create user profile
      const { data: newUserData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          name: userData.name || 'User',
          role: userData.role || 'seeker',
          interests: userData.interests || [],
          avatar: userData.avatar,
        })
        .select()
        .single()

      if (userError) throw userError
      return newUserData
    }

    throw new Error('No user created')
  }

  static async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)
      throw new Error('Email ou mot de passe incorrect')
    }

    if (authData.user) {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()

      if (userError) {
        console.error('User data error:', userError)
        // Déconnecter l'utilisateur si ses données n'existent pas
        await supabase.auth.signOut()
        throw new Error('Email ou mot de passe incorrect')
      }
      return userData
    }

    throw new Error('Email ou mot de passe incorrect')
  }

  static async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  static async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return null

    const { data: userData, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      console.error('Error fetching user data:', error)
      // Si l'utilisateur n'existe pas dans notre table, déconnecter
      if (error.code === 'PGRST116') {
        await supabase.auth.signOut()
        return null
      }
      throw error
    }
    return userData
  }

  // Listings
  static async getListings(): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getListingById(id: string): Promise<Listing | null> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  }

  static async searchListings(filters: {
    maxPrice?: number
    location?: string
    propertyType?: string
    minRooms?: number
    available?: string
  }): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)

    if (filters.maxPrice) {
      query = query.lte('price', filters.maxPrice)
    }
    if (filters.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (filters.propertyType) {
      query = query.eq('property_type', filters.propertyType)
    }
    if (filters.minRooms) {
      query = query.gte('rooms', filters.minRooms)
    }
    if (filters.available) {
      query = query.ilike('available', `%${filters.available}%`)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async createListing(listingData: Omit<Listing, 'id' | 'created_at' | 'landlord'>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .insert(listingData)
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async getListingsByLandlord(landlordId: string): Promise<Listing[]> {
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .eq('landlord_id', landlordId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Likes
  static async likeListing(userId: string, listingId: string): Promise<Like> {
    const { data, error } = await supabase
      .from('likes')
      .insert({
        user_id: userId,
        listing_id: listingId,
      })
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async getLikesForListing(listingId: string): Promise<Like[]> {
    const { data, error } = await supabase
      .from('likes')
      .select('*')
      .eq('listing_id', listingId)

    if (error) throw error
    return data || []
  }

  static async getUsersWhoLikedListing(listingId: string): Promise<User[]> {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        user:users!user_id(*)
      `)
      .eq('listing_id', listingId)

    if (error) throw error
    return (data?.map(like => like.user).filter(Boolean) || []) as unknown as User[]
  }

  // Matches
  static async createMatch(seekerId: string, landlordId: string, listingId: string): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        seeker_id: seekerId,
        landlord_id: landlordId,
        listing_id: listingId,
      })
      .select(`
        *,
        listing:listings(*),
        seeker:users!seeker_id(*),
        landlord:users!landlord_id(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async getMatchesForUser(userId: string): Promise<Match[]> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        listing:listings(*),
        seeker:users!seeker_id(*),
        landlord:users!landlord_id(*)
      `)
      .or(`seeker_id.eq.${userId},landlord_id.eq.${userId}`)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // Messages
  static async sendMessage(senderId: string, receiverId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: senderId,
        receiver_id: receiverId,
        content,
      })
      .select(`
        *,
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async getMessages(userId1: string, userId2: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(*),
        receiver:users!receiver_id(*)
      `)
      .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static subscribeToMessages(userId1: string, userId2: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1}))`,
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }

  // Storage
  static async uploadImage(bucket: string, file: File, path?: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 15)
    const fileName = path || `${timestamp}_${randomId}.${fileExt}`

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      console.error('Storage upload error:', error)
      throw new Error(`Erreur upload image: ${error.message}`)
    }

    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)

    return urlData.publicUrl
  }

  static async uploadMultipleImages(bucket: string, files: File[]): Promise<string[]> {
    const uploadPromises = files.map(file => this.uploadImage(bucket, file))
    return Promise.all(uploadPromises)
  }
}