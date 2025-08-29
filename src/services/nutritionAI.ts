export interface NutritionFacts {
  calories: number
  protein: number // grams
  carbs: number // grams
  fat: number // grams
  fiber: number // grams
  sugar: number // grams
  sodium: number // mg
  saturatedFat: number // grams
  transFat: number // grams
  cholesterol: number // mg
  servingSize: string
  ingredients: string[]
  allergens: string[]
  healthScore: number // 0-100
  healthCategory: 'Healthy' | 'Moderate' | 'Indulgent'
  nutritionTips: string[]
}

export class NutritionAI {
  private static nutritionDatabase: Record<string, Partial<NutritionFacts>> = {
    // Burgers
    'big mac': {
      calories: 563,
      protein: 25,
      carbs: 45,
      fat: 33,
      fiber: 3,
      sugar: 9,
      sodium: 1010,
      saturatedFat: 11,
      transFat: 1,
      cholesterol: 85,
      servingSize: '1 burger (230g)',
      ingredients: ['Beef patty', 'Sesame seed bun', 'Lettuce', 'Cheese', 'Pickles', 'Onions', 'Big Mac sauce'],
      allergens: ['Wheat', 'Milk', 'Egg', 'Soy', 'Sesame'],
      healthScore: 35,
      healthCategory: 'Indulgent',
      nutritionTips: ['High in sodium - limit frequency', 'Contains trans fat', 'Good protein source']
    },
    'whopper': {
      calories: 657,
      protein: 28,
      carbs: 49,
      fat: 40,
      fiber: 3,
      sugar: 11,
      sodium: 980,
      saturatedFat: 12,
      transFat: 1.5,
      cholesterol: 90,
      servingSize: '1 burger (290g)',
      ingredients: ['Beef patty', 'Sesame seed bun', 'Lettuce', 'Tomato', 'Pickles', 'Onions', 'Mayonnaise'],
      allergens: ['Wheat', 'Egg', 'Soy', 'Sesame'],
      healthScore: 32,
      healthCategory: 'Indulgent',
      nutritionTips: ['Very high in calories', 'High saturated fat content', 'Contains vegetables for nutrients']
    },
    'impossible burger': {
      calories: 240,
      protein: 19,
      carbs: 9,
      fat: 14,
      fiber: 3,
      sugar: 1,
      sodium: 370,
      saturatedFat: 8,
      transFat: 0,
      cholesterol: 0,
      servingSize: '1 patty (113g)',
      ingredients: ['Soy protein concentrate', 'Coconut oil', 'Sunflower oil', 'Natural flavors', 'Heme'],
      allergens: ['Soy'],
      healthScore: 68,
      healthCategory: 'Moderate',
      nutritionTips: ['Plant-based protein', 'No cholesterol', 'Good source of iron']
    },
    // Chicken items
    'chicken nuggets': {
      calories: 180,
      protein: 10,
      carbs: 11,
      fat: 11,
      fiber: 1,
      sugar: 0,
      sodium: 340,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 25,
      servingSize: '4 pieces (64g)',
      ingredients: ['Chicken breast', 'Wheat flour', 'Vegetable oil', 'Salt', 'Spices'],
      allergens: ['Wheat'],
      healthScore: 42,
      healthCategory: 'Moderate',
      nutritionTips: ['Fried food - limit frequency', 'Good protein source', 'Pair with vegetables']
    },
    'grilled chicken sandwich': {
      calories: 320,
      protein: 37,
      carbs: 36,
      fat: 6,
      fiber: 3,
      sugar: 5,
      sodium: 700,
      saturatedFat: 2,
      transFat: 0,
      cholesterol: 85,
      servingSize: '1 sandwich (219g)',
      ingredients: ['Grilled chicken breast', 'Whole wheat bun', 'Lettuce', 'Tomato'],
      allergens: ['Wheat'],
      healthScore: 75,
      healthCategory: 'Healthy',
      nutritionTips: ['Lean protein source', 'Lower in calories', 'Good fiber content']
    },
    // Salads
    'caesar salad': {
      calories: 470,
      protein: 40,
      carbs: 13,
      fat: 31,
      fiber: 4,
      sugar: 5,
      sodium: 1200,
      saturatedFat: 9,
      transFat: 0,
      cholesterol: 95,
      servingSize: '1 salad (254g)',
      ingredients: ['Romaine lettuce', 'Grilled chicken', 'Parmesan cheese', 'Croutons', 'Caesar dressing'],
      allergens: ['Milk', 'Wheat', 'Egg'],
      healthScore: 65,
      healthCategory: 'Moderate',
      nutritionTips: ['High in sodium from dressing', 'Good protein and fiber', 'Rich in vitamins A and K']
    }
  }

  static async getNutritionFacts(foodName: string, restaurantName: string): Promise<NutritionFacts> {
    // Simulate AI processing delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))

    const searchKey = foodName.toLowerCase()
    const baseNutrition = this.nutritionDatabase[searchKey]

    if (baseNutrition) {
      return {
        calories: baseNutrition.calories || 0,
        protein: baseNutrition.protein || 0,
        carbs: baseNutrition.carbs || 0,
        fat: baseNutrition.fat || 0,
        fiber: baseNutrition.fiber || 0,
        sugar: baseNutrition.sugar || 0,
        sodium: baseNutrition.sodium || 0,
        saturatedFat: baseNutrition.saturatedFat || 0,
        transFat: baseNutrition.transFat || 0,
        cholesterol: baseNutrition.cholesterol || 0,
        servingSize: baseNutrition.servingSize || '1 serving',
        ingredients: baseNutrition.ingredients || [],
        allergens: baseNutrition.allergens || [],
        healthScore: baseNutrition.healthScore || 50,
        healthCategory: baseNutrition.healthCategory || 'Moderate',
        nutritionTips: baseNutrition.nutritionTips || []
      }
    }

    // Generate estimated nutrition facts for unknown foods
    return this.generateEstimatedNutrition(foodName, restaurantName)
  }

  private static generateEstimatedNutrition(foodName: string, restaurantName: string): NutritionFacts {
    const name = foodName.toLowerCase()
    const restaurant = restaurantName.toLowerCase()

    // Base estimates based on food type
    let calories = 400
    let protein = 20
    let carbs = 30
    let fat = 15
    let sodium = 600
    let healthScore = 50

    // Adjust based on food type
    if (name.includes('burger') || name.includes('sandwich')) {
      calories = Math.floor(Math.random() * 300) + 400 // 400-700
      protein = Math.floor(Math.random() * 15) + 20 // 20-35
      carbs = Math.floor(Math.random() * 20) + 35 // 35-55
      fat = Math.floor(Math.random() * 20) + 15 // 15-35
      sodium = Math.floor(Math.random() * 500) + 800 // 800-1300
      healthScore = Math.floor(Math.random() * 30) + 30 // 30-60
    } else if (name.includes('salad')) {
      calories = Math.floor(Math.random() * 200) + 200 // 200-400
      protein = Math.floor(Math.random() * 20) + 15 // 15-35
      carbs = Math.floor(Math.random() * 15) + 10 // 10-25
      fat = Math.floor(Math.random() * 15) + 10 // 10-25
      sodium = Math.floor(Math.random() * 400) + 400 // 400-800
      healthScore = Math.floor(Math.random() * 30) + 60 // 60-90
    } else if (name.includes('chicken') && name.includes('grilled')) {
      calories = Math.floor(Math.random() * 150) + 300 // 300-450
      protein = Math.floor(Math.random() * 15) + 30 // 30-45
      carbs = Math.floor(Math.random() * 20) + 20 // 20-40
      fat = Math.floor(Math.random() * 10) + 5 // 5-15
      sodium = Math.floor(Math.random() * 300) + 500 // 500-800
      healthScore = Math.floor(Math.random() * 25) + 65 // 65-90
    } else if (name.includes('fried') || name.includes('fries')) {
      calories = Math.floor(Math.random() * 200) + 400 // 400-600
      protein = Math.floor(Math.random() * 10) + 5 // 5-15
      carbs = Math.floor(Math.random() * 30) + 40 // 40-70
      fat = Math.floor(Math.random() * 15) + 15 // 15-30
      sodium = Math.floor(Math.random() * 400) + 600 // 600-1000
      healthScore = Math.floor(Math.random() * 25) + 20 // 20-45
    }

    // Adjust for restaurant type
    if (restaurant.includes('subway') || restaurant.includes('panera')) {
      healthScore += 10
      sodium -= 100
    } else if (restaurant.includes('mcdonald') || restaurant.includes('burger king')) {
      healthScore -= 10
      sodium += 150
    }

    const fiber = Math.floor(carbs * 0.1) + 2
    const sugar = Math.floor(carbs * 0.2)
    const saturatedFat = Math.floor(fat * 0.3)
    const cholesterol = protein * 3

    let healthCategory: 'Healthy' | 'Moderate' | 'Indulgent'
    if (healthScore >= 70) healthCategory = 'Healthy'
    else if (healthScore >= 40) healthCategory = 'Moderate'
    else healthCategory = 'Indulgent'

    return {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
      saturatedFat,
      transFat: healthScore < 40 ? Math.floor(Math.random() * 2) : 0,
      cholesterol,
      servingSize: '1 serving',
      ingredients: this.generateIngredients(foodName),
      allergens: this.generateAllergens(foodName),
      healthScore,
      healthCategory,
      nutritionTips: this.generateNutritionTips(healthCategory, calories, sodium)
    }
  }

  private static generateIngredients(foodName: string): string[] {
    const name = foodName.toLowerCase()
    const commonIngredients = ['Salt', 'Natural flavors', 'Preservatives']
    
    if (name.includes('burger')) {
      return ['Beef patty', 'Bun', 'Lettuce', 'Tomato', 'Cheese', ...commonIngredients]
    } else if (name.includes('chicken')) {
      return ['Chicken breast', 'Breading', 'Vegetable oil', ...commonIngredients]
    } else if (name.includes('salad')) {
      return ['Mixed greens', 'Vegetables', 'Dressing', 'Cheese', ...commonIngredients]
    } else if (name.includes('fish')) {
      return ['Fish fillet', 'Breading', 'Vegetable oil', ...commonIngredients]
    }
    
    return ['Main ingredient', 'Seasonings', ...commonIngredients]
  }

  private static generateAllergens(foodName: string): string[] {
    const name = foodName.toLowerCase()
    const allergens: string[] = []
    
    if (name.includes('cheese') || name.includes('milk')) allergens.push('Milk')
    if (name.includes('bun') || name.includes('bread') || name.includes('wheat')) allergens.push('Wheat')
    if (name.includes('egg')) allergens.push('Egg')
    if (name.includes('soy')) allergens.push('Soy')
    if (name.includes('sesame')) allergens.push('Sesame')
    if (name.includes('fish')) allergens.push('Fish')
    if (name.includes('shellfish') || name.includes('shrimp')) allergens.push('Shellfish')
    if (name.includes('peanut')) allergens.push('Peanuts')
    if (name.includes('almond') || name.includes('walnut')) allergens.push('Tree nuts')
    
    return allergens
  }

  private static generateNutritionTips(
    category: 'Healthy' | 'Moderate' | 'Indulgent',
    calories: number,
    sodium: number
  ): string[] {
    const tips: string[] = []
    
    if (calories > 600) {
      tips.push('High in calories - consider sharing or eating half')
    } else if (calories < 300) {
      tips.push('Lower calorie option - good for weight management')
    }
    
    if (sodium > 1000) {
      tips.push('Very high in sodium - limit frequency')
    } else if (sodium > 600) {
      tips.push('Moderate sodium content')
    } else {
      tips.push('Lower sodium option')
    }
    
    if (category === 'Healthy') {
      tips.push('Good nutritional choice')
      tips.push('Rich in essential nutrients')
    } else if (category === 'Moderate') {
      tips.push('Balanced option in moderation')
      tips.push('Pair with vegetables for better nutrition')
    } else {
      tips.push('Enjoy as an occasional treat')
      tips.push('Balance with healthier choices throughout the day')
    }
    
    return tips
  }
}
