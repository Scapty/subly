import { User, Apartment, Like, Match } from '@/types'

// Mock data for demo purposes
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'alice@student.com',
    name: 'Alice Martin',
    avatar: 'https://picsum.photos/200/200?random=1',
    role: 'seeker',
    interests: ['non-fumeur', 'calme', 'étudiant'],
    createdAt: '2024-01-01',
  },
  {
    id: '2',
    email: 'bob@student.com',
    name: 'Bob Dupont',
    avatar: 'https://picsum.photos/200/200?random=2',
    role: 'landlord',
    interests: ['animal ok', 'soirées ok'],
    createdAt: '2024-01-02',
  },
  {
    id: '3',
    email: 'claire@student.com',
    name: 'Claire Rousseau',
    avatar: 'https://picsum.photos/200/200?random=3',
    role: 'seeker',
    interests: ['vegan', 'sport', 'musique'],
    createdAt: '2024-01-03',
  },
]

export const mockApartments: Apartment[] = [
  {
    id: '1',
    title: 'Studio cosy centre-ville',
    photos: [
      'https://picsum.photos/400/300?random=10',
      'https://picsum.photos/400/300?random=11',
    ],
    price: 550,
    location: 'Quartier Latin',
    available: 'Immédiatement',
    description: 'Studio lumineux de 25m² en plein centre-ville, proche des transports.',
    amenities: ['WiFi', 'Cuisine équipée', 'Douche'],
    landlordId: '2',
    landlord: mockUsers[1],
    createdAt: '2024-01-10',
  },
  {
    id: '2',
    title: 'Chambre dans coloc sympa',
    photos: [
      'https://picsum.photos/400/300?random=20',
      'https://picsum.photos/400/300?random=21',
    ],
    price: 400,
    location: 'Belleville',
    available: 'Mars 2024',
    description: 'Chambre dans un T4 avec 3 colocataires étudiants super sympas !',
    amenities: ['Balcon', 'Lave-vaisselle', 'Salon commun'],
    landlordId: '2',
    landlord: mockUsers[1],
    createdAt: '2024-01-11',
  },
  {
    id: '3',
    title: 'T2 avec terrasse',
    photos: [
      'https://picsum.photos/400/300?random=30',
      'https://picsum.photos/400/300?random=31',
    ],
    price: 750,
    location: 'Montmartre',
    available: 'Avril 2024',
    description: 'Magnifique T2 avec terrasse, vue sur Paris, parfait pour couple étudiant.',
    amenities: ['Terrasse', 'Parking', 'Cave'],
    landlordId: '2',
    landlord: mockUsers[1],
    createdAt: '2024-01-12',
  },
]

// Mock authentication state
let currentUser: User | null = null
let currentLikes: Like[] = []
let currentMatches: Match[] = []

export const auth = {
  getCurrentUser: (): User | null => currentUser,

  signUp: async (email: string, password: string, userData: Partial<User>): Promise<User> => {
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      email,
      name: userData.name || 'User',
      avatar: userData.avatar,
      role: userData.role || 'seeker',
      interests: userData.interests || [],
      createdAt: new Date().toISOString(),
    }

    // Add to mock users
    mockUsers.push(newUser)
    currentUser = newUser

    return newUser
  },

  signIn: async (email: string, password: string): Promise<User> => {
    const user = mockUsers.find(u => u.email === email)
    if (!user) {
      throw new Error('User not found')
    }
    currentUser = user
    return user
  },

  signOut: async (): Promise<void> => {
    currentUser = null
  },
}

export const database = {
  getApartments: (): Apartment[] => {
    return mockApartments
  },

  getApartmentsByLandlord: (landlordId: string): Apartment[] => {
    return mockApartments.filter(apt => apt.landlordId === landlordId)
  },

  createApartment: (apartmentData: Omit<Apartment, 'id' | 'createdAt' | 'landlord'>): Apartment => {
    const newApartment: Apartment = {
      ...apartmentData,
      id: Math.random().toString(36).substr(2, 9),
      landlord: currentUser!,
      createdAt: new Date().toISOString(),
    }
    mockApartments.push(newApartment)
    return newApartment
  },

  likeApartment: (userId: string, apartmentId: string): Like => {
    const like: Like = {
      id: Math.random().toString(36).substr(2, 9),
      userId,
      apartmentId,
      createdAt: new Date().toISOString(),
    }
    currentLikes.push(like)
    return like
  },

  getLikesForApartment: (apartmentId: string): Like[] => {
    return currentLikes.filter(like => like.apartmentId === apartmentId)
  },

  getUsersWhoLikedApartment: (apartmentId: string): User[] => {
    const likes = currentLikes.filter(like => like.apartmentId === apartmentId)
    return likes.map(like => mockUsers.find(user => user.id === like.userId)).filter(Boolean) as User[]
  },

  createMatch: (seekerId: string, landlordId: string, apartmentId: string): Match => {
    const apartment = mockApartments.find(apt => apt.id === apartmentId)!
    const seeker = mockUsers.find(user => user.id === seekerId)!
    const landlord = mockUsers.find(user => user.id === landlordId)!

    const match: Match = {
      id: Math.random().toString(36).substr(2, 9),
      seekerId,
      landlordId,
      apartmentId,
      apartment,
      seeker,
      landlord,
      createdAt: new Date().toISOString(),
    }
    currentMatches.push(match)
    return match
  },

  getMatchesForUser: (userId: string): Match[] => {
    return currentMatches.filter(match =>
      match.seekerId === userId || match.landlordId === userId
    )
  },
}