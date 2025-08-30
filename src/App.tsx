import React, { useState, useRef, useEffect } from 'react'
import SpiderWeb from './components/SpiderWeb'
import SearchInput from './components/SearchInput'
import LocationPermissionGate from './components/LocationPermissionGate'
import { FoodOption } from './types'
import { FoodChainResult } from './services/foodChainService'
import GoogleMapsLoader from './services/googleMapsLoader'

function App() {
  const [searchQuery, setSearchQuery] = useState('')
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([])
  const [selectedCenter, setSelectedCenter] = useState<FoodOption | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false)
  const [googleMapsError, setGoogleMapsError] = useState<string | null>(null)

  // Load Google Maps when app starts
  useEffect(() => {
    const loadGoogleMaps = async () => {
      try {
        await GoogleMapsLoader.getInstance().loadGoogleMaps()
        setGoogleMapsLoaded(true)
        setGoogleMapsError(null)
      } catch (error) {
        console.error('Failed to load Google Maps:', error)
        setGoogleMapsError(error instanceof Error ? error.message : 'Failed to load Google Maps')
        setGoogleMapsLoaded(false)
      }
    }

    loadGoogleMaps()
  }, [])

  const handleSearch = async (query: string, foodChainResult: FoodChainResult) => {
    setIsLoading(true)
    setSearchQuery(query)
    
    try {
      // Use Food Chain results
      if (foodChainResult.foods && foodChainResult.foods.length > 0) {
        setFoodOptions(foodChainResult.foods)
        // Set the first food option as the center
        setSelectedCenter(foodChainResult.foods[0])
        setHasSearched(true)
        console.log('🍔 Food Chain created with', foodChainResult.foods.length, 'foods and', foodChainResult.nearbyLocations.length, 'nearby locations')
      } else {
        // If no foods returned, show error and don't proceed
        console.error('Food Chain returned no food options')
        alert(`I can't think of any recommendations that suit your taste for "${query}". Please try a different craving.`)
      }
    } catch (error) {
      console.error('Error in handleSearch:', error)
      alert('An error occurred while processing your request. Please try again.')
    } finally {
      // Keep loading for a bit longer to show the transition
      setTimeout(() => {
        setIsLoading(false)
      }, 1000) // Show loading for 1 second after results are ready
    }
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
          <SearchInput 
            onSearch={handleSearch} 
            isLoading={isLoading} 
            googleMapsLoaded={googleMapsLoaded}
            googleMapsError={googleMapsError}
          />
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
