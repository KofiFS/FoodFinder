import OpenAI from 'openai'

export interface RestaurantMatch {
  restaurantType: string
  searchKeywords: string[]
  confidence: number
  reasoning: string
  typicalFoods: string[]
}

export interface CravingToRestaurantAnalysis {
  primaryMatches: RestaurantMatch[]
  alternativeMatches: RestaurantMatch[]
  searchStrategy: string
  totalConfidence: number
}

export class CravingToRestaurantService {
  private static instance: CravingToRestaurantService
  private openai: OpenAI

  private constructor() {
    this.openai = new OpenAI({
      apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
      dangerouslyAllowBrowser: true
    })
  }

  static getInstance(): CravingToRestaurantService {
    if (!CravingToRestaurantService.instance) {
      CravingToRestaurantService.instance = new CravingToRestaurantService()
    }
    return CravingToRestaurantService.instance
  }

  /**
   * Analyze a user's craving and determine the best restaurant types to search for
   */
  async analyzeCravingForRestaurants(craving: string, userLocation?: string): Promise<CravingToRestaurantAnalysis> {
    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      if (!apiKey) {
        throw new Error('OpenAI API key not found')
      }

      const prompt = `
        I'm craving: "${craving}"
        ${userLocation ? `I'm located in: ${userLocation}` : ''}
        
        As a restaurant expert, analyze this craving and suggest the BEST restaurant types to search for using Google Places API.
        
        For each restaurant type, provide:
        - restaurantType: The specific type of establishment (e.g., "Italian Restaurant", "Fast Food", "Food Truck")
        - searchKeywords: 3-5 search terms that work well with Google Places API (e.g., ["pizza restaurant", "Italian food", "pizzeria"])
        - confidence: 0-100 score for how likely this restaurant type will satisfy the craving
        - reasoning: Why this restaurant type is a good match
        - typicalFoods: 3-5 foods this restaurant type typically serves
        
        Focus on restaurant types that:
        1. Are commonly found and searchable
        2. Have high likelihood of satisfying the craving
        3. Work well with Google Places API search
        
        Return your response as valid JSON:
        {
          "primaryMatches": [/* 2-3 best matches with confidence >80 */],
          "alternativeMatches": [/* 2-3 good alternatives with confidence 60-80 */],
          "searchStrategy": "Brief explanation of the search approach",
          "totalConfidence": 85
        }
        
        Make sure the response is valid JSON. Focus on practical restaurant types that exist in most areas.
      `

      const completion = await this.openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a restaurant expert who helps people find the best restaurant types to satisfy their food cravings. You understand Google Places API capabilities and suggest practical, searchable restaurant types. Always respond with valid JSON."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      const analysis: CravingToRestaurantAnalysis = JSON.parse(response)
      
      // Validate and clean the response
      return this.validateAndCleanAnalysis(analysis)

    } catch (error) {
      console.error('Error analyzing craving for restaurants:', error)
      // Return fallback analysis
      return this.getFallbackAnalysis(craving)
    }
  }

  /**
   * Generate optimized search queries for Google Places API
   */
  generateSearchQueries(analysis: CravingToRestaurantAnalysis): string[] {
    const queries: string[] = []
    
    // Add primary match queries
    analysis.primaryMatches.forEach(match => {
      match.searchKeywords.forEach(keyword => {
        queries.push(keyword)
      })
    })
    
    // Add alternative match queries (fewer to avoid overwhelming results)
    analysis.alternativeMatches.slice(0, 2).forEach(match => {
      match.searchKeywords.slice(0, 2).forEach(keyword => {
        if (!queries.includes(keyword)) {
          queries.push(keyword)
        }
      })
    })
    
    return queries.slice(0, 10) // Limit to 10 queries max
  }

  /**
   * Get restaurant types that are most likely to satisfy the craving
   */
  getTopRestaurantTypes(analysis: CravingToRestaurantAnalysis): string[] {
    return analysis.primaryMatches.map(match => match.restaurantType)
  }

  /**
   * Validate and clean the AI response
   */
  private validateAndCleanAnalysis(analysis: any): CravingToRestaurantAnalysis {
    // Ensure all required fields exist
    const cleaned: CravingToRestaurantAnalysis = {
      primaryMatches: analysis.primaryMatches || [],
      alternativeMatches: analysis.alternativeMatches || [],
      searchStrategy: analysis.searchStrategy || 'Search for restaurants based on craving analysis',
      totalConfidence: analysis.totalConfidence || 75
    }

    // Clean and validate matches
    cleaned.primaryMatches = this.cleanMatches(cleaned.primaryMatches)
    cleaned.alternativeMatches = this.cleanMatches(cleaned.alternativeMatches)

    return cleaned
  }

  /**
   * Clean and validate restaurant matches
   */
  private cleanMatches(matches: any[]): RestaurantMatch[] {
    return matches
      .filter(match => match && typeof match === 'object')
      .map(match => ({
        restaurantType: match.restaurantType || 'Restaurant',
        searchKeywords: Array.isArray(match.searchKeywords) ? match.searchKeywords : [match.restaurantType || 'Restaurant'],
        confidence: Math.max(0, Math.min(100, match.confidence || 50)),
        reasoning: match.reasoning || 'Good match for the craving',
        typicalFoods: Array.isArray(match.typicalFoods) ? match.typicalFoods : []
      }))
      .filter(match => match.confidence > 0)
  }

  /**
   * Fallback analysis when AI fails
   */
  private getFallbackAnalysis(craving: string): CravingToRestaurantAnalysis {
    const cravingLower = craving.toLowerCase()
    
    // Simple keyword-based fallback
    if (cravingLower.includes('pizza') || cravingLower.includes('italian')) {
      return {
        primaryMatches: [
          {
            restaurantType: 'Italian Restaurant',
            searchKeywords: ['Italian restaurant', 'pizzeria', 'Italian food'],
            confidence: 90,
            reasoning: 'Italian restaurants typically serve pizza and pasta dishes',
            typicalFoods: ['Pizza', 'Pasta', 'Calzone', 'Garlic Bread']
          }
        ],
        alternativeMatches: [
          {
            restaurantType: 'Fast Food',
            searchKeywords: ['pizza fast food', 'pizza chain'],
            confidence: 70,
            reasoning: 'Fast food chains often have pizza options',
            typicalFoods: ['Pizza', 'Breadsticks', 'Wings']
          }
        ],
        searchStrategy: 'Search for Italian restaurants and pizza places',
        totalConfidence: 80
      }
    }
    
    if (cravingLower.includes('burger') || cravingLower.includes('hamburger')) {
      return {
        primaryMatches: [
          {
            restaurantType: 'Fast Food',
            searchKeywords: ['burger restaurant', 'fast food', 'hamburger'],
            confidence: 95,
            reasoning: 'Fast food restaurants specialize in burgers',
            typicalFoods: ['Hamburger', 'Cheeseburger', 'French Fries', 'Onion Rings']
          }
        ],
        alternativeMatches: [
          {
            restaurantType: 'American Restaurant',
            searchKeywords: ['American restaurant', 'diner', 'grill'],
            confidence: 80,
            reasoning: 'American restaurants often serve quality burgers',
            typicalFoods: ['Hamburger', 'Steak', 'Chicken', 'Salad']
          }
        ],
        searchStrategy: 'Search for fast food and American restaurants',
        totalConfidence: 85
      }
    }
    
    // Generic fallback
    return {
      primaryMatches: [
        {
          restaurantType: 'Restaurant',
          searchKeywords: [craving, 'restaurant', 'food'],
          confidence: 60,
          reasoning: 'General restaurant search as fallback',
          typicalFoods: ['Various foods']
        }
      ],
      alternativeMatches: [],
      searchStrategy: 'Search for restaurants with the craving as keyword',
      totalConfidence: 60
    }
  }
}

