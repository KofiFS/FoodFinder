export interface UserLocation {
  lat: number
  lng: number
}

export interface NearbyPlace {
  name: string
  address: string
  distance: number
  placeId: string
  lat: number
  lng: number
  rating?: number
  priceLevel?: number
  isOpen?: boolean
}

export class LocationService {
  private static instance: LocationService
  private userLocation: UserLocation | null = null

  static getInstance(): LocationService {
    if (!LocationService.instance) {
      LocationService.instance = new LocationService()
    }
    return LocationService.instance
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
          // Fallback to default location (center of US)
          this.userLocation = { lat: 39.8283, lng: -98.5795 }
          resolve(this.userLocation)
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  async findNearbyPlaces(
    searchQuery: string,
    location: UserLocation,
    radius: number = 25000 // 25km default (reduced for more accurate results)
  ): Promise<NearbyPlace[]> {
    try {
      // Try multiple search approaches for better results
      let allResults: NearbyPlace[] = []
      
      // Approach 1: Try Google Places API if available
      try {
        const { GooglePlacesService } = await import('./googlePlacesService')
        const placesService = GooglePlacesService.getInstance()
        
        if (placesService.isAvailable()) {
          const searchTerms = placesService.getStoreSearchTerms(searchQuery)
          
          for (const term of searchTerms) {
            try {
              const places = await placesService.searchNearbyPlaces({
                location,
                radius,
                keyword: term,
                type: searchQuery.toLowerCase().includes('grocery') || 
                      searchQuery.toLowerCase().includes('kroger') || 
                      searchQuery.toLowerCase().includes('walmart') ? 'grocery_or_supermarket' : 'restaurant'
              })
              
              const nearbyPlaces = places.map(place => ({
                name: place.name,
                address: place.formatted_address,
                distance: place.distance || 0,
                placeId: place.place_id,
                lat: place.geometry.location.lat,
                lng: place.geometry.location.lng,
                rating: place.rating,
                priceLevel: place.price_level,
                isOpen: place.opening_hours?.open_now
              }))
              
              allResults.push(...nearbyPlaces)
            } catch (error) {
              console.error(`Error searching for ${term}:`, error)
            }
          }
        }
      } catch (error) {
        console.log('Google Places API not available, using fallback methods')
      }
      
      // Approach 2: If no Google results, try improved fallback searches
      if (allResults.length === 0) {
        // Try Overpass API for more comprehensive OpenStreetMap data
        try {
          const overpassResults = await this.searchWithOverpassAPI(searchQuery, location, radius)
          allResults.push(...overpassResults)
        } catch (error) {
          console.error('Overpass API failed:', error)
        }
        
        // Try Nominatim with better search terms
        if (allResults.length === 0) {
          try {
            const nominatimResults = await this.searchWithImprovedNominatim(searchQuery, location, radius)
            allResults.push(...nominatimResults)
          } catch (error) {
            console.error('Improved Nominatim failed:', error)
          }
        }
      }
      
      // Remove duplicates and sort by distance
      const uniquePlaces = allResults.filter((place, index, self) => 
        index === self.findIndex(p => p.placeId === place.placeId || p.name === place.name)
      )
      
      const sortedPlaces = uniquePlaces.sort((a, b) => a.distance - b.distance)
      
      // If still no results, try one more fallback with relaxed search
      if (sortedPlaces.length === 0) {
        console.log(`No ${searchQuery} locations found, trying broader search...`)
        try {
          const broadResults = await this.broadSearchFallback(searchQuery, location)
          return broadResults
        } catch (error) {
          console.error('All search methods failed:', error)
          return []
        }
      }
      
      return sortedPlaces.slice(0, 3)
    } catch (error) {
      console.error('Error finding nearby places:', error)
      return []
    }
  }

  // Improved Overpass API search for OpenStreetMap data
  private async searchWithOverpassAPI(searchQuery: string, location: UserLocation, radius: number): Promise<NearbyPlace[]> {
    const overpassUrl = 'https://overpass-api.de/api/interpreter'
    
    // Create Overpass query for restaurants/fast food
    const query = `
      [out:json][timeout:10];
      (
        node["amenity"="restaurant"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        node["amenity"="fast_food"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        way["amenity"="restaurant"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
        way["amenity"="fast_food"]["name"~"${searchQuery}",i](around:${radius},${location.lat},${location.lng});
      );
      out center;
    `
    
    const response = await fetch(overpassUrl, {
      method: 'POST',
      body: query,
      headers: { 'Content-Type': 'text/plain' }
    })
    
    const data = await response.json()
    
    return data.elements.map((element: any) => {
      const lat = element.lat || element.center?.lat || 0
      const lng = element.lon || element.center?.lon || 0
      
      return {
        name: element.tags?.name || searchQuery,
        address: `${element.tags?.['addr:street'] || ''} ${element.tags?.['addr:city'] || ''}`.trim() || 'Address not available',
        distance: this.calculateDistance(location.lat, location.lng, lat, lng),
        placeId: `overpass_${element.id}`,
        lat,
        lng,
        rating: undefined,
        priceLevel: undefined,
        isOpen: undefined
      }
    }).filter((place: NearbyPlace) => place.lat !== 0 && place.lng !== 0)
  }

  // Improved Nominatim search with better parameters
  private async searchWithImprovedNominatim(searchQuery: string, location: UserLocation, radius: number): Promise<NearbyPlace[]> {
    const searchTerms = [
      searchQuery,
      `${searchQuery} restaurant`,
      `${searchQuery} fast food`,
      searchQuery.replace(/['\s]/g, '')  // Remove spaces and apostrophes
    ]
    
    const allResults: NearbyPlace[] = []
    
    for (const term of searchTerms) {
      try {
        const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
          `format=json&q=${encodeURIComponent(term)}&` +
          `lat=${location.lat}&lon=${location.lng}&` +
          `bounded=1&viewbox=${location.lng-0.5},${location.lat+0.5},${location.lng+0.5},${location.lat-0.5}&` +
          `limit=10&addressdetails=1&extratags=1`
        
        const response = await fetch(nominatimUrl, {
          headers: { 'User-Agent': 'FoodSpiderWeb/1.0' }
        })
        const data = await response.json()
        
        const results = data
          .filter((place: any) => place.class === 'amenity' && ['restaurant', 'fast_food', 'cafe'].includes(place.type))
          .map((place: any) => ({
            name: place.display_name.split(',')[0] || term,
            address: place.display_name,
            distance: this.calculateDistance(location.lat, location.lng, parseFloat(place.lat), parseFloat(place.lon)),
            placeId: place.place_id || `nominatim_${place.osm_id}`,
            lat: parseFloat(place.lat),
            lng: parseFloat(place.lon),
            rating: undefined,
            priceLevel: undefined,
            isOpen: undefined
          }))
          .filter((place: NearbyPlace) => place.distance <= radius / 1000) // Convert radius to km
        
        allResults.push(...results)
      } catch (error) {
        console.error(`Nominatim search failed for ${term}:`, error)
      }
    }
    
    return allResults
  }

  // Broad fallback search when all else fails
  private async broadSearchFallback(searchQuery: string, location: UserLocation): Promise<NearbyPlace[]> {
    try {
      // Try a very broad search with just the brand name
      const broadTerm = searchQuery.split(' ')[0] // Just use first word (e.g., "Burger" from "Burger King")
      
      const nominatimUrl = `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(broadTerm)} restaurant&` +
        `lat=${location.lat}&lon=${location.lng}&` +
        `bounded=1&viewbox=${location.lng-1},${location.lat+1},${location.lng+1},${location.lat-1}&` +
        `limit=5&addressdetails=1`
      
      const response = await fetch(nominatimUrl, {
        headers: { 'User-Agent': 'FoodSpiderWeb/1.0' }
      })
      const data = await response.json()
      
      return data.map((place: any) => ({
        name: place.display_name.split(',')[0] || searchQuery,
        address: place.display_name,
        distance: this.calculateDistance(location.lat, location.lng, parseFloat(place.lat), parseFloat(place.lon)),
        placeId: place.place_id || `broad_${place.osm_id}`,
        lat: parseFloat(place.lat),
        lng: parseFloat(place.lon),
        rating: undefined,
        priceLevel: undefined,
        isOpen: undefined
      })).filter((place: NearbyPlace) => place.distance <= 50) // Within 50km
    } catch (error) {
      console.error('Broad fallback search failed:', error)
      return []
    }
  }

  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
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

  generateDirectionsUrl(
    fromLat: number,
    fromLng: number,
    toLat: number,
    toLng: number
  ): string {
    return `https://www.google.com/maps/dir/${fromLat},${fromLng}/${toLat},${toLng}`
  }

  generatePlaceSearchUrl(placeName: string, location?: UserLocation): string {
    const baseUrl = 'https://www.google.com/maps/search/'
    const query = encodeURIComponent(placeName)
    
    if (location) {
      return `${baseUrl}${query}/@${location.lat},${location.lng},15z`
    }
    
    return `${baseUrl}${query}`
  }
}

// Food information service
export class FoodInfoService {
  static getFoodInfoUrl(foodName: string, storeName: string): string {
    const store = storeName.toLowerCase()
    const food = foodName.toLowerCase().replace(/\s+/g, '-')

    // Direct links to official nutrition pages
    const storeUrls: Record<string, string> = {
      "mcdonald's": `https://www.mcdonalds.com/us/en-us/product/${food}.html`,
      "burger king": `https://www.bk.com/menu/${food}`,
      "wendy's": `https://www.wendys.com/menu/${food}`,
      "in-n-out": `https://www.in-n-out.com/menu`,
      "chick-fil-a": `https://www.chick-fil-a.com/menu/${food}`,
      "five guys": `https://www.fiveguys.com/menu`,
      "subway": `https://www.subway.com/menu`,
      "taco bell": `https://www.tacobell.com/food/${food}`,
      "kfc": `https://www.kfc.com/menu/${food}`,
      "popeyes": `https://www.popeyes.com/menu/${food}`,
      "chipotle": `https://www.chipotle.com/nutrition-calculator`,
      "panera": `https://www.panerabread.com/en-us/menu/${food}.html`,
      "starbucks": `https://www.starbucks.com/menu/${food}`,
      "dunkin": `https://www.dunkindonuts.com/en/menu/${food}`
    }

    // Check if we have a direct link for this store
    if (storeUrls[store]) {
      return storeUrls[store]
    }

    // For grocery stores, search for nutrition information
    const groceryStores = ['kroger', 'walmart', 'target', 'whole foods', 'safeway', 'aldi', 'costco']
    if (groceryStores.some(grocery => store.includes(grocery))) {
      const nutritionQuery = encodeURIComponent(`${foodName} nutrition facts ingredients calories`)
      return `https://www.google.com/search?q=${nutritionQuery}`
    }

    // Default to comprehensive food information search
    const infoQuery = encodeURIComponent(`${foodName} ${storeName} nutrition ingredients calories review`)
    return `https://www.google.com/search?q=${infoQuery}`
  }

  static getHealthScore(foodName: string, type: string): {
    score: number
    category: 'Healthy' | 'Moderate' | 'Indulgent'
    reason: string
  } {
    const name = foodName.toLowerCase()
    
    // Health scoring logic based on food type and name
    let score = 50 // Base score out of 100
    
    // Type-based scoring
    if (type === 'Make') {
      score += 20 // Home cooking is generally healthier
    } else if (type === 'Premade') {
      score += 10 // Store-bought can be controlled
    }
    
    // Ingredient-based scoring
    if (name.includes('salad') || name.includes('veggie') || name.includes('turkey')) {
      score += 25
    } else if (name.includes('fried') || name.includes('bacon') || name.includes('double')) {
      score -= 20
    } else if (name.includes('grilled') || name.includes('lean')) {
      score += 15
    }
    
    // Determine category and reason
    let category: 'Healthy' | 'Moderate' | 'Indulgent'
    let reason: string
    
    if (score >= 70) {
      category = 'Healthy'
      reason = 'High in nutrients, lower in processed ingredients'
    } else if (score >= 40) {
      category = 'Moderate'
      reason = 'Balanced option with some nutritional benefits'
    } else {
      category = 'Indulgent'
      reason = 'High in calories, best enjoyed occasionally'
    }
    
    return { score: Math.max(0, Math.min(100, score)), category, reason }
  }
}
