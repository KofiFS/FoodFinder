import OpenAI from 'openai'
import { GooglePlacesService, RestaurantResult } from './googlePlacesService'

export interface RestaurantRecommendation {
  id: string
  name: string
  type: string // e.g., "Fast Food", "Italian Restaurant", "Diner"
  priceLevel: 1 | 2 | 3 | 4 // $, $$, $$$, $$$$
  category: 'Budget' | 'Mid-Range' | 'Premium'
  cuisine: string // e.g., "American", "Italian", "Mexican"
  description: string
  confidence: number // How well it matches the craving
  reasoning: string // Why this restaurant is recommended
  searchKeywords: string[] // Keywords for Google Places API search
}

export interface RealRestaurantData {
  place_id: string
  name: string
  address: string
  location: { lat: number; lng: number }
  rating: number
  totalRatings: number
  priceLevel: number
  openNow: boolean
  distance: number
  website?: string
  phone?: string
  types: string[]
}

export interface RestaurantAnalysis {
  restaurants: RestaurantRecommendation[]
  reasoning: string
  searchStrategy: string
}

export class AIRestaurantService {
  private static instance: AIRestaurantService
  private openai: OpenAI

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    })
  }

  static getInstance(): AIRestaurantService {
    if (!AIRestaurantService.instance) {
      AIRestaurantService.instance = new AIRestaurantService()
    }
    return AIRestaurantService.instance
  }

  /**
   * Analyze a craving and recommend actual restaurants/food places
   */
  async recommendRestaurants(craving: string, userLocation?: string): Promise<RestaurantAnalysis> {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI API key not found')
      }

      const prompt = `
        I'm craving: "${craving}"
        ${userLocation ? `I'm located in: ${userLocation}` : ''}
        
        As a restaurant expert, recommend 8-12 ACTUAL RESTAURANTS and food places that would satisfy this craving.
        
        Focus on recommending:
        - Specific restaurant chains (McDonald's, Pizza Hut, Chipotle, etc.)
        - Types of local establishments (Local Pizza Shop, Family Diner, etc.)
        - Food places that typically serve this type of food
        
        For each restaurant recommendation, provide:
        - name: Restaurant name or type (e.g., "McDonald's" or "Local Pizza Shop")
        - type: Restaurant category (e.g., "Fast Food", "Italian Restaurant", "Mexican Grill")
        - priceLevel: 1-4 scale (1=$ cheap, 2=$$ moderate, 3=$$$ expensive, 4=$$$$ very expensive)
        - category: "Budget", "Mid-Range", or "Premium" based on priceLevel
        - cuisine: Type of food (e.g., "American", "Italian", "Mexican")
        - description: Brief description of what they serve
        - confidence: 0-100 score for how well this restaurant satisfies the craving
        - reasoning: Why this restaurant is good for this craving
        - searchKeywords: 3-4 keywords for finding this restaurant type with Google Places API
        
        Include a mix of:
        - Popular chains that serve this food
        - Local restaurant types that typically have this food
        - Different price levels (Budget, Mid-Range, Premium)
        
        Format as JSON:
        {
          "restaurants": [
            {
              "name": "McDonald's",
              "type": "Fast Food",
              "priceLevel": 1,
              "category": "Budget",
              "cuisine": "American",
              "description": "Fast food chain with burgers, fries, and quick meals",
              "confidence": 85,
              "reasoning": "McDonald's is known for burgers and satisfies burger cravings quickly",
              "searchKeywords": ["McDonald's", "fast food", "burger restaurant"]
            }
          ],
          "reasoning": "These restaurants are recommended because they specialize in the type of food you're craving",
          "searchStrategy": "Search for these restaurant types and chains near your location"
        }
        
        Make sure the response is valid JSON. Focus on restaurants that actually exist and serve the craved food.
      `

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a restaurant expert who recommends specific restaurants and food places based on user cravings. Focus on actual restaurant chains and types of local establishments that serve specific foods. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      const analysis = JSON.parse(response)
      
      // Convert to RestaurantRecommendation format with generated IDs
      const restaurants: RestaurantRecommendation[] = analysis.restaurants.map((restaurant: any, index: number) => ({
        id: `restaurant-${Date.now()}-${index}`,
        name: restaurant.name || 'Restaurant',
        type: restaurant.type || 'Restaurant',
        priceLevel: Math.max(1, Math.min(4, restaurant.priceLevel || 2)),
        category: restaurant.category || this.getPriceLevelCategory(restaurant.priceLevel),
        cuisine: restaurant.cuisine || 'American',
        description: restaurant.description || 'Great food and service',
        confidence: Math.max(0, Math.min(100, restaurant.confidence || 70)),
        reasoning: restaurant.reasoning || 'Good match for your craving',
        searchKeywords: Array.isArray(restaurant.searchKeywords) ? restaurant.searchKeywords : [restaurant.name]
      }))

      return {
        restaurants: restaurants.slice(0, 12), // Limit to 12 restaurants
        reasoning: analysis.reasoning || `Based on your craving for "${craving}", these restaurants should satisfy your hunger.`,
        searchStrategy: analysis.searchStrategy || 'Search for restaurants that serve this type of food'
      }

    } catch (error) {
      console.error('Error getting restaurant recommendations:', error)
      return this.getFallbackRestaurants(craving)
    }
  }

  /**
   * Get category based on price level
   */
  private getPriceLevelCategory(priceLevel: number): 'Budget' | 'Mid-Range' | 'Premium' {
    if (priceLevel <= 1) return 'Budget'
    if (priceLevel <= 2) return 'Mid-Range'
    return 'Premium'
  }

  /**
   * Generate optimized search queries for Google Places API
   */
  generateSearchQueries(analysis: RestaurantAnalysis): string[] {
    const queries: string[] = []
    
    // Add primary match queries
    analysis.restaurants.forEach(restaurant => {
      restaurant.searchKeywords.forEach(keyword => {
        queries.push(keyword)
      })
    })
    
    // Limit to 10 queries max to avoid overwhelming results
    return queries.slice(0, 10)
  }

  /**
   * Get real restaurant data using Google Places API
   */
  async getRealRestaurants(
    craving: string, 
    userLocation: { lat: number; lng: number }
  ): Promise<RealRestaurantData[]> {
    try {
      // First, get AI recommendations for restaurant types
      const analysis = await this.recommendRestaurants(craving)
      
      // Generate search queries from AI recommendations
      const searchQueries = this.generateSearchQueries(analysis)
      
      // Use Google Places API to find real restaurants
      const placesService = GooglePlacesService.getInstance()
      const realRestaurants = await placesService.searchRestaurantsWithStrategy(
        searchQueries,
        userLocation,
        15 // Get more results to filter from
      )

      // Convert to our format and enhance with AI confidence
      const enhancedRestaurants: RealRestaurantData[] = realRestaurants.map(restaurant => {
        // Find matching AI recommendation for confidence scoring
        const matchingAI = analysis.restaurants.find(ai => 
          ai.searchKeywords.some(keyword => 
            restaurant.name.toLowerCase().includes(keyword.toLowerCase()) ||
            restaurant.types.some(type => 
              type.toLowerCase().includes(keyword.toLowerCase())
            )
          )
        )

        return {
          place_id: restaurant.place_id,
          name: restaurant.name,
          address: restaurant.address,
          location: restaurant.location,
          rating: restaurant.rating,
          totalRatings: restaurant.totalRatings,
          priceLevel: restaurant.priceLevel,
          openNow: restaurant.openNow,
          distance: restaurant.distance,
          website: restaurant.website,
          phone: restaurant.phone,
          types: restaurant.types
        }
      })

      // Sort by relevance: higher rating + closer distance + AI confidence
      return enhancedRestaurants.sort((a, b) => {
        const scoreA = (a.rating / 5) * 40 + (1 - (a.distance / 5000)) * 40 + (a.priceLevel <= 2 ? 20 : 0)
        const scoreB = (b.rating / 5) * 40 + (1 - (b.distance / 5000)) * 40 + (b.priceLevel <= 2 ? 20 : 0)
        return scoreB - scoreA
      }).slice(0, 12) // Return top 12

    } catch (error) {
      console.error('Error getting real restaurants:', error)
      return []
    }
  }

  /**
   * Get price level display text
   */
  static getPriceLevelText(priceLevel: number): string {
    switch (priceLevel) {
      case 1: return '$'
      case 2: return '$$'
      case 3: return '$$$'
      case 4: return '$$$$'
      default: return '$$'
    }
  }

  /**
   * Fallback restaurants when AI fails
   */
  private getFallbackRestaurants(craving: string): RestaurantAnalysis {
    const cravingLower = craving.toLowerCase()
    
    if (cravingLower.includes('pizza')) {
      return {
        restaurants: [
          {
            id: 'fallback-pizza-1',
            name: "Pizza Hut",
            type: "Pizza Chain",
            priceLevel: 2,
            category: 'Mid-Range',
            cuisine: "Italian-American",
            description: "Popular pizza chain with variety of pizzas and sides",
            confidence: 90,
            reasoning: "Pizza Hut specializes in pizza and is widely available",
            searchKeywords: ["Pizza Hut", "pizza restaurant", "pizza chain"]
          },
          {
            id: 'fallback-pizza-2',
            name: "Local Pizza Shop",
            type: "Italian Restaurant",
            priceLevel: 2,
            category: 'Mid-Range',
            cuisine: "Italian",
            description: "Local pizzeria with fresh, authentic pizza",
            confidence: 85,
            reasoning: "Local pizza shops often have the best quality pizza",
            searchKeywords: ["pizza restaurant", "pizzeria", "Italian restaurant"]
          }
        ],
        reasoning: "These pizza places should satisfy your pizza craving",
        searchStrategy: "Search for pizza restaurants and Italian places"
      }
    }

    if (cravingLower.includes('burger')) {
      return {
        restaurants: [
          {
            id: 'fallback-burger-1',
            name: "McDonald's",
            type: "Fast Food",
            priceLevel: 1,
            category: 'Budget',
            cuisine: "American",
            description: "Fast food chain famous for burgers and fries",
            confidence: 90,
            reasoning: "McDonald's is the most recognizable burger chain",
            searchKeywords: ["McDonald's", "fast food", "burger restaurant"]
          },
          {
            id: 'fallback-burger-2',
            name: "Local Burger Joint",
            type: "American Restaurant",
            priceLevel: 2,
            category: 'Mid-Range',
            cuisine: "American",
            description: "Local restaurant specializing in gourmet burgers",
            confidence: 80,
            reasoning: "Local burger joints often have better quality burgers",
            searchKeywords: ["burger restaurant", "American restaurant", "grill"]
          }
        ],
        reasoning: "These burger places should satisfy your burger craving",
        searchStrategy: "Search for burger restaurants and American food"
      }
    }

    // Generic fallback
    return {
      restaurants: [
        {
          id: 'fallback-generic-1',
          name: "Local Restaurant",
          type: "Restaurant",
          priceLevel: 2,
          category: 'Mid-Range',
          cuisine: "American",
          description: "Local restaurant with variety of food options",
          confidence: 60,
          reasoning: "Local restaurants often have diverse menu options",
          searchKeywords: ["restaurant", "food", craving]
        }
      ],
      reasoning: `Based on your craving for "${craving}", these restaurants should have options for you`,
      searchStrategy: "Search for restaurants that serve this type of food"
    }
  }
}
