import React, { useState, useEffect } from 'react'
import { FoodOption } from '../types'
import EnhancedLocationService, { UserLocation, NearbyPlace } from '../services/enhancedLocationService'

interface FoodCardProps {
  option: FoodOption
  isHighlighted: boolean
  onClick: () => void
  onShowNutrition?: (foodName: string, restaurantName: string) => void
  isSelectedForComparison?: boolean
  onComparisonToggle?: (optionId: string) => void
}

const FoodCard: React.FC<FoodCardProps> = ({ 
  option, 
  isHighlighted, 
  onClick, 
  onShowNutrition,
  isSelectedForComparison = false,
  onComparisonToggle
}) => {
  const [isHovered, setIsHovered] = useState(false)
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null)
  const [nearestStore, setNearestStore] = useState<NearbyPlace | null>(null)
  const [isLoadingLocation, setIsLoadingLocation] = useState(false)
  const [healthInfo, setHealthInfo] = useState<{ score: number; category: string; reason: string } | null>(null)


  const locationService = EnhancedLocationService.getInstance()

  // Get user location on component mount
  useEffect(() => {
    getUserLocation()
    getHealthInfo()
  }, [])

  // Find nearest store when user location is available
  useEffect(() => {
    if (userLocation) {
      findNearestStore()
    }
  }, [userLocation, option])

  const getUserLocation = async () => {
    setIsLoadingLocation(true)
    try {
      const location = await locationService.getUserLocation()
      setUserLocation(location)
    } catch (error) {
      console.error('Error getting user location:', error)
    } finally {
      setIsLoadingLocation(false)
    }
  }

  const findNearestStore = async () => {
    if (!userLocation) return

    console.log(`🔍 Searching for ${option.location} near location:`, userLocation)
    
    try {
      const nearbyPlaces = await locationService.findNearbyPlaces(option.location, userLocation)
      console.log(`✅ Found ${nearbyPlaces.length} places for ${option.location}:`, nearbyPlaces)
      
      if (nearbyPlaces.length > 0) {
        setNearestStore(nearbyPlaces[0])
        console.log(`📍 Set nearest store:`, nearbyPlaces[0])
      } else {
        console.log(`❌ No nearby places found for ${option.location}`)
      }
    } catch (error) {
      console.error('Error finding nearest store:', error)
    }
  }

  const getHealthInfo = () => {
    // Simple health scoring - we'll get detailed info from the popup
    const baseScore = 50
    let score = baseScore
    
    if (option.type === 'Make') score += 20
    else if (option.type === 'Premade') score += 10
    
    const name = option.name.toLowerCase()
    if (name.includes('salad') || name.includes('grilled')) score += 20
    else if (name.includes('fried') || name.includes('burger')) score -= 15
    
    let category: string
    if (score >= 70) category = 'Healthy'
    else if (score >= 40) category = 'Moderate'
    else category = 'Indulgent'
    
    setHealthInfo({ score, category, reason: `Based on ${option.type} preparation` })
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'Make': return '#22c55e'
      case 'Premade': return '#f59e0b'
      case 'Prepared': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Budget': return '#10b981'
      case 'Mid-Range': return '#f59e0b'
      case 'Premium': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const handleGetDirections = async (e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (nearestStore && userLocation) {
      // Use Google Places service for better URL generation
      try {
        const { GooglePlacesService } = await import('../services/googlePlacesService')
        const placesService = GooglePlacesService.getInstance()
        
        // Create a place object for the nearest store
        const place = {
          place_id: nearestStore.placeId,
          name: nearestStore.name,
          formatted_address: nearestStore.address,
          geometry: {
            location: {
              lat: nearestStore.lat,
              lng: nearestStore.lng
            }
          },
          business_status: 'OPERATIONAL'
        }
        
        const directionsUrl = locationService.generateDirectionsUrl(nearestStore, userLocation)
        window.open(directionsUrl, '_blank')
      } catch (error) {
        console.error('Error generating directions:', error)
        // Fallback to basic directions
        const directionsUrl = `https://www.google.com/maps/dir/${userLocation.lat},${userLocation.lng}/${nearestStore.lat},${nearestStore.lng}`
        window.open(directionsUrl, '_blank')
      }
    } else if (userLocation) {
      // Search for the store near user location
      const searchUrl = locationService.generatePlaceSearchUrl(option.location, userLocation)
      window.open(searchUrl, '_blank')
    } else {
      // Fallback to general search if location data isn't available
      const searchUrl = locationService.generatePlaceSearchUrl(`${option.location} near me`)
      window.open(searchUrl, '_blank')
    }
  }

  const handleFoodInfo = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (onShowNutrition) {
      onShowNutrition(option.name, option.location)
    }
  }

  return (
    <div
      style={{
        background: isHighlighted 
          ? 'rgba(255, 255, 255, 0.15)' 
          : isHovered 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(255, 255, 255, 0.05)',
        border: `2px solid ${isHighlighted ? 'rgba(255,255,255,0.8)' : isHovered ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.3)'}`,
        borderRadius: '16px',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '220px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isHighlighted 
          ? '0 12px 40px rgba(255,255,255,0.3)' 
          : isHovered 
            ? '0 8px 25px rgba(255,255,255,0.2)' 
            : '0 4px 15px rgba(255,255,255,0.1)',
        color: 'white',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Comparison Checkbox */}
      {onComparisonToggle && (
        <div
          style={{
            position: 'absolute',
            top: '8px',
            left: '8px',
            zIndex: 20
          }}
          onClick={(e) => {
            e.stopPropagation()
            onComparisonToggle(option.id)
          }}
        >
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '4px',
              border: `2px solid ${isSelectedForComparison ? '#f59e0b' : 'rgba(255,255,255,0.5)'}`,
              background: isSelectedForComparison 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'rgba(255,255,255,0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 1,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)'
            }}
          >
            {isSelectedForComparison && (
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        </div>
      )}

      {/* Type Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: getTypeColor(option.type),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {option.type}
      </div>

      {/* Category Badge */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: getCategoryColor(option.category),
          color: 'white',
          padding: '4px 8px',
          borderRadius: '6px',
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px'
        }}
      >
        {option.category}
      </div>

      {/* Health Score Badge */}
      {healthInfo && (
        <div
          style={{
            position: 'absolute',
            top: '42px',
            right: '12px',
            background: healthInfo.category === 'Healthy' 
              ? 'rgba(34, 197, 94, 0.8)' 
              : healthInfo.category === 'Moderate' 
                ? 'rgba(245, 158, 11, 0.8)' 
                : 'rgba(239, 68, 68, 0.8)',
            color: 'white',
            padding: '3px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '2px'
          }}
        >
          {healthInfo.category === 'Healthy' ? '💚' : healthInfo.category === 'Moderate' ? '💛' : '🧡'}
          {healthInfo.score}
        </div>
      )}

      {/* Content */}
      <div style={{ marginTop: '35px' }}>
        <h3
          style={{
            fontSize: '18px',
            fontWeight: '700',
            marginBottom: '8px',
            lineHeight: '1.3'
          }}
        >
          {option.name}
        </h3>

        <div
          style={{
            fontSize: '14px',
            color: 'rgba(255,255,255,0.8)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}
        >
          <span>📍</span>
          {option.location}
          {nearestStore && (
            <span style={{ fontSize: '12px', color: '#4ade80', fontWeight: '600' }}>
              ({nearestStore.distanceText || `${nearestStore.distance.toFixed(1)} mi`})
            </span>
          )}
          {userLocation && !nearestStore && !isLoadingLocation && (
            <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: '500' }}>
              (None nearby)
            </span>
          )}
        </div>

        {isLoadingLocation && (
          <div style={{
            fontSize: '11px',
            color: 'rgba(255,255,255,0.6)',
            marginBottom: '8px'
          }}>
            📍 Finding nearby locations...
          </div>
        )}

        <div
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: '#4ade80',
            marginBottom: '16px'
          }}
        >
          ${option.price.toFixed(2)}
        </div>

        <div style={{
          display: 'flex',
          gap: '8px',
          flexDirection: 'column'
        }}>
          <button
            onClick={handleGetDirections}
            disabled={isLoadingLocation}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: isLoadingLocation 
                ? 'rgba(100, 100, 100, 0.3)' 
                : 'linear-gradient(135deg, #22c55e 0%, #16a34a 100%)',
              border: 'none',
              borderRadius: '8px',
              color: 'white',
              fontSize: '13px',
              fontWeight: '600',
              cursor: isLoadingLocation ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(5px)',
              opacity: isLoadingLocation ? 0.6 : 1
            }}
            onMouseEnter={(e) => {
              if (!isLoadingLocation) {
                e.currentTarget.style.transform = 'translateY(-1px)'
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(34, 197, 94, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {isLoadingLocation ? (
              '⏳ Finding locations...'
            ) : nearestStore ? (
              `🧭 Directions (${nearestStore.distanceText || `${nearestStore.distance.toFixed(1)} mi`})`
            ) : userLocation ? (
              '🔍 Search Near Me'
            ) : (
              '🗺️ Find Locations'
            )}
          </button>

          <button
            onClick={handleFoodInfo}
            style={{
              width: '100%',
              padding: '8px 16px',
              background: 'rgba(59, 130, 246, 0.2)',
              border: '1px solid rgba(59, 130, 246, 0.4)',
              borderRadius: '6px',
              color: '#93c5fd',
              fontSize: '12px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(5px)'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.6)'
              e.currentTarget.style.color = '#dbeafe'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
              e.currentTarget.style.borderColor = 'rgba(59, 130, 246, 0.4)'
              e.currentTarget.style.color = '#93c5fd'
            }}
          >
            ℹ️ Nutrition Facts
          </button>
        </div>
      </div>

    </div>
  )
}

export default FoodCard
