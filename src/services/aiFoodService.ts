import OpenAI from 'openai'
import { FoodOption } from '../types'

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY || '',
  dangerouslyAllowBrowser: true // Note: In production, this should be server-side
})

export interface CravingAnalysis {
  foods: FoodOption[]
  reasoning: string
}

export class AIFoodService {
  /**
   * Analyze a food craving and generate relevant food suggestions using OpenAI
   */
  static async analyzeCraving(craving: string): Promise<CravingAnalysis> {
    try {
      // Debug: Check if API key is available
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY
      console.log('API Key available:', !!apiKey)
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please add your API key to use AI-powered food recommendations.')
      }

      const prompt = `
        I'm craving: "${craving}"
        
        As a food expert, suggest 8-12 specific FOOD items that would satisfy this craving. 
        Focus on actual food items, not drinks or non-food items.
        
        For each food item, provide:
        - Name of the food
        - Type (Make/Prepared/Premade)
        - Price category (Budget/Mid-Range/Premium)
        - Location/store type where it might be found
        - Price range in USD
        
        Format your response as a JSON array like this:
        [
          {
            "name": "Potato Chips",
            "type": "Premade",
            "category": "Budget",
            "location": "Grocery Store",
            "price": 2.99
          }
        ]
        
        Make sure the response is valid JSON. Include a variety of types and price points.
        IMPORTANT: Only suggest actual food items that match the craving description.
      `

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a food expert who helps people find satisfying FOOD options based on their cravings. Always assume the user is asking about food items, not drinks or other products. Focus on actual edible food that matches their craving description. Always respond with valid JSON arrays."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1000
      })

      const response = completion.choices[0]?.message?.content
      if (!response) {
        throw new Error('No response from AI')
      }

      // Parse the JSON response
      const foodsData = JSON.parse(response)
      
      // Convert to FoodOption format with generated IDs
      const foods: FoodOption[] = foodsData.map((food: any, index: number) => ({
        id: `ai-generated-${Date.now()}-${index}`,
        name: food.name,
        type: food.type,
        category: food.category,
        location: food.location,
        price: food.price,
        description: `AI-suggested option for: ${craving}`,
        imageUrl: null,
        nutritionInfo: null
      }))

      return {
        foods,
        reasoning: `Based on your craving for "${craving}", I've suggested these options that should satisfy your hunger.`
      }

    } catch (error) {
      console.error('Error analyzing craving:', error)
      
      // If OpenAI fails, we can't provide meaningful recommendations
      throw new Error(`I can't think of any recommendations that suit your taste for "${craving}". Please try a different craving.`)
    }
  }


}
