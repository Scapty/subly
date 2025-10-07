'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { Upload, X, Plus } from 'lucide-react'

interface ImageUploadProps {
  images: File[]
  onImagesChange: (images: File[]) => void
  maxImages?: number
}

export default function ImageUpload({ images, onImagesChange, maxImages = 5 }: ImageUploadProps) {
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = (files: FileList | null) => {
    if (!files) return

    const newFiles = Array.from(files).filter(file => {
      return file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024 // 5MB max
    })

    const totalImages = images.length + newFiles.length
    if (totalImages > maxImages) {
      alert(`Maximum ${maxImages} images autorisées`)
      return
    }

    onImagesChange([...images, ...newFiles])
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index)
    onImagesChange(newImages)
  }

  const openFileDialog = () => {
    fileInputRef.current?.click()
  }

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div
        className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
          dragOver
            ? 'border-primary bg-primary/5'
            : 'border-gray-300 hover:border-primary'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />

        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-700 mb-2">
          Ajouter des photos
        </h3>
        <p className="text-gray-500 text-sm">
          Glissez-déposez vos images ici ou cliquez pour sélectionner
          <br />
          (Maximum {maxImages} photos, 5MB par image)
        </p>
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <div className="aspect-square rounded-xl overflow-hidden bg-gray-100">
                <Image
                  src={URL.createObjectURL(image)}
                  alt={`Upload ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeImage(index)
                }}
                className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  Photo principale
                </div>
              )}
            </div>
          ))}

          {/* Add more button */}
          {images.length < maxImages && (
            <button
              onClick={openFileDialog}
              className="aspect-square rounded-xl border-2 border-dashed border-gray-300 hover:border-primary flex items-center justify-center text-gray-400 hover:text-primary transition-colors"
            >
              <Plus className="w-8 h-8" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}