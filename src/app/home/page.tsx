'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Listing } from '@/lib/supabase-client'
import SwipeCard from '@/components/SwipeCard'
import ListingCard from '@/components/ListingCard'
import {
  LogOut, MessageCircle, Search, Plus, Filter,
  SlidersHorizontal, Grid, Layers, X, Settings,
  Heart, Star, Users, MapPin
} from 'lucide-react'
import {
  SearchFilters,
  NEIGHBORHOODS_PARIS,
  AMENITIES_OPTIONS,
  RULES_OPTIONS
} from '@/types/new-types'

type ViewMode = 'swipe' | 'list'

export default function Home() {
  const { user, signOut } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [viewMode, setViewMode] = useState<ViewMode>('swipe')
  const [showFilters, setShowFilters] = useState(false)
  const [showCompatibilityScore, setShowCompatibilityScore] = useState(true)

  const [filters, setFilters] = useState<SearchFilters>({
    neighborhoods: [],
    rent_min: undefined,
    rent_max: undefined,
    available_from: undefined,
    minimum_duration_months: undefined,
    property_type: undefined,
    furnished: undefined,
    amenities: [],
    rules: [],
    roommate_count_min: undefined,
    roommate_count_max: undefined,
    age_compatibility: true,
    lifestyle_compatibility: true
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (!user.profile_completed) {
      router.push('/setup-profile')
      return
    }

    loadListings()
  }, [user, router])

  useEffect(() => {
    applyFilters()
  }, [listings, filters])

  const loadListings = async () => {
    try {
      const listingsData = await SupabaseService.getListings()
      setListings(listingsData)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...listings]

    // Filtres de base
    if (filters.neighborhoods && filters.neighborhoods.length > 0) {
      filtered = filtered.filter(listing =>
        filters.neighborhoods!.includes(listing.neighborhood)
      )
    }

    if (filters.rent_min) {
      filtered = filtered.filter(listing => listing.rent_amount >= filters.rent_min!)
    }

    if (filters.rent_max) {
      filtered = filtered.filter(listing => listing.rent_amount <= filters.rent_max!)
    }

    if (filters.property_type) {
      filtered = filtered.filter(listing => listing.property_type === filters.property_type)
    }

    if (filters.furnished !== undefined) {
      filtered = filtered.filter(listing => listing.furnished === filters.furnished)
    }

    // Filtres équipements
    if (filters.amenities && filters.amenities.length > 0) {
      filtered = filtered.filter(listing =>
        filters.amenities!.some(amenity => listing.amenities.includes(amenity))
      )
    }

    // Filtres règles
    if (filters.rules && filters.rules.length > 0) {
      filtered = filtered.filter(listing =>
        filters.rules!.some(rule => listing.rules.includes(rule))
      )
    }

    // Filtres nombre de colocataires
    if (filters.roommate_count_min) {
      filtered = filtered.filter(listing =>
        listing.current_roommate_count >= filters.roommate_count_min!
      )
    }

    if (filters.roommate_count_max) {
      filtered = filtered.filter(listing =>
        listing.current_roommate_count <= filters.roommate_count_max!
      )
    }

    // TODO: Implémenter la compatibilité d'âge et de style de vie
    // if (filters.age_compatibility && user) {
    //   filtered = filtered.filter(listing =>
    //     checkAgeCompatibility(user, listing)
    //   )
    // }

    setFilteredListings(filtered)
    setCurrentIndex(0)
  }

  const handleSwipe = async (direction: 'left' | 'right') => {
    const currentListing = filteredListings[currentIndex]

    if (direction === 'right' && user && currentListing) {
      try {
        await SupabaseService.likeListing(user.id, currentListing.id)

        // Check if it's a match (landlord also liked this user)
        const usersWhoLiked = await SupabaseService.getUsersWhoLikedListing(currentListing.id)
        const isMatch = usersWhoLiked.some(likedUser => likedUser.id === user.id)

        if (isMatch) {
          // Create match
          await SupabaseService.createMatch(user.id, currentListing.landlord_id, currentListing.id)

          // Show match notification (you could add a toast here)
          console.log('Match créé!')
        }
      } catch (error) {
        console.error('Error liking listing:', error)
      }
    }

    // Move to next card
    setCurrentIndex(prev => prev + 1)
  }

  const resetFilters = () => {
    setFilters({
      neighborhoods: [],
      rent_min: undefined,
      rent_max: undefined,
      available_from: undefined,
      minimum_duration_months: undefined,
      property_type: undefined,
      furnished: undefined,
      amenities: [],
      rules: [],
      roommate_count_min: undefined,
      roommate_count_max: undefined,
      age_compatibility: true,
      lifestyle_compatibility: true
    })
  }

  const toggleNeighborhood = (neighborhood: string) => {
    setFilters(prev => ({
      ...prev,
      neighborhoods: prev.neighborhoods?.includes(neighborhood)
        ? prev.neighborhoods.filter(n => n !== neighborhood)
        : [...(prev.neighborhoods || []), neighborhood]
    }))
  }

  const toggleAmenity = (amenity: string) => {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities?.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...(prev.amenities || []), amenity]
    }))
  }

  const toggleRule = (rule: string) => {
    setFilters(prev => ({
      ...prev,
      rules: prev.rules?.includes(rule)
        ? prev.rules.filter(r => r !== rule)
        : [...(prev.rules || []), rule]
    }))
  }

  const getCompatibilityScore = (listing: Listing): number => {
    // TODO: Implémenter le calcul de score de compatibilité
    // Basé sur les préférences utilisateur vs profil de l'annonce
    return Math.floor(Math.random() * 30) + 70 // Score simulé 70-100%
  }

  if (!user) return null

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des annonces...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 to-secondary/10">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <h1 className="text-xl font-display font-bold text-dark-gray">
                🏠 Sublet
              </h1>

              {/* View mode toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('swipe')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'swipe'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Layers className="w-4 h-4 inline mr-1" />
                  Swipe
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-1 rounded-md text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-white text-primary shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <Grid className="w-4 h-4 inline mr-1" />
                  Liste
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {/* Filters toggle */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`p-2 rounded-lg transition-all ${
                  showFilters
                    ? 'bg-primary text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <Filter className="w-5 h-5" />
              </button>

              {/* Messages */}
              <button
                onClick={() => router.push('/matches')}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <MessageCircle className="w-5 h-5" />
              </button>

              {/* Add listing */}
              <button
                onClick={() => router.push('/create-listing')}
                className="p-2 rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
              >
                <Plus className="w-5 h-5" />
              </button>

              {/* Profile menu */}
              <button
                onClick={() => signOut()}
                className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex">
        {/* Filters sidebar */}
        {showFilters && (
          <div className="w-80 bg-white border-r min-h-screen p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Filtres</h2>
              <div className="flex space-x-2">
                <button
                  onClick={resetFilters}
                  className="text-sm text-gray-600 hover:text-gray-800"
                >
                  Réinitialiser
                </button>
                <button
                  onClick={() => setShowFilters(false)}
                  className="p-1 rounded hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {/* Prix */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Budget mensuel (€)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.rent_min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      rent_min: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="input text-sm"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.rent_max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      rent_max: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="input text-sm"
                  />
                </div>
              </div>

              {/* Quartiers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quartiers
                </label>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {NEIGHBORHOODS_PARIS.slice(0, 10).map(neighborhood => (
                    <label key={neighborhood} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.neighborhoods?.includes(neighborhood) || false}
                        onChange={() => toggleNeighborhood(neighborhood)}
                        className="mr-2 text-primary focus:ring-primary"
                      />
                      {neighborhood}
                    </label>
                  ))}
                </div>
              </div>

              {/* Type de logement */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type de logement
                </label>
                <select
                  value={filters.property_type || ''}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    property_type: e.target.value || undefined
                  }))}
                  className="input text-sm"
                >
                  <option value="">Tous types</option>
                  <option value="Appartement">Appartement</option>
                  <option value="Maison">Maison</option>
                  <option value="Studio">Studio</option>
                  <option value="Colocation">Colocation</option>
                </select>
              </div>

              {/* Meublé */}
              <div>
                <label className="flex items-center text-sm">
                  <input
                    type="checkbox"
                    checked={filters.furnished || false}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      furnished: e.target.checked ? true : undefined
                    }))}
                    className="mr-2 text-primary focus:ring-primary"
                  />
                  Meublé uniquement
                </label>
              </div>

              {/* Équipements */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Équipements souhaités
                </label>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {AMENITIES_OPTIONS.slice(0, 8).map(amenity => (
                    <label key={amenity} className="flex items-center text-sm">
                      <input
                        type="checkbox"
                        checked={filters.amenities?.includes(amenity) || false}
                        onChange={() => toggleAmenity(amenity)}
                        className="mr-2 text-primary focus:ring-primary"
                      />
                      {amenity.replace('_', ' ')}
                    </label>
                  ))}
                </div>
              </div>

              {/* Nombre de colocataires */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nombre de colocataires
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.roommate_count_min || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      roommate_count_min: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="input text-sm"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.roommate_count_max || ''}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      roommate_count_max: e.target.value ? parseInt(e.target.value) : undefined
                    }))}
                    className="input text-sm"
                    min="0"
                  />
                </div>
              </div>

              {/* Compatibilité */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compatibilité
                </label>
                <div className="space-y-2">
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.age_compatibility || false}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        age_compatibility: e.target.checked
                      }))}
                      className="mr-2 text-primary focus:ring-primary"
                    />
                    Compatibilité d'âge
                  </label>
                  <label className="flex items-center text-sm">
                    <input
                      type="checkbox"
                      checked={filters.lifestyle_compatibility || false}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        lifestyle_compatibility: e.target.checked
                      }))}
                      className="mr-2 text-primary focus:ring-primary"
                    />
                    Compatibilité de style de vie
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main content */}
        <div className="flex-1">
          <div className="p-4">
            {/* Stats */}
            <div className="mb-6">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">{filteredListings.length}</div>
                      <div className="text-xs text-gray-600">Annonces</div>
                    </div>
                    {viewMode === 'swipe' && filteredListings.length > 0 && (
                      <>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-gray-800">{currentIndex + 1}</div>
                          <div className="text-xs text-gray-600">Actuelle</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {getCompatibilityScore(filteredListings[currentIndex])}%
                          </div>
                          <div className="text-xs text-gray-600">Compatibilité</div>
                        </div>
                      </>
                    )}
                  </div>

                  {viewMode === 'swipe' && (
                    <div className="flex items-center space-x-2">
                      <button className="flex items-center text-sm text-gray-600">
                        <Settings className="w-4 h-4 mr-1" />
                        Paramètres
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            {filteredListings.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Search className="w-16 h-16 mx-auto" />
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">
                  Aucune annonce trouvée
                </h3>
                <p className="text-gray-600 mb-4">
                  Essaie d'ajuster tes filtres pour voir plus d'annonces
                </p>
                <button
                  onClick={resetFilters}
                  className="btn-primary"
                >
                  Réinitialiser les filtres
                </button>
              </div>
            ) : viewMode === 'swipe' ? (
              /* Swipe mode */
              <div className="flex justify-center">
                <div className="relative w-full max-w-md">
                  {filteredListings.slice(currentIndex, currentIndex + 3).map((listing, index) => (
                    <div
                      key={listing.id}
                      className="absolute inset-0"
                      style={{
                        zIndex: 3 - index,
                        transform: `translateY(${index * 4}px) scale(${1 - index * 0.02})`,
                      }}
                    >
                      <SwipeCard
                        listing={listing}
                        onSwipe={handleSwipe}
                        isTopCard={index === 0}
                        compatibilityScore={showCompatibilityScore ? getCompatibilityScore(listing) : undefined}
                      />
                    </div>
                  ))}

                  {currentIndex >= filteredListings.length && (
                    <div className="text-center py-12">
                      <div className="text-primary mb-4">
                        <Heart className="w-16 h-16 mx-auto" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">
                        Plus d'annonces !
                      </h3>
                      <p className="text-gray-600 mb-4">
                        Tu as vu toutes les annonces disponibles
                      </p>
                      <button
                        onClick={() => {
                          setCurrentIndex(0)
                          loadListings()
                        }}
                        className="btn-primary"
                      >
                        Recharger
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* List mode */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredListings.map((listing) => (
                  <div key={listing.id} className="relative">
                    <ListingCard listing={listing} />
                    {showCompatibilityScore && (
                      <div className="absolute top-3 right-3 bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        <Star className="w-3 h-3 inline mr-1" />
                        {getCompatibilityScore(listing)}%
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}