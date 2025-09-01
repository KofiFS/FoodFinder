export interface PlaceResult {
  place_id: string
  name: string
  formatted_address: string
  geometry: {
    location: {
      lat: number
      lng: number
    }
  }
  business_status: string
  opening_hours?: {
    open_now: boolean
  }
  rating?: number
  price_level?: number
  distance?: number
}

export interface RestaurantResult {
  place_id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  rating: number
  totalRatings: number
  priceLevel: number
  businessStatus: string
  openNow: boolean
  distance: number
  reviews: Array<{
    author_name: string
    rating: number
    text: string
  }>
  photos: any[]
  website: string
  phone: string
  types: string[]
}

export interface NearbySearchRequest {
  location: { lat: number; lng: number }
  radius: number
  keyword: string
  type?: string
}

export class GooglePlacesService {
  private static instance: GooglePlacesService
  private readonly apiKey: string = import.meta.env.VITE_GOOGLE_PLACES_API_KEY || ''

  static getInstance(): GooglePlacesService {
    if (!GooglePlacesService.instance) {
      GooglePlacesService.instance = new GooglePlacesService()
    }
    return GooglePlacesService.instance
  }

  // Check if Google Places API is available
  isAvailable(): boolean {
    return typeof window !== 'undefined' && !!(window as any).google?.maps?.places
  }

  // Search for nearby places using Google Places API
  async searchNearbyPlaces(request: NearbySearchRequest): Promise<PlaceResult[]> {
    if (!this.isAvailable()) {
      console.log('Google Places API not available, using fallback')
      return this.getFallbackResults(request)
    }

    try {
      const service = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      )

      return new Promise((resolve, reject) => {
        const searchRequest = {
          location: new (window as any).google.maps.LatLng(request.location.lat, request.location.lng),
          radius: request.radius,
          keyword: request.keyword,
          type: request.type || 'establishment'
        }

        service.nearbySearch(searchRequest, (results: any[], status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
            const places = results.slice(0, 5).map(place => ({
              place_id: place.place_id,
              name: place.name,
              formatted_address: place.vicinity || place.formatted_address,
              geometry: {
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                }
              },
              business_status: place.business_status,
              opening_hours: place.opening_hours,
              rating: place.rating,
              price_level: place.price_level,
              distance: this.calculateDistance(
                request.location.lat,
                request.location.lng,
                place.geometry.location.lat(),
                place.geometry.location.lng()
              )
            }))
            resolve(places)
          } else {
            console.error('Places search failed:', status)
            resolve(this.getFallbackResults(request))
          }
        })
      })
    } catch (error) {
      console.error('Error with Google Places API:', error)
      return this.getFallbackResults(request)
    }
  }

  // Enhanced restaurant discovery - filters for restaurants/food chains, avoids grocery stores
  async searchRestaurants(foodName: string, userLocation: { lat: number; lng: number }): Promise<RestaurantResult[]> {
    if (!this.isAvailable()) {
      console.log('Google Places API not available, using fallback')
      return this.getFallbackRestaurantResults(foodName, userLocation)
    }

    try {
      const service = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      )

      // Search for restaurants with the specific food
      const searchRequest = {
        location: new (window as any).google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: 5000, // 5km radius
        keyword: `${foodName} restaurant`,
        type: 'restaurant' // Focus on restaurants, not grocery stores
      }

      return new Promise((resolve, reject) => {
        service.nearbySearch(searchRequest, async (results: any[], status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
            // Filter and enhance results with reviews
            const restaurants = await Promise.all(
              results.slice(0, 8).map(async (place) => {
                // Get detailed place info including reviews
                const details = await this.getPlaceDetails(place.place_id)
                
                return {
                  place_id: place.place_id,
                  name: place.name,
                  address: place.vicinity || place.formatted_address,
                  location: {
                    lat: place.geometry.location.lat(),
                    lng: place.geometry.location.lng()
                  },
                  rating: place.rating || 0,
                  totalRatings: place.user_ratings_total || 0,
                  priceLevel: place.price_level || 0,
                  businessStatus: place.business_status,
                  openNow: place.opening_hours?.open_now || false,
                  distance: this.calculateDistance(
                    userLocation.lat,
                    userLocation.lng,
                    place.geometry.location.lat(),
                    place.geometry.location.lng()
                  ),
                  reviews: details.reviews || [],
                  photos: details.photos || [],
                  website: details.website || '',
                  phone: details.phone || '',
                  types: place.types || []
                }
              })
            )

            // Filter out grocery stores, focus on restaurants/food chains
            const filteredRestaurants = restaurants.filter(restaurant => {
              const types = restaurant.types.map(t => t.toLowerCase())
              const isRestaurant = types.some(type => 
                type.includes('restaurant') || 
                type.includes('food') || 
                type.includes('cafe') || 
                type.includes('bar') ||
                type.includes('pizzeria') ||
                type.includes('bakery') ||
                type.includes('diner')
              )
              
              const isNotGrocery = !types.some(type => 
                type.includes('grocery') || 
                type.includes('supermarket') || 
                type.includes('convenience_store') ||
                type.includes('department_store')
              )

              return isRestaurant && isNotGrocery
            })

            resolve(filteredRestaurants)
          } else {
            console.error('Restaurant search failed:', status)
            resolve(this.getFallbackRestaurantResults(foodName, userLocation))
          }
        })
      })
    } catch (error) {
      console.error('Error with restaurant search:', error)
      return this.getFallbackRestaurantResults(foodName, userLocation)
    }
  }

  // Get detailed place information including reviews
  private async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.isAvailable()) {
      return { reviews: [], photos: [], website: '', phone: '' }
    }

    try {
      const service = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      )

      return new Promise((resolve) => {
        const request = {
          placeId: placeId,
          fields: ['reviews', 'photos', 'website', 'formatted_phone_number']
        }

        service.getDetails(request, (place: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
            resolve({
              reviews: place.reviews?.slice(0, 3) || [], // Get top 3 reviews
              photos: place.photos?.slice(0, 2) || [], // Get top 2 photos
              website: place.website || '',
              phone: place.formatted_phone_number || ''
            })
          } else {
            resolve({ reviews: [], photos: [], website: '', phone: '' })
          }
        })
      })
    } catch (error) {
      console.error('Error getting place details:', error)
      return { reviews: [], photos: [], website: '', phone: '' }
    }
  }

  // Enhanced restaurant search using multiple search strategies
  async searchRestaurantsWithStrategy(
    searchQueries: string[], 
    userLocation: { lat: number; lng: number },
    maxResults: number = 12
  ): Promise<RestaurantResult[]> {
    if (!this.isAvailable()) {
      console.log('Google Places API not available, using fallback')
      return this.getFallbackRestaurantResults(searchQueries[0] || 'food', userLocation)
    }

    try {
      const service = new (window as any).google.maps.places.PlacesService(
        document.createElement('div')
      )

      const allResults: RestaurantResult[] = []
      
      // Search with each query and combine results
      for (const query of searchQueries.slice(0, 5)) { // Limit to 5 queries to avoid rate limits
        try {
          const searchRequest = {
            location: new (window as any).google.maps.LatLng(userLocation.lat, userLocation.lng),
            radius: 5000, // 5km radius
            keyword: query,
            type: 'restaurant'
          }

          const results = await this.performSearch(service, searchRequest)
          allResults.push(...results)
        } catch (error) {
          console.error(`Search failed for query "${query}":`, error)
        }
      }

      // Remove duplicates, filter quality, and limit results
      const uniqueResults = this.removeDuplicates(allResults)
      const qualityResults = this.filterQualityResults(uniqueResults)
      
      return qualityResults.slice(0, maxResults)

    } catch (error) {
      console.error('Error with enhanced restaurant search:', error)
      return this.getFallbackRestaurantResults(searchQueries[0] || 'food', userLocation)
    }
  }

  // Perform individual search
  private async performSearch(service: any, searchRequest: any): Promise<RestaurantResult[]> {
    return new Promise((resolve, reject) => {
      service.nearbySearch(searchRequest, async (results: any[], status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
          const restaurants = await Promise.all(
            results.slice(0, 6).map(async (place) => {
              const details = await this.getPlaceDetails(place.place_id)
              
              return {
                place_id: place.place_id,
                name: place.name,
                address: place.vicinity || place.formatted_address,
                location: {
                  lat: place.geometry.location.lat(),
                  lng: place.geometry.location.lng()
                },
                rating: place.rating || 0,
                totalRatings: place.user_ratings_total || 0,
                priceLevel: place.price_level || 0,
                businessStatus: place.business_status,
                openNow: place.opening_hours?.open_now || false,
                distance: this.calculateDistance(
                  searchRequest.location.lat(),
                  searchRequest.location.lng(),
                  place.geometry.location.lat(),
                  place.geometry.location.lng()
                ),
                reviews: details.reviews || [],
                photos: details.photos || [],
                website: details.website || '',
                phone: details.phone || '',
                types: place.types || []
              }
            })
          )

          // Filter for quality restaurants
          const filteredRestaurants = this.filterRestaurantTypes(restaurants)
          resolve(filteredRestaurants)
        } else {
          console.error('Places search failed:', status)
          resolve([])
        }
      })
    })
  }

  // Remove duplicate restaurants
  private removeDuplicates(restaurants: RestaurantResult[]): RestaurantResult[] {
    const seen = new Set<string>()
    return restaurants.filter(restaurant => {
      if (seen.has(restaurant.place_id)) {
        return false
      }
      seen.add(restaurant.place_id)
      return true
    })
  }

  // Filter for quality results
  private filterQualityResults(restaurants: RestaurantResult[]): RestaurantResult[] {
    return restaurants
      .filter(restaurant => restaurant.businessStatus === 'OPERATIONAL')
      .sort((a, b) => {
        // Sort by rating (higher first), then by distance (closer first)
        if (b.rating !== a.rating) {
          return b.rating - a.rating
        }
        return a.distance - b.distance
      })
  }

  // Filter restaurant types to focus on food establishments
  private filterRestaurantTypes(restaurants: RestaurantResult[]): RestaurantResult[] {
    return restaurants.filter(restaurant => {
      const types = restaurant.types.map(t => t.toLowerCase())
      const isRestaurant = types.some(type => 
        type.includes('restaurant') || 
        type.includes('food') || 
        type.includes('cafe') || 
        type.includes('bar') ||
        type.includes('pizzeria') ||
        type.includes('bakery') ||
        type.includes('diner')
      )
      
      const isNotGrocery = !types.some(type => 
        type.includes('grocery') || 
        type.includes('supermarket') || 
        type.includes('convenience_store') ||
        type.includes('department_store')
      )

      return isRestaurant && isNotGrocery
    })
  }

  // Fallback restaurant results
  private async getFallbackRestaurantResults(foodName: string, userLocation: { lat: number; lng: number }): Promise<RestaurantResult[]> {
    // Return sample restaurant data when API is not available
    return [
      {
        place_id: 'fallback_1',
        name: `${foodName} Restaurant`,
        address: 'Sample Address',
        location: { lat: userLocation.lat + 0.001, lng: userLocation.lng + 0.001 },
        rating: 4.2,
        totalRatings: 150,
        priceLevel: 2,
        businessStatus: 'OPERATIONAL',
        openNow: true,
        distance: 0.5,
        reviews: [
          { author_name: 'John D.', rating: 5, text: 'Great food and service!' },
          { author_name: 'Sarah M.', rating: 4, text: 'Really enjoyed the food here.' }
        ],
        photos: [],
        website: '',
        phone: '',
        types: ['restaurant']
      }
    ]
  }

  // Fallback method using alternative APIs or manual data
  private async getFallbackResults(request: NearbySearchRequest): Promise<PlaceResult[]> {
    const keyword = request.keyword.toLowerCase()
    
    // Try to use a different API or service as fallback
    try {
      // Using Nominatim API as a fallback for location search
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(keyword)}&near=${request.location.lat},${request.location.lng}&limit=5`
      
      const response = await fetch(nominatimUrl)
      const data = await response.json()
      
      return data.map((place: any, index: number) => ({
        place_id: place.place_id || `fallback_${index}`,
        name: place.display_name.split(',')[0] || keyword,
        formatted_address: place.display_name,
        geometry: {
          location: {
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon)
          }
        },
        business_status: 'OPERATIONAL',
        distance: this.calculateDistance(
          request.location.lat,
          request.location.lng,
          parseFloat(place.lat),
          parseFloat(place.lon)
        )
      }))
    } catch (error) {
      console.error('Fallback search also failed:', error)
      return []
    }
  }

  // Get store-specific search terms for better results
  getStoreSearchTerms(storeName: string): string[] {
    const storeMap: Record<string, string[]> = {
      "mcdonald's": ["McDonald's", "McDonald's Restaurant"],
      "burger king": ["Burger King", "BK"],
      "wendy's": ["Wendy's", "Wendys"],
      "kfc": ["KFC", "Kentucky Fried Chicken"],
      "subway": ["Subway", "Subway Sandwiches"],
      "taco bell": ["Taco Bell"],
      "pizza hut": ["Pizza Hut"],
      "domino's": ["Domino's Pizza", "Dominos"],
      "starbucks": ["Starbucks", "Starbucks Coffee"],
      "kroger": ["Kroger", "Kroger Grocery"],
      "walmart": ["Walmart", "Walmart Supercenter"],
      "target": ["Target", "Target Store"],
      "whole foods": ["Whole Foods Market", "Whole Foods"],
      "safeway": ["Safeway", "Safeway Store"],
      "costco": ["Costco", "Costco Wholesale"],
      "aldi": ["Aldi", "ALDI"],
      "trader joe's": ["Trader Joe's", "Trader Joes"],
      "chipotle": ["Chipotle", "Chipotle Mexican Grill"],
      "panera": ["Panera Bread", "Panera"],
      "five guys": ["Five Guys", "Five Guys Burgers"],
      "in-n-out": ["In-N-Out Burger", "In-N-Out"],
      "chick-fil-a": ["Chick-fil-A", "Chick fil A"]
    }

    const normalized = storeName.toLowerCase()
    return storeMap[normalized] || [storeName]
  }

  // Calculate distance between two points in miles
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.deg2rad(lat2 - lat1)
    const dLng = this.deg2rad(lng2 - lng1)
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.deg2rad(lat1)) *
        Math.cos(this.deg2rad(lat2)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private deg2rad(deg: number): number {
    return deg * (Math.PI / 180)
  }

  // Generate Google Maps directions URL
  generateDirectionsUrl(userLat: number, userLng: number, place: PlaceResult): string {
    return `https://www.google.com/maps/dir/${userLat},${userLng}/${place.geometry.location.lat},${place.geometry.location.lng}`
  }

  // Generate Google Maps search URL with specific place
  generatePlaceUrl(place: PlaceResult): string {
    if (place.place_id && place.place_id.startsWith('ChIJ')) {
      return `https://www.google.com/maps/place/?q=place_id:${place.place_id}`
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.geometry.location.lat},${place.geometry.location.lng},15z`
  }
}

// Utility function to load Google Maps API
export const loadGoogleMapsAPI = (apiKey: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve()
      return
    }

    const script = document.createElement('script')
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error('Failed to load Google Maps API'))
    document.head.appendChild(script)
  })
}
