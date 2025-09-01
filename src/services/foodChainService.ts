import { FoodOption, FoodChainResult, NearbyLocation } from '../types'
import { AIFoodService } from './aiFoodService'
import { GoogleMapsLoader } from './googleMapsLoader'
import { GooglePlacesService } from './googlePlacesService'

export class FoodChainService {
  /**
   * Create a food chain based on user craving and location
   */
  static async createFoodChain(craving: string, userLocation: { lat: number; lng: number }): Promise<FoodChainResult> {
    try {
      // Step 1: AI analyzes craving and generates food suggestions
      console.log('🔍 Step 1: AI analyzing craving...')
      const cravingAnalysis = await AIFoodService.analyzeCraving(craving)
      
      // Step 2: Use all AI-generated food suggestions (no pre-validation needed)
      console.log('✅ Step 2: Using AI food suggestions...')
      const availableFoods = cravingAnalysis.foods
      
      // Step 3: Load Google Maps if not already loaded
      console.log('🗺️ Step 3: Loading Google Maps...')
      await GoogleMapsLoader.getInstance().loadGoogleMaps()
      
      // Step 4: Find nearby locations for available food items
      console.log('📍 Step 4: Finding nearby locations...')
      const nearbyLocations = await this.findNearbyLocations(availableFoods, userLocation)
      
      // Step 5: Enhance food options with location data
      const enhancedFoods = this.enhanceFoodsWithLocations(availableFoods, nearbyLocations)
      
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
   * Find nearby locations for food items using Google Places API
   */
  private static async findNearbyLocations(foods: FoodOption[], userLocation: { lat: number; lng: number }): Promise<NearbyLocation[]> {
    const placesService = GooglePlacesService.getInstance()
    const allLocations: NearbyLocation[] = []
    
    for (const food of foods) {
      try {
        // Use the new restaurant search method
        const restaurants = await placesService.searchRestaurants(food.name, userLocation)
        
        // Convert restaurant results to nearby locations
        const foodLocations = restaurants.map(restaurant => ({
          placeId: restaurant.place_id,
          name: restaurant.name,
          address: restaurant.address,
          distance: restaurant.distance,
          distanceText: this.formatDistance(restaurant.distance),
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          isOpen: restaurant.openNow,
          phoneNumber: restaurant.phone,
          website: restaurant.website,
          types: restaurant.types,
          coordinates: {
            lat: restaurant.location.lat,
            lng: restaurant.location.lng
          }
        }))
        
        allLocations.push(...foodLocations)
        
      } catch (error) {
        console.warn(`Failed to find locations for ${food.name}:`, error)
        // Add fallback location
        allLocations.push({
          placeId: `fallback_${food.name}`,
          name: `${food.name} Restaurant`,
          address: 'Near your location',
          distance: 1.0,
          distanceText: '1km',
          rating: 4.0,
          priceLevel: 2,
          isOpen: true,
          types: ['restaurant'],
          coordinates: {
            lat: userLocation.lat + 0.001,
            lng: userLocation.lng + 0.001
          }
        })
      }
    }
    
    // Remove duplicates and sort by distance
    const uniqueLocations = this.removeDuplicateLocations(allLocations)
    return uniqueLocations.sort((a, b) => a.distance - b.distance)
  }

  /**
   * Enhance food options with location data
   */
  private static enhanceFoodsWithLocations(foods: FoodOption[], nearbyLocations: NearbyLocation[]): FoodOption[] {
    return foods.map(food => {
      // Find locations for this specific food
      const foodLocations = nearbyLocations.filter(location => 
        location.name.toLowerCase().includes(food.name.toLowerCase()) ||
        food.name.toLowerCase().includes(location.name.toLowerCase())
      )
      
      return {
        ...food,
        nearbyLocations: foodLocations.length > 0 ? foodLocations : [nearbyLocations[0]] // Use first available location as fallback
      }
    })
  }

  /**
   * Remove duplicate locations based on place ID
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

  /**
   * Convert degrees to radians
   */
  private static deg2rad(deg: number): number {
    return deg * (Math.PI/180)
  }

  /**
   * Format distance for display
   */
  private static formatDistance(distance: number): string {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }
}

