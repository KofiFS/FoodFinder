import { FoodOption, FoodChainResult, NearbyLocation } from '../types'
import { AIRestaurantService } from './aiRestaurantService'
import { GoogleMapsLoader } from './googleMapsLoader'
import { GooglePlacesService } from './googlePlacesService'

export class FoodChainService {
  /**
   * Create a restaurant chain based on user craving and location
   */
  static async createFoodChain(craving: string, userLocation: { lat: number; lng: number }): Promise<FoodChainResult> {
    try {
      // Step 1: AI + Google Places API to get real restaurant data
      console.log('🔍 Step 1: Getting real restaurants from Google Places API...')
      const realRestaurants = await AIRestaurantService.getInstance().getRealRestaurants(craving, userLocation)
      
      // Step 2: Convert real restaurant data to FoodOption format
      console.log('✅ Step 2: Converting real restaurant data...')
      const availableFoods: FoodOption[] = realRestaurants.map(restaurant => ({
        id: restaurant.place_id,
        name: restaurant.name, // Real restaurant name like "Starbucks", "Olive Garden"
        location: restaurant.address, // Real address like "123 Main St, City, State"
        price: this.getPriceFromLevel(restaurant.priceLevel), // Convert price level to approximate price
        priceLevel: restaurant.priceLevel,
        category: this.getCategoryFromPriceLevel(restaurant.priceLevel),
        description: `${restaurant.types.join(', ')} - Rating: ${restaurant.rating}/5`,
        confidence: this.calculateConfidence(restaurant.rating, restaurant.distance, restaurant.totalRatings),
        reasoning: `Real restaurant found via Google Places API`,
        cuisine: this.inferCuisineFromTypes(restaurant.types),
        restaurantType: restaurant.types[0] || 'Restaurant',
        imageUrl: null,
        nutritionInfo: null,
        // Add real restaurant data
        realRestaurantData: {
          place_id: restaurant.place_id,
          address: restaurant.address,
          rating: restaurant.rating,
          totalRatings: restaurant.totalRatings,
          openNow: restaurant.openNow,
          website: restaurant.website,
          phone: restaurant.phone,
          types: restaurant.types
        }
      }))
      
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
        reasoning: `Found ${realRestaurants.length} real restaurants matching your craving via Google Places API`,
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

  /**
   * Convert price level to approximate dollar amount for display
   */
  private static getPriceFromLevel(priceLevel: number): number {
    switch (priceLevel) {
      case 1: return 8.99  // $ - Budget (under $10)
      case 2: return 15.99 // $$ - Mid-Range ($10-20)
      case 3: return 25.99 // $$$ - Premium ($20-30)
      case 4: return 35.99 // $$$$ - Luxury ($30+)
      default: return 15.99
    }
  }

  /**
   * Get category from price level
   */
  private static getCategoryFromPriceLevel(priceLevel: number): 'Budget' | 'Mid-Range' | 'Premium' {
    if (priceLevel <= 1) return 'Budget'
    if (priceLevel <= 2) return 'Mid-Range'
    return 'Premium'
  }

  /**
   * Calculate confidence score based on rating, distance, and popularity
   */
  private static calculateConfidence(rating: number, distance: number, totalRatings: number): number {
    const ratingScore = (rating / 5) * 40 // Rating contributes 40% to confidence
    const distanceScore = Math.max(0, (1 - (distance / 5000)) * 30) // Distance contributes 30%
    const popularityScore = Math.min(30, (totalRatings / 100) * 30) // Popularity contributes 30%
    
    return Math.round(ratingScore + distanceScore + popularityScore)
  }

  /**
   * Infer cuisine type from Google Places types
   */
  private static inferCuisineFromTypes(types: string[]): string {
    const typeMap: { [key: string]: string } = {
      'italian_restaurant': 'Italian',
      'pizza_restaurant': 'Italian',
      'chinese_restaurant': 'Chinese',
      'japanese_restaurant': 'Japanese',
      'mexican_restaurant': 'Mexican',
      'indian_restaurant': 'Indian',
      'thai_restaurant': 'Thai',
      'vietnamese_restaurant': 'Vietnamese',
      'french_restaurant': 'French',
      'greek_restaurant': 'Greek',
      'mediterranean_restaurant': 'Mediterranean',
      'american_restaurant': 'American',
      'fast_food': 'American',
      'cafe': 'Cafe',
      'bakery': 'Bakery',
      'diner': 'American',
      'barbecue_restaurant': 'BBQ',
      'seafood_restaurant': 'Seafood',
      'steakhouse': 'Steakhouse',
      'sushi_restaurant': 'Japanese'
    }

    for (const type of types) {
      if (typeMap[type]) {
        return typeMap[type]
      }
    }

    return 'American' // Default fallback
  }
}

