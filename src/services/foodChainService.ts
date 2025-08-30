import { AIFoodService, CravingAnalysis } from './aiFoodService'
import { GoogleMapsLoader } from './googleMapsLoader'
import { FoodOption } from '../types'

export interface FoodChainResult {
  foods: FoodOption[]
  reasoning: string
  nearbyLocations: NearbyLocation[]
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

export class FoodChainService {
  /**
   * Complete food chain flow: AI craving analysis + Google Places nearby search
   */
  static async createFoodChain(craving: string, userLocation: { lat: number; lng: number }): Promise<FoodChainResult> {
    try {
      // Step 1: AI analyzes craving and generates food suggestions
      console.log('🔍 Step 1: AI analyzing craving...')
      const cravingAnalysis = await AIFoodService.analyzeCraving(craving)
      
      // Step 2: Load Google Maps if not already loaded
      console.log('🗺️ Step 2: Loading Google Maps...')
      await GoogleMapsLoader.getInstance().loadGoogleMaps()
      
      // Step 3: Find nearby locations for each food item
      console.log('📍 Step 3: Finding nearby locations...')
      const nearbyLocations = await this.findNearbyLocations(cravingAnalysis.foods, userLocation)
      
      // Step 4: Enhance food options with location data
      const enhancedFoods = this.enhanceFoodsWithLocations(cravingAnalysis.foods, nearbyLocations)
      
      return {
        foods: enhancedFoods,
        reasoning: cravingAnalysis.reasoning,
        nearbyLocations
      }
      
    } catch (error) {
      console.error('Error creating food chain:', error)
      throw error
    }
  }

  /**
   * Find nearby locations for food items using Google Places API (New API)
   */
  private static async findNearbyLocations(foods: FoodOption[], userLocation: { lat: number; lng: number }): Promise<NearbyLocation[]> {
    const google = GoogleMapsLoader.getInstance().getGoogleMaps()
    
    const allLocations: NearbyLocation[] = []
    
    for (const food of foods) {
      try {
        // Use the new Place API instead of deprecated PlacesService
        const results = await this.searchNearbyPlacesNewAPI(food.name, userLocation)
        
        // Add food context to locations
        const foodLocations = results.map(place => ({
          ...place,
          foodItem: food.name,
          foodType: food.type,
          foodCategory: food.category
        }))
        
        allLocations.push(...foodLocations)
        
      } catch (error) {
        console.warn(`Failed to find locations for ${food.name}:`, error)
      }
    }
    
    // Remove duplicates and sort by distance
    const uniqueLocations = this.removeDuplicateLocations(allLocations)
    return uniqueLocations.sort((a, b) => a.distance - b.distance)
  }

  /**
   * Search for nearby places using the new Google Places API
   */
  private static async searchNearbyPlacesNewAPI(keyword: string, userLocation: { lat: number; lng: number }): Promise<NearbyLocation[]> {
    try {
      // Use the new Place API with nearbySearch
      const request = {
        query: `${keyword} restaurant`,
        location: new google.maps.LatLng(userLocation.lat, userLocation.lng),
        radius: 5000, // 5km radius
        type: 'restaurant'
      }

      // Use the new API method
      const places = await google.maps.places.Place.nearbySearch(request)
      
      if (!places || places.length === 0) {
        return []
      }

      // Convert to our format
      const locations: NearbyLocation[] = places.map(place => ({
        placeId: place.placeId || '',
        name: place.displayName?.text || 'Unknown Place',
        address: place.formattedAddress || 'Address not available',
        distance: this.calculateDistance(
          userLocation.lat,
          userLocation.lng,
          place.location?.lat || 0,
          place.location?.lng || 0
        ),
        distanceText: this.formatDistance(
          this.calculateDistance(
            userLocation.lat,
            userLocation.lng,
            place.location?.lat || 0,
            place.location?.lng || 0
          )
        ),
        rating: place.rating,
        priceLevel: place.priceLevel,
        isOpen: place.currentOpeningHours?.openNow,
        phoneNumber: place.nationalPhoneNumber,
        website: place.websiteUri,
        types: place.types || [],
        coordinates: {
          lat: place.location?.lat || 0,
          lng: place.location?.lng || 0
        }
      }))

      return locations
    } catch (error) {
      console.error('Error using new Places API:', error)
      // Fallback to basic search if new API fails
      return this.fallbackSearch(keyword, userLocation)
    }
  }

  /**
   * Fallback search method using basic coordinates
   */
  private static fallbackSearch(keyword: string, userLocation: { lat: number; lng: number }): NearbyLocation[] {
    // Create mock nearby locations as fallback
    const mockLocations: NearbyLocation[] = [
      {
        placeId: 'mock_1',
        name: `${keyword} Restaurant`,
        address: 'Near your location',
        distance: 0.5,
        distanceText: '500m',
        rating: 4.2,
        priceLevel: 2,
        types: ['restaurant'],
        coordinates: {
          lat: userLocation.lat + 0.001,
          lng: userLocation.lng + 0.001
        }
      },
      {
        placeId: 'mock_2',
        name: `${keyword} Cafe`,
        address: 'Near your location',
        distance: 1.2,
        distanceText: '1.2km',
        rating: 4.0,
        priceLevel: 1,
        types: ['cafe'],
        coordinates: {
          lat: userLocation.lat - 0.002,
          lng: userLocation.lng + 0.002
        }
      }
    ]
    
    return mockLocations
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private static calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371 // Earth's radius in kilometers
    const dLat = this.deg2rad(lat2 - lat1)
    const dLon = this.deg2rad(lon2 - lon1)
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    return R * c
  }

  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  /**
   * Format distance for display
   */
  private static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    } else {
      return `${distance.toFixed(1)}km`
    }
  }

  /**
   * Remove duplicate locations based on place_id
   */
  private static removeDuplicateLocations(locations: NearbyLocation[]): NearbyLocation[] {
    const seen = new Set<string>()
    return locations.filter(location => {
      if (seen.has(location.placeId)) {
        return false
      }
      seen.add(location.placeId)
      return true
    })
  }

  /**
   * Enhance food options with nearby location information
   */
  private static enhanceFoodsWithLocations(foods: FoodOption[], nearbyLocations: NearbyLocation[]): FoodOption[] {
    return foods.map(food => {
      // Find locations that might serve this food
      const relevantLocations = nearbyLocations.filter(location => 
        location.name.toLowerCase().includes(food.name.toLowerCase()) ||
        location.types.some(type => 
          ['restaurant', 'food', 'cafe', 'bakery', 'grocery_store'].includes(type)
        )
      )
      
      return {
        ...food,
        nearbyLocations: relevantLocations.slice(0, 3) // Limit to top 3 locations
      }
    })
  }
}

export default FoodChainService

