import React, { useState, useRef, useEffect } from 'react'
import SpiderWeb from './components/SpiderWeb'
import SearchInput from './components/SearchInput'
import LocationPermissionGate from './components/LocationPermissionGate'
import { FoodOption } from './types'

// Mock data with many more options
const mockFoodOptions: FoodOption[] = [
  // Budget Options - Make at Home
  { id: '1', name: 'Ground Beef', location: 'Kroger', price: 8.49, type: 'Make', category: 'Budget' },
  { id: '2', name: 'Frozen Beef Patties', location: 'Walmart', price: 12.99, type: 'Make', category: 'Budget' },
  { id: '3', name: 'Turkey Ground', location: 'Aldi', price: 6.99, type: 'Make', category: 'Budget' },
  { id: '4', name: 'Bison Patties', location: 'Costco', price: 15.99, type: 'Make', category: 'Budget' },
  { id: '5', name: 'Black Bean Patties', location: 'Whole Foods', price: 5.99, type: 'Make', category: 'Budget' },
  { id: '6', name: 'Chicken Breast', location: 'Safeway', price: 7.99, type: 'Make', category: 'Budget' },
  
  // Mid-Range Options - Fast Food
  { id: '7', name: 'Big Mac', location: 'McDonald\'s', price: 7.49, type: 'Prepared', category: 'Mid-Range' },
  { id: '8', name: 'Whopper', location: 'Burger King', price: 8.99, type: 'Prepared', category: 'Mid-Range' },
  { id: '9', name: 'Baconator', location: 'Wendy\'s', price: 9.49, type: 'Prepared', category: 'Mid-Range' },
  { id: '10', name: 'Double-Double', location: 'In-N-Out', price: 6.85, type: 'Prepared', category: 'Mid-Range' },
  { id: '11', name: 'Famous Star', location: 'Carl\'s Jr', price: 8.29, type: 'Prepared', category: 'Mid-Range' },
  { id: '12', name: 'Turkey Tom', location: 'Jimmy John\'s', price: 7.99, type: 'Prepared', category: 'Mid-Range' },
  { id: '13', name: 'Spicy Chicken', location: 'Chick-fil-A', price: 8.19, type: 'Prepared', category: 'Mid-Range' },
  { id: '14', name: 'Classic Burger', location: 'Five Guys', price: 10.99, type: 'Prepared', category: 'Mid-Range' },
  
  // Premium Options - Restaurants
  { id: '15', name: 'Wagyu Burger', location: 'Prime Steakhouse', price: 32.99, type: 'Prepared', category: 'Premium' },
  { id: '16', name: 'Truffle Burger', location: 'The Capital Grille', price: 28.99, type: 'Prepared', category: 'Premium' },
  { id: '17', name: 'Lobster Burger', location: 'Ocean Prime', price: 35.99, type: 'Prepared', category: 'Premium' },
  { id: '18', name: 'Artisan Blend', location: 'Ruth\'s Chris', price: 24.99, type: 'Prepared', category: 'Premium' },
  { id: '19', name: 'Kobe Beef Burger', location: 'Morton\'s', price: 42.99, type: 'Prepared', category: 'Premium' },
  { id: '20', name: 'Duck Confit Burger', location: 'Le Bernardin', price: 29.99, type: 'Prepared', category: 'Premium' },
  
  // Premade Options - Grocery Store
  { id: '21', name: 'Beyond Burger', location: 'Target', price: 5.99, type: 'Premade', category: 'Mid-Range' },
  { id: '22', name: 'Impossible Burger', location: 'Trader Joe\'s', price: 6.49, type: 'Premade', category: 'Mid-Range' },
  { id: '23', name: 'Dr. Praeger\'s', location: 'Whole Foods', price: 7.99, type: 'Premade', category: 'Mid-Range' },
  { id: '24', name: 'Morningstar Farms', location: 'Kroger', price: 4.99, type: 'Premade', category: 'Budget' },
  { id: '25', name: 'Lightlife', location: 'Safeway', price: 5.49, type: 'Premade', category: 'Budget' },
  
  // More Variety
  { id: '26', name: 'Salmon Burger', location: 'Fresh Market', price: 12.99, type: 'Make', category: 'Mid-Range' },
  { id: '27', name: 'Elk Burger', location: 'Wild Game Co', price: 19.99, type: 'Make', category: 'Premium' },
  { id: '28', name: 'Portobello Burger', location: 'Sprouts', price: 3.99, type: 'Make', category: 'Budget' },
  { id: '29', name: 'Quinoa Burger', location: 'Natural Grocers', price: 8.99, type: 'Premade', category: 'Mid-Range' },
  { id: '30', name: 'Lamb Burger', location: 'Mediterranean Grill', price: 16.99, type: 'Prepared', category: 'Premium' }
]

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([])
  const [selectedCenter, setSelectedCenter] = useState<FoodOption | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSearch = async (query: string) => {
    setIsLoading(true)
    setSearchQuery(query)
    
    // Simulate API call
    setTimeout(() => {
      setFoodOptions(mockFoodOptions)
      setSelectedCenter(mockFoodOptions[2]) // Default to Big Mac
      setHasSearched(true)
      setIsLoading(false)
    }, 1000)
  }

  const handleReset = () => {
    setSearchQuery('')
    setFoodOptions([])
    setSelectedCenter(null)
    setHasSearched(false)
  }

  return (
    <LocationPermissionGate>
      <div style={{ height: '100vh', width: '100vw', position: 'relative' }}>
        {!hasSearched ? (
          <SearchInput onSearch={handleSearch} isLoading={isLoading} />
        ) : (
          <SpiderWeb 
            foodOptions={foodOptions}
            selectedCenter={selectedCenter}
            onCenterChange={setSelectedCenter}
            searchQuery={searchQuery}
            onReset={handleReset}
          />
        )}
      </div>
    </LocationPermissionGate>
  )
}

export default App
