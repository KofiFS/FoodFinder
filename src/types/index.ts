export interface FoodOption {
  id: string
  name: string
  location: string
  price: number
  priceLevel?: number // Restaurant price level (1-4)
  category: 'Budget' | 'Mid-Range' | 'Premium'
  description?: string
  imageUrl?: string | null
  nutritionInfo?: any | null
  nearbyLocations?: NearbyLocation[]
  confidence?: number // How well it matches the craving
  reasoning?: string // Why this restaurant is recommended
  cuisine?: string // Type of cuisine
  restaurantType?: string // Type of restaurant
  realRestaurantData?: {
    place_id: string
    address: string
    rating: number
    totalRatings: number
    openNow: boolean
    website?: string
    phone?: string
    types: string[]
    reviews?: Array<{ author_name: string; rating: number; text: string }>
  }
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

export interface FoodChainResult {
  foods: FoodOption[]
  reasoning: string
  nearbyLocations: NearbyLocation[]
}
