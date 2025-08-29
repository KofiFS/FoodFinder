export interface FoodOption {
  id: string
  name: string
  location: string
  price: number
  type: 'Make' | 'Premade' | 'Prepared'
  category: 'Budget' | 'Mid-Range' | 'Premium'
}

export interface Position {
  x: number
  y: number
}

export interface WebNode {
  id: string
  position: Position
  foodOption?: FoodOption
  isCenter?: boolean
}
