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

export interface NearbySearchRequest {
  location: { lat: number; lng: number }
  radius: number
  keyword: string
  type?: string
}

export class GooglePlacesService {
  private static instance: GooglePlacesService
  private readonly apiKey: string = 'YOUR_GOOGLE_PLACES_API_KEY' // User will need to set this

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
