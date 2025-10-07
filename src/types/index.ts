export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  role: 'seeker' | 'landlord'
  interests: string[]
  createdAt: string
}

export interface Apartment {
  id: string
  title: string
  photos: string[]
  price: number
  location: string
  available: string
  description: string
  amenities: string[]
  landlordId: string
  landlord: User
  createdAt: string
}

export interface Like {
  id: string
  userId: string
  apartmentId: string
  createdAt: string
}

export interface Match {
  id: string
  seekerId: string
  landlordId: string
  apartmentId: string
  apartment: Apartment
  seeker: User
  landlord: User
  createdAt: string
}