'use client'

import Image from 'next/image'
import { Listing } from '@/lib/supabase-client'
import { MapPin, Euro, Calendar, Users, Home } from 'lucide-react'

interface ListingCardProps {
  listing: Listing
  onClick?: () => void
  showLikeButton?: boolean
  onLike?: () => void
}

export default function ListingCard({ listing, onClick, showLikeButton = false, onLike }: ListingCardProps) {
  return (
    <div
      className="card overflow-hidden cursor-pointer hover:shadow-xl transition-all duration-200"
      onClick={onClick}
    >
      {/* Main image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={listing.photos[0] || 'https://picsum.photos/400/300?random=default'}
          alt={listing.title}
          fill
          className="object-cover hover:scale-105 transition-transform duration-200"
        />
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-lg font-bold text-primary">{listing.price}€</span>
        </div>
        {listing.property_type && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full">
            <span className="text-xs font-medium text-gray-700">{listing.property_type}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-lg font-bold text-dark-gray mb-2 line-clamp-1">
          {listing.title}
        </h3>

        <div className="space-y-2 mb-3">
          <div className="flex items-center text-gray-600 text-sm">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{listing.location}</span>
          </div>

          <div className="flex items-center text-gray-600 text-sm">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Disponible {listing.available}</span>
          </div>

          {listing.rooms && (
            <div className="flex items-center text-gray-600 text-sm">
              <Home className="w-4 h-4 mr-2" />
              <span>{listing.rooms} pièce{listing.rooms > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>

        <p className="text-gray-700 text-sm mb-4 line-clamp-2">
          {listing.description}
        </p>

        {/* Amenities */}
        <div className="flex flex-wrap gap-2 mb-4">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs"
            >
              {amenity}
            </span>
          ))}
          {listing.amenities.length > 3 && (
            <span className="text-gray-500 text-xs">
              +{listing.amenities.length - 3} autres
            </span>
          )}
        </div>

        {/* Landlord info */}
        {listing.landlord && (
          <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center text-white text-sm font-bold">
              {(listing.landlord.first_name || listing.landlord.name || 'L').charAt(0)}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-dark-gray">
                {listing.landlord.first_name
                  ? `${listing.landlord.first_name} ${listing.landlord.last_name || ''}`.trim()
                  : listing.landlord.name || 'Landlord'
                }
              </p>
              <div className="flex space-x-1">
                {(listing.landlord.hobbies || listing.landlord.interests || [])?.slice(0, 2).map((interest) => (
                  <span key={interest} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full text-gray-600">
                    {interest}
                  </span>
                ))}
              </div>
            </div>
            {showLikeButton && onLike && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onLike()
                }}
                className="bg-primary hover:bg-primary/90 text-white px-3 py-1 rounded-lg text-sm font-medium transition-colors"
              >
                Liker
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}