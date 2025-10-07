'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Listing } from '@/lib/supabase-client'
import { MapPin, Euro, Calendar, X, Heart, Eye } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface SwipeCardProps {
  listing: Listing
  onSwipe: (direction: 'left' | 'right') => void
  isTopCard: boolean
}

export default function SwipeCard({ listing, onSwipe, isTopCard }: SwipeCardProps) {
  const router = useRouter()
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [rotation, setRotation] = useState(0)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleStart = (clientX: number, clientY: number) => {
    if (!isTopCard) return
    setIsDragging(true)
    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      setDragOffset({
        x: clientX - rect.left - rect.width / 2,
        y: clientY - rect.top - rect.height / 2,
      })
    }
  }

  const handleMove = (clientX: number, clientY: number) => {
    if (!isDragging || !isTopCard) return

    const rect = cardRef.current?.getBoundingClientRect()
    if (rect) {
      const x = clientX - rect.left - rect.width / 2 - dragOffset.x
      const y = clientY - rect.top - rect.height / 2 - dragOffset.y
      const rotation = x * 0.1

      setDragOffset({ x, y })
      setRotation(rotation)

      if (cardRef.current) {
        cardRef.current.style.transform = `translate(${x}px, ${y}px) rotate(${rotation}deg)`
      }
    }
  }

  const handleEnd = () => {
    if (!isDragging || !isTopCard) return
    setIsDragging(false)

    const threshold = 100
    if (Math.abs(dragOffset.x) > threshold) {
      const direction = dragOffset.x > 0 ? 'right' : 'left'
      onSwipe(direction)
    } else {
      // Snap back
      if (cardRef.current) {
        cardRef.current.style.transform = 'translate(0px, 0px) rotate(0deg)'
      }
      setDragOffset({ x: 0, y: 0 })
      setRotation(0)
    }
  }

  const handleMouseDown = (e: React.MouseEvent) => {
    handleStart(e.clientX, e.clientY)
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    handleMove(e.clientX, e.clientY)
  }

  const handleMouseUp = () => {
    handleEnd()
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleStart(touch.clientX, touch.clientY)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0]
    handleMove(touch.clientX, touch.clientY)
  }

  const handleTouchEnd = () => {
    handleEnd()
  }

  const handleButtonSwipe = (direction: 'left' | 'right') => {
    if (!isTopCard) return
    onSwipe(direction)
  }

  const opacity = isTopCard ? 1 : 0.8
  const scale = isTopCard ? 1 : 0.95
  const zIndex = isTopCard ? 10 : 1

  return (
    <div
      ref={cardRef}
      className="swipe-card select-none"
      style={{
        opacity,
        transform: `scale(${scale})`,
        zIndex,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Like/Nope indicators */}
      {isTopCard && Math.abs(dragOffset.x) > 50 && (
        <div className="absolute top-8 inset-x-0 z-20 flex justify-center">
          {dragOffset.x > 0 ? (
            <div className="bg-green-500 text-white px-6 py-2 rounded-full font-bold text-lg transform rotate-12">
              LIKE
            </div>
          ) : (
            <div className="bg-red-500 text-white px-6 py-2 rounded-full font-bold text-lg transform -rotate-12">
              NOPE
            </div>
          )}
        </div>
      )}

      {/* Main image */}
      <div className="relative h-64 overflow-hidden rounded-t-2xl">
        <Image
          src={listing.photos[0] || 'https://picsum.photos/400/300?random=default'}
          alt={listing.title}
          fill
          className="object-cover"
        />
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-lg font-bold text-primary">{listing.price}€</span>
        </div>
        {/* View details button */}
        {isTopCard && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              router.push(`/listing/${listing.id}`)
            }}
            className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm p-2 rounded-full hover:bg-white transition-colors"
          >
            <Eye className="w-5 h-5 text-gray-700" />
          </button>
        )}
      </div>

      {/* Card content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-dark-gray mb-2">
          {listing.title}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600">
            <MapPin className="w-4 h-4 mr-2" />
            <span>{listing.location}</span>
          </div>

          <div className="flex items-center text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Disponible {listing.available}</span>
          </div>
        </div>

        <p className="text-gray-700 mb-4 line-clamp-3">
          {listing.description}
        </p>

        <div className="flex flex-wrap gap-2 mb-6">
          {listing.amenities.slice(0, 3).map((amenity) => (
            <span
              key={amenity}
              className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
            >
              {amenity}
            </span>
          ))}
          {listing.amenities.length > 3 && (
            <span className="text-gray-500 text-sm">
              +{listing.amenities.length - 3} autres
            </span>
          )}
        </div>

        {/* Action buttons (only show on top card) */}
        {isTopCard && (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleButtonSwipe('left')}
              className="w-14 h-14 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              <X className="w-6 h-6" />
            </button>

            <button
              onClick={() => handleButtonSwipe('right')}
              className="w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center transition-all shadow-lg hover:shadow-xl"
            >
              <Heart className="w-6 h-6" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}