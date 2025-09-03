import React, { useState, useEffect } from 'react'
import { FoodOption } from '../types'
import EnhancedLocationService, { UserLocation, NearbyPlace } from '../services/enhancedLocationService'

interface FoodCardProps {
  option: FoodOption
  isHighlighted: boolean
  onClick: () => void
  isSelectedForComparison?: boolean
  onComparisonToggle?: (optionId: string) => void
  onDiscoverClick?: (option: FoodOption) => void
}

const FoodCard: React.FC<FoodCardProps> = ({ 
  option, 
  isHighlighted, 
  onClick, 
  isSelectedForComparison = false,
  onComparisonToggle,
  onDiscoverClick
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
    
    

    
    const name = option.name.toLowerCase()
    if (name.includes('salad') || name.includes('grilled')) score += 20
    else if (name.includes('fried') || name.includes('burger')) score -= 15
    
    let category: string
    if (score >= 70) category = 'Healthy'
    else if (score >= 40) category = 'Moderate'
    else category = 'Indulgent'
    
            setHealthInfo({ score, category, reason: `Based on price category` })
  }

  
  // Function to get photo URL from Google Places photo (supports both old and new API)
  const getPhotoUrl = (photo: any, maxWidth: number = 400): string => {
    if (!photo) return ''
    
    try {
      // Check if it's the old API format (has getUrl method)
      if (photo.getUrl && typeof photo.getUrl === 'function') {
        return photo.getUrl({ maxWidth })
      }
      
      // Check if it's the new API format (has name property)
      if (photo.name) {
        const apiKey = (import.meta as any).env.VITE_GOOGLE_PLACES_API_KEY || ''
        return `https://places.googleapis.com/v1/${photo.name}/media?key=${apiKey}&maxWidthPx=${maxWidth}`
      }
      
      return ''
    } catch (error) {
      console.error('Error getting photo URL:', error)
      return ''
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

  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    const hasQuarterStar = rating % 1 >= 0.25 && rating % 1 < 0.5

    // Add full stars
    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <img
          key={`full-${i}`}
          src="/src/images/Star_Full.png"
          alt="Full star"
          style={{
            width: '16px',
            height: '16px',
            objectFit: 'contain'
          }}
        />
      )
    }

    // Add half or quarter star if needed
    if (hasHalfStar) {
      stars.push(
        <img
          key="half"
          src="/src/images/Star_Half.png"
          alt="Half star"
          style={{
            width: '16px',
            height: '16px',
            objectFit: 'contain'
          }}
        />
      )
    } else if (hasQuarterStar) {
      stars.push(
        <img
          key="quarter"
          src="/src/images/Star_Quarter.png"
          alt="Quarter star"
          style={{
            width: '16px',
            height: '16px',
            objectFit: 'contain'
          }}
        />
      )
    }

    return stars
  }





  return (
    <div
      style={{
        background: isHighlighted 
          ? 'rgba(253, 246, 227, 0.95)' 
          : isHovered 
            ? 'rgba(253, 246, 227, 0.9)' 
            : 'rgba(253, 246, 227, 0.85)',
        border: `2px solid ${isHighlighted ? '#e8e6e0' : isHovered ? '#d1d5db' : '#cbd5e1'}`,
        borderRadius: '16px',
        padding: '20px',
        minWidth: '200px',
        maxWidth: '220px',
        backdropFilter: 'blur(10px)',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        boxShadow: isHighlighted 
          ? '0 12px 40px rgba(0, 0, 0, 0.15)' 
          : isHovered 
            ? '0 8px 25px rgba(0, 0, 0, 0.1)' 
            : '0 4px 15px rgba(0, 0, 0, 0.08)',
        color: '#1e293b',
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
          <div style={{
            cursor: 'pointer'
          }}>
            <img 
              src={isSelectedForComparison ? '/src/images/Checked.png' : '/src/images/NotChecked.png'}
              alt={isSelectedForComparison ? 'Selected' : 'Not selected'}
              style={{
                width: '24px',
                height: '24px',
                objectFit: 'contain'
              }}
            />
          </div>
        </div>
      )}





      {/* Content */}
      <div style={{ marginTop: '35px', textAlign: 'center' }}>
        {/* Restaurant Image */}
        {option.realRestaurantData?.photos && option.realRestaurantData.photos.length > 0 && (
          <div style={{
            width: '100%',
            height: '120px',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
          }}>
            <img
              src={getPhotoUrl(option.realRestaurantData.photos[0], 400)}
              alt={`${option.name} restaurant`}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover'
              }}
              onError={(e) => {
                // Hide image if it fails to load
                e.currentTarget.style.display = 'none'
              }}
            />
          </div>
        )}
        
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
            color: 'rgba(30, 41, 59, 0.8)',
            marginBottom: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            justifyContent: 'center'
          }}
        >
          {option.realRestaurantData ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              {renderStars(option.realRestaurantData.rating)}
              <span style={{ fontSize: '12px', color: '#64748b', marginLeft: '4px' }}>
                ({option.realRestaurantData.totalRatings})
              </span>
            </div>
          ) : (
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
              No rating available
            </span>
          )}
        </div>

        {isLoadingLocation && (
          <div style={{
            fontSize: '11px',
            color: 'rgba(30, 41, 59, 0.6)',
            marginBottom: '8px',
            textAlign: 'center'
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
          {option.priceLevel ? ['$', '$$', '$$$', '$$$$'][option.priceLevel - 1] : '$'}
        </div>

      </div>

    </div>
  )
}

export default FoodCard
