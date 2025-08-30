export interface FoodOption {
  id: string
  name: string
  location: string
  price: number
  type: 'Make' | 'Premade' | 'Prepared'
  category: 'Budget' | 'Mid-Range' | 'Premium'
  description?: string
  imageUrl?: string | null
  nutritionInfo?: any | null
  nearbyLocations?: NearbyLocation[]
}

export interface NearbyLocation {
  placeId: string
  name: string
  address: string
  distance: number
  distanceText: string
  rating?: number
  priceLevel?: number
  isOpen?: boolean
  phoneNumber?: string
  website?: string
  types: string[]
  coordinates: {
    lat: number
    lng: number
  }
}

export interface Position {
  x: number
  y: number
}

export interface WebNode {
  id: string
  position: Position
  foodOption?: FoodOption
  isCenter?: boolean
}
