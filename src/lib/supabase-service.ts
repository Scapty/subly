import { supabase } from './supabase-client'
import {
  User,
  Listing,
  Message,
  Like,
  Match,
  SearchFilters,
  CompatibilityResult,
  Lifestyle
} from './supabase-client'

export class SupabaseService {
  // ===========================
  // AUTHENTICATION
  // ===========================

  static async signUp(email: string, password: string, userData: Partial<User>) {
    const normalizedEmail = email.trim().toLowerCase()

    // Configuration pour désactiver la vérification d'email
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        emailRedirectTo: undefined, // Pas de redirection email
      }
    })

    if (authError) {
      console.error('Auth signup error:', authError)
      // Gérer spécifiquement l'erreur de confirmation d'email
      if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
        // Si l'utilisateur existe déjà mais n'est pas confirmé, on essaie de le connecter directement
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        })

        if (signInError) {
          throw new Error('Un compte existe déjà avec cet email. Veuillez vous connecter.')
        }

        // Récupérer les données utilisateur existantes
        if (signInData.user) {
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', signInData.user.id)
            .single()

          if (userError) {
            throw new Error('Email ou mot de passe incorrect')
          }
          return existingUser
        }
      }
      throw authError
    }

    if (authData.user) {
      // Créer le profil utilisateur avec la structure actuelle (name au lieu de first_name/last_name)
      const fullName = `${userData.first_name || 'User'} ${userData.last_name || ''}`.trim()

      const { data: newUserData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: normalizedEmail,
          name: fullName,
          role: 'seeker', // Valeur par défaut
          interests: []
        })
        .select()
        .single()

      if (userError) throw userError
      return newUserData
    }

    throw new Error('Erreur lors de la création du compte')
  }

  static async signIn(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    })

    if (authError) {
      console.error('Auth error:', authError)

      // Gérer spécifiquement les erreurs de confirmation d'email
      if (authError.message.includes('Email not confirmed') || authError.message.includes('email_not_confirmed')) {
        throw new Error('Votre compte n\'est pas encore activé. Contactez le support si le problème persiste.')
      }

      // Gérer les erreurs d'identifiants incorrects
      if (authError.message.includes('Invalid login credentials') ||
          authError.message.includes('Email ou mot de passe incorrect') ||
          authError.message.includes('invalid_credentials')) {
        throw new Error('Email ou mot de passe incorrect')
      }

      // Erreur générique pour autres cas
      console.error('Unexpected auth error:', authError)
      throw new Error('Erreur de connexion. Veuillez réessayer.')
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

  // ===========================
  // PROFILE MANAGEMENT
  // ===========================

  static async updateUserProfile(userId: string, profileData: Partial<User>) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static async completeProfile(userId: string, profileData: {
    avatar?: string
    name?: string
    interests?: string[]
  }) {
    const { data, error } = await supabase
      .from('users')
      .update({
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  // ===========================
  // LISTINGS
  // ===========================

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

  static async searchListings(filters: SearchFilters): Promise<Listing[]> {
    let query = supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .eq('is_active', true)

    // Filtres de base
    if (filters.rent_min) {
      query = query.gte('rent_amount', filters.rent_min)
    }
    if (filters.rent_max) {
      query = query.lte('rent_amount', filters.rent_max)
    }
    if (filters.neighborhoods && filters.neighborhoods.length > 0) {
      query = query.in('neighborhood', filters.neighborhoods)
    }
    if (filters.property_type) {
      query = query.eq('property_type', filters.property_type)
    }
    if (filters.furnished !== undefined) {
      query = query.eq('furnished', filters.furnished)
    }
    if (filters.available_from) {
      query = query.gte('available_from', filters.available_from)
    }
    if (filters.minimum_duration_months) {
      query = query.lte('minimum_duration_months', filters.minimum_duration_months)
    }

    // Filtres colocataires
    if (filters.roommate_count_min) {
      query = query.gte('current_roommate_count', filters.roommate_count_min)
    }
    if (filters.roommate_count_max) {
      query = query.lte('current_roommate_count', filters.roommate_count_max)
    }

    // Filtres équipements (si un des équipements recherchés est présent)
    if (filters.amenities && filters.amenities.length > 0) {
      query = query.overlaps('amenities', filters.amenities)
    }

    // Filtres règles
    if (filters.rules && filters.rules.length > 0) {
      query = query.overlaps('rules', filters.rules)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query
    if (error) throw error
    return data || []
  }

  static async createListing(listingData: any): Promise<Listing> {
    // Mapper les nouveaux champs vers les anciens pour la compatibilité
    const mappedData = {
      landlord_id: listingData.landlord_id,
      title: listingData.title,
      description: listingData.description,
      photos: listingData.photos || [],
      price: listingData.rent_amount || listingData.price || 0,
      location: listingData.address || listingData.neighborhood || listingData.location || '',
      available: listingData.available_from || listingData.available || 'À définir',
      amenities: listingData.amenities || [],
      property_type: listingData.property_type || 'apartment',
      rooms: listingData.total_rooms || listingData.available_rooms || listingData.rooms || 1,
      size: listingData.apartment_size || listingData.size,
      rules: listingData.rules || []
    }

    const { data, error } = await supabase
      .from('listings')
      .insert(mappedData)
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async updateListing(listingId: string, listingData: Partial<Listing>): Promise<Listing> {
    const { data, error } = await supabase
      .from('listings')
      .update({
        ...listingData,
        updated_at: new Date().toISOString()
      })
      .eq('id', listingId)
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

  // ===========================
  // LIKES
  // ===========================

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
      .select(`
        *,
        user:users!user_id(*)
      `)
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

  static async getUserLikes(userId: string): Promise<Like[]> {
    const { data, error } = await supabase
      .from('likes')
      .select(`
        *,
        listing:listings(*)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  // ===========================
  // MATCHES
  // ===========================

  static async createMatch(seekerId: string, landlordId: string, listingId: string, compatibilityScore?: number): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .insert({
        seeker_id: seekerId,
        landlord_id: landlordId,
        listing_id: listingId,
        compatibility_score: compatibilityScore,
        status: 'active'
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
      .eq('status', 'active')
      .order('matched_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  static async getMatchBetweenUsers(userId1: string, userId2: string): Promise<Match | null> {
    const { data, error } = await supabase
      .from('matches')
      .select(`
        *,
        listing:listings(*),
        seeker:users!seeker_id(*),
        landlord:users!landlord_id(*)
      `)
      .or(`and(seeker_id.eq.${userId1},landlord_id.eq.${userId2}),and(seeker_id.eq.${userId2},landlord_id.eq.${userId1})`)
      .eq('status', 'active')
      .maybeSingle()

    if (error) throw error
    return data
  }

  static async updateMatchStatus(matchId: string, status: 'active' | 'archived' | 'blocked'): Promise<Match> {
    const { data, error } = await supabase
      .from('matches')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', matchId)
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

  // ===========================
  // MESSAGES
  // ===========================

  static async sendMessage(matchId: string, senderId: string, content: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .insert({
        match_id: matchId,
        sender_id: senderId,
        content,
      })
      .select(`
        *,
        sender:users!sender_id(*),
        match:matches(*)
      `)
      .single()

    if (error) throw error
    return data
  }

  static async getMessages(matchId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:users!sender_id(*)
      `)
      .eq('match_id', matchId)
      .order('created_at', { ascending: true })

    if (error) throw error
    return data || []
  }

  static async markMessageAsRead(messageId: string): Promise<Message> {
    const { data, error } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single()

    if (error) throw error
    return data
  }

  static subscribeToMessages(matchId: string, callback: (message: Message) => void) {
    return supabase
      .channel('messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`,
        },
        (payload) => {
          callback(payload.new as Message)
        }
      )
      .subscribe()
  }

  // ===========================
  // COMPATIBILITY
  // ===========================

  static calculateCompatibilityScore(seeker: User, listing: Listing): CompatibilityResult {
    let totalScore = 0
    let breakdown = {
      age_compatibility: 0,
      lifestyle_compatibility: 0,
      hobbies_compatibility: 0,
      preferences_match: 0
    }
    let strengths: string[] = []
    let potential_issues: string[] = []

    // 1. Compatibilité d'âge (25 points) - Simplifié pour la structure actuelle
    if (seeker.age && listing.current_roommate_ages && listing.current_roommate_ages.length > 0) {
      const averageAge = listing.current_roommate_ages.reduce((a, b) => a + b, 0) / listing.current_roommate_ages.length
      const ageDiff = Math.abs(seeker.age - averageAge)

      if (ageDiff <= 3) {
        breakdown.age_compatibility = 25
        strengths.push('Âges très compatibles')
      } else if (ageDiff <= 7) {
        breakdown.age_compatibility = 18
        strengths.push('Âges compatibles')
      } else if (ageDiff <= 12) {
        breakdown.age_compatibility = 10
        potential_issues.push('Écart d\'âge notable')
      } else {
        breakdown.age_compatibility = 5
        potential_issues.push('Écart d\'âge important')
      }
    } else {
      breakdown.age_compatibility = 15 // Score neutre si pas d'info
    }

    // 2. Compatibilité lifestyle (35 points) - Simplifié pour la structure actuelle
    if (seeker.lifestyle && listing.roommate_lifestyle) {
      let lifestyleScore = 0

      // Niveau social (10 points)
      const socialDiff = Math.abs(seeker.lifestyle.social_level - listing.roommate_lifestyle.social_level)
      lifestyleScore += Math.max(0, 10 - socialDiff * 2)

      // Propreté (10 points)
      const cleanDiff = Math.abs(seeker.lifestyle.cleanliness - listing.roommate_lifestyle.cleanliness)
      lifestyleScore += Math.max(0, 10 - cleanDiff * 2)

      // Sensibilité au bruit (10 points)
      const noiseDiff = Math.abs(seeker.lifestyle.noise_sensitivity - listing.roommate_lifestyle.noise_sensitivity)
      lifestyleScore += Math.max(0, 10 - noiseDiff * 2)

      // Correspondances exactes (5 points chacune)
      if (seeker.lifestyle.cohabitation_style === listing.roommate_lifestyle.cohabitation_style) {
        lifestyleScore += 5
        strengths.push('Style de cohabitation compatible')
      } else {
        potential_issues.push('Styles de cohabitation différents')
      }

      breakdown.lifestyle_compatibility = Math.min(lifestyleScore, 35)

      if (lifestyleScore >= 30) {
        strengths.push('Styles de vie très compatibles')
      } else if (lifestyleScore >= 20) {
        strengths.push('Styles de vie assez compatibles')
      } else {
        potential_issues.push('Styles de vie différents')
      }
    } else {
      breakdown.lifestyle_compatibility = 20 // Score neutre
    }

    // 3. Compatibilité hobbies/intérêts (20 points)
    if (seeker.hobbies && seeker.hobbies.length > 0) {
      // Pour l'instant, on simule car on n'a pas les hobbies du landlord
      // Dans une vraie implémentation, on comparerait avec les hobbies du landlord
      const commonInterests = Math.floor(Math.random() * 3) + 1 // Simulé
      breakdown.hobbies_compatibility = Math.min(commonInterests * 7, 20)

      if (breakdown.hobbies_compatibility >= 15) {
        strengths.push('Intérêts communs')
      } else if (breakdown.hobbies_compatibility >= 10) {
        strengths.push('Quelques intérêts partagés')
      }
    } else {
      breakdown.hobbies_compatibility = 10
    }

    // 4. Correspondance des préférences (20 points)
    let preferencesScore = 0

    // Nombre de chambres vs préférence (approximation)
    if (seeker.preferred_roommate_count !== undefined) {
      if (seeker.preferred_roommate_count === (listing.current_roommate_count || listing.rooms)) {
        preferencesScore += 10
        strengths.push('Nombre de colocataires idéal')
      } else if (Math.abs(seeker.preferred_roommate_count - (listing.current_roommate_count || listing.rooms)) <= 1) {
        preferencesScore += 6
      } else {
        potential_issues.push('Nombre de colocataires non idéal')
      }
    } else {
      preferencesScore += 5
    }

    // Préférences d'âge (simplifié pour la structure actuelle)
    if (seeker.preferred_age_min || seeker.preferred_age_max) {
      const avgAge = (listing.current_roommate_ages && listing.current_roommate_ages.length > 0)
        ? listing.current_roommate_ages.reduce((a, b) => a + b, 0) / listing.current_roommate_ages.length
        : 25

      let agePreferenceMatch = true
      if (seeker.preferred_age_min && avgAge < seeker.preferred_age_min) agePreferenceMatch = false
      if (seeker.preferred_age_max && avgAge > seeker.preferred_age_max) agePreferenceMatch = false

      if (agePreferenceMatch) {
        preferencesScore += 10
        strengths.push('Âge dans les préférences')
      } else {
        potential_issues.push('Âge hors préférences')
      }
    } else {
      preferencesScore += 5
    }

    breakdown.preferences_match = Math.min(preferencesScore, 20)

    // Calcul du score total
    totalScore = Object.values(breakdown).reduce((sum, score) => sum + score, 0)

    return {
      total_score: Math.round(totalScore),
      breakdown,
      strengths,
      potential_issues
    }
  }

  // ===========================
  // STORAGE
  // ===========================

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

  // ===========================
  // RECOMMANDATIONS
  // ===========================

  static async getRecommendedListings(userId: string, limit: number = 10): Promise<Listing[]> {
    // Pour l'instant, on retourne simplement les annonces récentes
    // Dans une vraie implémentation, on utiliserait l'IA pour les recommandations
    const { data, error } = await supabase
      .from('listings')
      .select(`
        *,
        landlord:users!landlord_id(*)
      `)
      .eq('is_active', true)
      .neq('landlord_id', userId) // Exclure ses propres annonces
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) throw error
    return data || []
  }
}