export interface UserLocation {
  lat: number
  lng: number
}

export interface NearbyPlace {
  name: string
  address: string
  distance: number
  distanceText?: string
  placeId: string
  lat: number
  lng: number
  rating?: number
  priceLevel?: number
  isOpen?: boolean
  phoneNumber?: string
  website?: string
  types?: string[]
}

class EnhancedLocationService {
  private static instance: EnhancedLocationService
  private userLocation: UserLocation | null = null

  static getInstance(): EnhancedLocationService {
    if (!EnhancedLocationService.instance) {
      EnhancedLocationService.instance = new EnhancedLocationService()
    }
    return EnhancedLocationService.instance
  }

  async getUserLocation(): Promise<UserLocation> {
    if (this.userLocation) {
      return this.userLocation
    }

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          this.userLocation = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          resolve(this.userLocation)
        },
        (error) => {
          console.error('Geolocation error:', error)
          reject(error)
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Get enhanced search terms for better local business discovery
  private getEnhancedSearchTerms(foodQuery: string): string[] {
    const normalized = foodQuery.toLowerCase()
    const terms: string[] = []

    // Add the original query
    terms.push(foodQuery)

    // Add specific restaurant types based on food
    if (normalized.includes('burger') || normalized.includes('hamburger')) {
      terms.push('burger restaurant', 'hamburger', 'burger joint', 'grill', 'steakhouse', 'diner', 'sports bar')
    }
    
    if (normalized.includes('pizza')) {
      terms.push('pizza restaurant', 'pizzeria', 'italian restaurant', 'pizza place')
    }
    
    if (normalized.includes('taco') || normalized.includes('mexican')) {
      terms.push('mexican restaurant', 'taco shop', 'tex mex', 'taqueria', 'burrito')
    }
    
    if (normalized.includes('sandwich') || normalized.includes('sub')) {
      terms.push('sandwich shop', 'deli', 'sub shop', 'hoagie', 'cafe')
    }
    
    if (normalized.includes('chicken')) {
      terms.push('chicken restaurant', 'fried chicken', 'rotisserie chicken', 'wings')
    }
    
    if (normalized.includes('barbecue') || normalized.includes('bbq')) {
      terms.push('barbecue restaurant', 'bbq', 'smokehouse', 'grill')
    }
    
    if (normalized.includes('chinese') || normalized.includes('asian')) {
      terms.push('chinese restaurant', 'asian restaurant', 'takeout')
    }

    // Always include general terms to catch local places
    terms.push('restaurant', 'family restaurant', 'local restaurant', 'food')

    return [...new Set(terms)] // Remove duplicates
  }

  // Enhanced Google Places search with multiple strategies
  async findNearbyPlaces(foodQuery: string, location: UserLocation): Promise<NearbyPlace[]> {
    console.log(`🔍 Enhanced search for "${foodQuery}" near ${location.lat}, ${location.lng}`)
    
    if (!this.isGooglePlacesAvailable()) {
      console.warn('❌ Google Places API not available - window.google:', typeof window !== 'undefined' ? window.google : 'undefined')
      console.warn('🔄 Using fallback location service')
      return this.getFallbackResults(foodQuery, location)
    }
    
    console.log('✅ Google Places API is available')

    const service = new (window as any).google.maps.places.PlacesService(
      document.createElement('div')
    )

    const searchTerms = this.getEnhancedSearchTerms(foodQuery)
    const allResults: any[] = []
    const maxDistance = 15 // miles
    const searchRadius = 24000 // 24km (about 15 miles)

    // Strategy 1: Search with specific keywords and restaurant type
    for (const term of searchTerms) {
      try {
        const results = await this.performPlacesSearch(service, {
          location: new (window as any).google.maps.LatLng(location.lat, location.lng),
          radius: searchRadius,
          keyword: term,
          type: 'restaurant'
        })
        allResults.push(...results)
      } catch (error) {
        console.warn(`Restaurant search failed for "${term}":`, error)
      }
    }

    // Strategy 2: Search with meal_takeaway type for more local places
    for (const term of searchTerms) {
      try {
        const results = await this.performPlacesSearch(service, {
          location: new (window as any).google.maps.LatLng(location.lat, location.lng),
          radius: searchRadius,
          keyword: term,
          type: 'meal_takeaway'
        })
        allResults.push(...results)
      } catch (error) {
        console.warn(`Takeaway search failed for "${term}":`, error)
      }
    }

    // Strategy 3: Text search for better local business discovery
    for (const term of searchTerms.slice(0, 3)) { // Limit to avoid rate limits
      try {
        const results = await this.performTextSearch(service, {
          query: `${term} near me`,
          location: new (window as any).google.maps.LatLng(location.lat, location.lng),
          radius: searchRadius
        })
        allResults.push(...results)
      } catch (error) {
        console.warn(`Text search failed for "${term}":`, error)
      }
    }

    // Process and filter results
    const processedResults = allResults.map(place => {
      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        place.geometry.location.lat(),
        place.geometry.location.lng()
      )

      return {
        name: place.name,
        address: place.formatted_address || place.vicinity || 'Address not available',
        distance: distance,
        distanceText: distance < 1 ? 
          `${Math.round(distance * 5280)} ft` : 
          `${distance.toFixed(1)} mi`,
        placeId: place.place_id,
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        rating: place.rating,
        priceLevel: place.price_level,
        isOpen: place.opening_hours?.open_now,
        types: place.types
      }
    })

    // Remove duplicates based on place_id
    const uniqueResults = processedResults.filter((place, index, self) => 
      index === self.findIndex(p => p.placeId === place.placeId)
    )

    // Filter by distance and sort
    const filteredResults = uniqueResults
      .filter(place => place.distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)

    console.log(`✅ Found ${filteredResults.length} nearby places`)
    return filteredResults.slice(0, 8) // Return top 8 results
  }

  // Get detailed place information
  async getPlaceDetails(placeId: string): Promise<any> {
    if (!this.isGooglePlacesAvailable()) {
      return null
    }

    const service = new (window as any).google.maps.places.PlacesService(
      document.createElement('div')
    )

    return new Promise((resolve, reject) => {
      service.getDetails(
        {
          placeId: placeId,
          fields: [
            'name', 
            'formatted_address', 
            'geometry', 
            'rating', 
            'price_level', 
            'opening_hours', 
            'formatted_phone_number', 
            'website',
            'reviews'
          ]
        },
        (place: any, status: any) => {
          if (status === (window as any).google.maps.places.PlacesServiceStatus.OK && place) {
            resolve(place)
          } else {
            reject(new Error(`Failed to get place details: ${status}`))
          }
        }
      )
    })
  }

  // Helper method for nearby search
  private performPlacesSearch(service: any, request: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      service.nearbySearch(request, (results: any[], status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
          resolve(results || [])
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([])
        } else {
          reject(new Error(`Places search failed: ${status}`))
        }
      })
    })
  }

  // Helper method for text search
  private performTextSearch(service: any, request: any): Promise<any[]> {
    return new Promise((resolve, reject) => {
      service.textSearch(request, (results: any[], status: any) => {
        if (status === (window as any).google.maps.places.PlacesServiceStatus.OK) {
          resolve(results || [])
        } else if (status === (window as any).google.maps.places.PlacesServiceStatus.ZERO_RESULTS) {
          resolve([])
        } else {
          reject(new Error(`Text search failed: ${status}`))
        }
      })
    })
  }

  private isGooglePlacesAvailable(): boolean {
    return typeof window !== 'undefined' && 
           window.google && 
           window.google.maps && 
           window.google.maps.places
  }

  calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959 // Earth's radius in miles
    const dLat = this.toRadians(lat2 - lat1)
    const dLng = this.toRadians(lng2 - lng1)
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLng / 2) * Math.sin(dLng / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180)
  }

  // Real location search using OpenStreetMap when Google Places API is not available
  private async getFallbackResults(foodQuery: string, location: UserLocation): Promise<NearbyPlace[]> {
    console.log(`🔄 Using real location APIs for "${foodQuery}"`)
    
    try {
      // Try multiple approaches for better results
      let allResults: NearbyPlace[] = []
      
      // Approach 1: Overpass API for comprehensive OpenStreetMap data
      try {
        const overpassResults = await this.searchWithOverpassAPI(foodQuery, location)
        allResults.push(...overpassResults)
        console.log(`✅ Overpass API found ${overpassResults.length} results`)
      } catch (error) {
        console.error('Overpass API failed:', error)
      }
      
      // Approach 2: Enhanced Nominatim search if we need more results
      if (allResults.length < 3) {
        try {
          const nominatimResults = await this.searchWithNominatim(foodQuery, location)
          allResults.push(...nominatimResults)
          console.log(`✅ Nominatim found ${nominatimResults.length} additional results`)
        } catch (error) {
          console.error('Nominatim API failed:', error)
        }
      }
      
      // Remove duplicates and sort by distance
      const uniqueResults = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.name === place.name && Math.abs(p.distance - place.distance) < 0.1)
      )
      
      const sortedResults = uniqueResults
        .filter(place => place.distance <= 15) // Max 15 miles
        .sort((a, b) => a.distance - b.distance)
      
      console.log(`🎯 Returning ${sortedResults.length} real nearby places`)
      return sortedResults.slice(0, 5) // Return top 5
      
    } catch (error) {
      console.error('All fallback location APIs failed:', error)
      return []
    }
  }

  // Search using Overpass API for OpenStreetMap data
  private async searchWithOverpassAPI(searchQuery: string, location: UserLocation): Promise<NearbyPlace[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    const radius = 15000 // 15km radius
    
    // Create comprehensive Overpass query
    const query = `
      [out:json][timeout:15];
      (
        node["amenity"="restaurant"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        node["amenity"="fast_food"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        node["shop"="supermarket"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        node["shop"="convenience"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        way["amenity"="restaurant"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        way["amenity"="fast_food"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        way["shop"="supermarket"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        relation["amenity"="restaurant"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        relation["amenity"="fast_food"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
      );
      out center;
    `
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    })
    
    if (!response.ok) {
      throw new Error(`Overpass API error: ${response.status}`)
    }
    
    const data = await response.json()
    
    return data.elements.map((element: any) => {
      const lat = element.lat || element.center?.lat || 0
      const lng = element.lon || element.center?.lon || 0
      const distance = this.calculateDistance(location.lat, location.lng, lat, lng)
      
      return {
        name: element.tags?.name || searchQuery,
        address: this.formatAddress(element.tags) || 'Address not available',
        distance: distance,
        distanceText: distance < 1 ? 
          `${Math.round(distance * 5280)} ft` : 
          `${distance.toFixed(1)} mi`,
        placeId: `overpass_${element.id}`,
        lat,
        lng,
        rating: undefined,
        priceLevel: undefined,
        isOpen: undefined
      }
    }).filter((place: NearbyPlace) => place.lat !== 0 && place.lng !== 0)
  }

  // Search using Nominatim API
  private async searchWithNominatim(searchQuery: string, location: UserLocation): Promise<NearbyPlace[]> {
    const searchTerms = [
      `${searchQuery}`,
      `${searchQuery} restaurant`,
      `${searchQuery} store`,
      searchQuery.replace(/['\s]/g, '') // Remove spaces and apostrophes
    ]
    
    const allResults: NearbyPlace[] = []
    const radius = 0.2 // Approximately 15 miles in degrees
    
    for (const term of searchTerms) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
          `format=json&` +
          `q=${encodeURIComponent(term)}&` +
          `viewbox=${location.lng - radius},${location.lat + radius},${location.lng + radius},${location.lat - radius}&` +
          `bounded=1&` +
          `limit=10&` +
          `addressdetails=1`
        
        const response = await fetch(nominatimUrl, {
          headers: {
            'User-Agent': 'FoodSpiderWeb/1.0'
          }
        })
        
        if (!response.ok) continue
        
        const data = await response.json()
        
        const places = data.map((place: any) => {
          const lat = parseFloat(place.lat)
          const lng = parseFloat(place.lon)
          const distance = this.calculateDistance(location.lat, location.lng, lat, lng)
          
          return {
            name: place.display_name.split(',')[0] || term,
            address: place.display_name,
            distance: distance,
            distanceText: distance < 1 ? 
              `${Math.round(distance * 5280)} ft` : 
              `${distance.toFixed(1)} mi`,
            placeId: `nominatim_${place.place_id}`,
            lat,
            lng,
            rating: undefined,
            priceLevel: undefined,
            isOpen: undefined
          }
        }).filter((place: NearbyPlace) => place.distance <= 15) // Within 15 miles
        
        allResults.push(...places)
        
        // Add small delay to respect rate limits
        await new Promise(resolve => setTimeout(resolve, 100))
        
      } catch (error) {
        console.warn(`Nominatim search failed for "${term}":`, error)
      }
    }
    
    return allResults
  }

  // Helper to format address from OpenStreetMap tags
  private formatAddress(tags: any): string {
    if (!tags) return 'Address not available'
    
    const parts = []
    if (tags['addr:housenumber']) parts.push(tags['addr:housenumber'])
    if (tags['addr:street']) parts.push(tags['addr:street'])
    if (tags['addr:city']) parts.push(tags['addr:city'])
    if (tags['addr:state']) parts.push(tags['addr:state'])
    
    return parts.length > 0 ? parts.join(' ') : 'Address not available'
  }

  // Generate accurate Google Maps directions URL
  generateDirectionsUrl(place: NearbyPlace, userLocation: UserLocation): string {
    if (place.placeId && place.placeId.startsWith('ChIJ')) {
      return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/place_id:${place.placeId}`
    }
    return `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${place.lat},${place.lng}`
  }

  // Generate place info URL
  generatePlaceUrl(place: NearbyPlace): string {
    if (place.placeId && place.placeId.startsWith('ChIJ')) {
      return `https://www.google.com/maps/place/?q=place_id:${place.placeId}`
    }
    return `https://www.google.com/maps/search/${encodeURIComponent(place.name)}/@${place.lat},${place.lng},15z`
  }
}

export default EnhancedLocationService
