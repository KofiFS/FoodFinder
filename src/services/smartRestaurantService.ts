import { CravingToRestaurantService } from './cravingToRestaurantService'
import { GooglePlacesService, RestaurantResult } from './googlePlacesService'

export interface RestaurantOption {
  id: string
  name: string
  address: string
  rating: number
  priceLevel: number
  distance: number
  openNow: boolean
  confidence: number
  reasoning: string
  place_id: string
  phone?: string
  website?: string
}

export interface SmartRestaurantResult {
  restaurants: RestaurantOption[]
  searchStrategy: string
  totalConfidence: number
  error?: string
}

export class SmartRestaurantService {
  private static instance: SmartRestaurantService
  private cravingService = CravingToRestaurantService.getInstance()
  private placesService = GooglePlacesService.getInstance()

  static getInstance(): SmartRestaurantService {
    if (!SmartRestaurantService.instance) {
      SmartRestaurantService.instance = new SmartRestaurantService()
    }
    return SmartRestaurantService.instance
  }

  /**
   * Find restaurants that satisfy a specific food craving using AI + Google Places API
   */
  async findRestaurantsForCraving(
    foodName: string, 
    userLocation: { lat: number; lng: number }
  ): Promise<SmartRestaurantResult> {
    try {
      // Step 1: Use AI to analyze the craving and get restaurant types
      console.log(`🧠 Analyzing craving for "${foodName}"...`)
      const cravingAnalysis = await this.cravingService.analyzeCravingForRestaurants(foodName)
      
      // Step 2: Generate optimized search queries
      const searchQueries = this.cravingService.generateSearchQueries(cravingAnalysis)
      console.log(`🔍 Generated search queries:`, searchQueries)

      // Step 3: Search for restaurants using Google Places API
      const restaurantResults = await this.placesService.searchRestaurantsWithStrategy(
        searchQueries,
        userLocation,
        8 // Limit to 8 results for widget display
      )

      // Step 4: Convert to RestaurantOption format with confidence scores
      const restaurants: RestaurantOption[] = restaurantResults.map((restaurant, index) => {
        // Calculate confidence based on AI analysis and restaurant data
        const baseConfidence = this.calculateRestaurantConfidence(restaurant, cravingAnalysis)
        
        return {
          id: `smart-${restaurant.place_id}`,
          name: restaurant.name,
          address: restaurant.address,
          rating: restaurant.rating,
          priceLevel: restaurant.priceLevel,
          distance: restaurant.distance,
          openNow: restaurant.openNow,
          confidence: Math.round(baseConfidence),
          reasoning: this.getRestaurantReasoning(restaurant, cravingAnalysis),
          place_id: restaurant.place_id,
          phone: restaurant.phone,
          website: restaurant.website
        }
      })

      // Step 5: Sort by confidence and distance
      restaurants.sort((a, b) => {
        if (Math.abs(a.confidence - b.confidence) > 10) {
          return b.confidence - a.confidence // Higher confidence first
        }
        return a.distance - b.distance // Closer first if similar confidence
      })

      return {
        restaurants: restaurants.slice(0, 6), // Limit to 6 for widget display
        searchStrategy: cravingAnalysis.searchStrategy,
        totalConfidence: cravingAnalysis.totalConfidence,
      }

    } catch (error) {
      console.error('Smart restaurant search error:', error)
      return {
        restaurants: [],
        searchStrategy: 'Fallback search',
        totalConfidence: 0,
        error: 'Failed to find restaurants. Please try again.'
      }
    }
  }

  /**
   * Calculate confidence score for a restaurant based on AI analysis
   */
  private calculateRestaurantConfidence(
    restaurant: RestaurantResult, 
    cravingAnalysis: any
  ): number {
    let confidence = 70 // Base confidence

    // Boost confidence based on rating
    if (restaurant.rating >= 4.5) confidence += 15
    else if (restaurant.rating >= 4.0) confidence += 10
    else if (restaurant.rating >= 3.5) confidence += 5

    // Boost confidence if currently open
    if (restaurant.openNow) confidence += 10

    // Reduce confidence based on distance
    if (restaurant.distance <= 1) confidence += 10
    else if (restaurant.distance <= 3) confidence += 5
    else if (restaurant.distance > 10) confidence -= 10

    // Boost confidence based on number of reviews
    if (restaurant.totalRatings > 100) confidence += 5
    else if (restaurant.totalRatings > 500) confidence += 10

    // Match against AI primary restaurant types
    const restaurantTypes = restaurant.types.map(t => t.toLowerCase())
    const primaryMatches = cravingAnalysis.primaryMatches || []
    
    for (const match of primaryMatches) {
      const matchType = match.restaurantType.toLowerCase()
      if (restaurantTypes.some(type => 
        type.includes(matchType.split(' ')[0]) || 
        matchType.includes(type)
      )) {
        confidence += Math.round(match.confidence * 0.2) // 20% of AI confidence
        break
      }
    }

    return Math.min(100, Math.max(0, confidence))
  }

  /**
   * Generate reasoning text for why this restaurant matches the craving
   */
  private getRestaurantReasoning(
    restaurant: RestaurantResult,
    cravingAnalysis: any
  ): string {
    const reasons = []

    // Distance reasoning
    if (restaurant.distance <= 1) {
      reasons.push('Very close to you')
    } else if (restaurant.distance <= 3) {
      reasons.push('Nearby location')
    }

    // Rating reasoning
    if (restaurant.rating >= 4.5) {
      reasons.push('Excellent ratings')
    } else if (restaurant.rating >= 4.0) {
      reasons.push('Great reviews')
    }

    // Availability reasoning
    if (restaurant.openNow) {
      reasons.push('Currently open')
    }

    // AI match reasoning
    const primaryMatches = cravingAnalysis.primaryMatches || []
    for (const match of primaryMatches) {
      if (match.confidence > 80) {
        reasons.push(`${match.restaurantType.toLowerCase()} that typically serves this food`)
        break
      }
    }

    return reasons.length > 0 
      ? reasons.slice(0, 2).join(', ') 
      : 'Good match for your craving'
  }

  /**
   * Get the top restaurant recommendation
   */
  getTopRecommendation(result: SmartRestaurantResult): RestaurantOption | null {
    return result.restaurants.length > 0 ? result.restaurants[0] : null
  }

  /**
   * Format restaurant for display in widgets
   */
  formatRestaurantForWidget(restaurant: RestaurantOption): string {
    const stars = '⭐'.repeat(Math.floor(restaurant.rating))
    const distance = restaurant.distance < 1 
      ? `${Math.round(restaurant.distance * 1000)}m`
      : `${restaurant.distance.toFixed(1)}km`
    
    return `${restaurant.name} ${stars} (${distance})`
  }
}

