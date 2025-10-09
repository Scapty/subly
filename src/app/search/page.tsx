'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth-context'
import { SupabaseService } from '@/lib/supabase-service'
import { Listing } from '@/lib/supabase-client'
import ListingCard from '@/components/ListingCard'
import { ArrowLeft, Search, Filter, SlidersHorizontal } from 'lucide-react'

interface SearchFilters {
  location: string
  maxPrice: string
  propertyType: string
  minRooms: string
  available: string
}

export default function SearchPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [filteredListings, setFilteredListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    maxPrice: '',
    propertyType: '',
    minRooms: '',
    available: '',
  })

  useEffect(() => {
    if (!user) {
      router.push('/login')
      return
    }

    if (user.role !== 'seeker') {
      router.push('/post')
      return
    }

    loadListings()
  }, [user, router])

  useEffect(() => {
    applyFilters()
  }, [listings, filters, searchQuery])

  const loadListings = async () => {
    try {
      const listingsData = await SupabaseService.getListings()
      setListings(listingsData)
    } catch (error) {
      console.error('Error loading listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFilters = () => {
    let filtered = [...listings]

    // Text search
    if (searchQuery) {
      filtered = filtered.filter(listing =>
        listing.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (listing.neighborhood || listing.location || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        listing.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Location filter
    if (filters.location) {
      filtered = filtered.filter(listing =>
        (listing.neighborhood || listing.location || '').toLowerCase().includes(filters.location.toLowerCase())
      )
    }

    // Price filter
    if (filters.maxPrice) {
      const maxPrice = parseInt(filters.maxPrice)
      filtered = filtered.filter(listing => (listing.rent_amount || listing.price || 0) <= maxPrice)
    }

    // Property type filter
    if (filters.propertyType) {
      filtered = filtered.filter(listing => listing.property_type === filters.propertyType)
    }

    // Rooms filter
    if (filters.minRooms) {
      const minRooms = parseInt(filters.minRooms)
      filtered = filtered.filter(listing => (listing.rooms || 1) >= minRooms)
    }

    // Availability filter
    if (filters.available) {
      filtered = filtered.filter(listing =>
        (listing.available_from || listing.available || '').toLowerCase().includes(filters.available.toLowerCase())
      )
    }

    setFilteredListings(filtered)
  }

  const handleFilterChange = (key: keyof SearchFilters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const clearFilters = () => {
    setFilters({
      location: '',
      maxPrice: '',
      propertyType: '',
      minRooms: '',
      available: '',
    })
    setSearchQuery('')
  }

  const handleListingClick = (listing: Listing) => {
    router.push(`/listing/${listing.id}`)
  }

  const handleLikeListing = async (listing: Listing) => {
    if (!user) return

    try {
      await SupabaseService.likeListing(user.id, listing.id)
      // Could add optimistic UI update here
      alert('Logement liké ! 💕')
    } catch (error) {
      console.error('Error liking listing:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des logements...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center">
            <button onClick={() => router.push('/home')} className="mr-3">
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-xl font-display font-bold text-dark-gray">
              Explorer
            </h1>
          </div>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Search bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher un logement..."
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="px-4 pb-4 border-t border-gray-100">
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quartier
                  </label>
                  <input
                    type="text"
                    value={filters.location}
                    onChange={(e) => handleFilterChange('location', e.target.value)}
                    placeholder="Ex: Belleville"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prix max (€)
                  </label>
                  <input
                    type="number"
                    value={filters.maxPrice}
                    onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                    placeholder="800"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de logement
                  </label>
                  <select
                    value={filters.propertyType}
                    onChange={(e) => handleFilterChange('propertyType', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Tous</option>
                    <option value="studio">Studio</option>
                    <option value="apartment">Appartement</option>
                    <option value="house">Maison</option>
                    <option value="room">Chambre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Pièces min.
                  </label>
                  <select
                    value={filters.minRooms}
                    onChange={(e) => handleFilterChange('minRooms', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
                  >
                    <option value="">Indifférent</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2">
                <button
                  onClick={clearFilters}
                  className="text-gray-600 hover:text-gray-800 font-medium"
                >
                  Effacer les filtres
                </button>
                <span className="text-sm text-gray-600">
                  {filteredListings.length} résultat{filteredListings.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="p-4">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h2 className="text-xl font-bold text-dark-gray mb-2">
              Aucun résultat
            </h2>
            <p className="text-gray-600">
              Essaie de modifier tes critères de recherche
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onClick={() => handleListingClick(listing)}
                showLikeButton={true}
                onLike={() => handleLikeListing(listing)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}