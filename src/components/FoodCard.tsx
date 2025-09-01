import React, { useState, useEffect } from 'react'
import { FoodOption } from '../types'
import EnhancedLocationService, { UserLocation, NearbyPlace } from '../services/enhancedLocationService'

interface FoodCardProps {
  option: FoodOption
  isHighlighted: boolean
  onClick: () => void
  isSelectedForComparison?: boolean
  onComparisonToggle?: (optionId: string) => void
}

const FoodCard: React.FC<FoodCardProps> = ({ 
  option, 
  isHighlighted, 
  onClick, 
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
    
    

    
    const name = option.name.toLowerCase()
    if (name.includes('salad') || name.includes('grilled')) score += 20
    else if (name.includes('fried') || name.includes('burger')) score -= 15
    
    let category: string
    if (score >= 70) category = 'Healthy'
    else if (score >= 40) category = 'Moderate'
    else category = 'Indulgent'
    
            setHealthInfo({ score, category, reason: `Based on price category` })
  }

  

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Budget': return '#10b981'
      case 'Mid-Range': return '#f59e0b'
      case 'Premium': return '#ef4444'
      default: return '#6b7280'
    }
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
          <div
            style={{
              width: '24px',
              height: '24px',
              borderRadius: '6px',
              border: `2px solid ${isSelectedForComparison ? '#f59e0b' : '#d1d5db'}`,
              background: isSelectedForComparison 
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'rgba(255, 255, 255, 0.9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              opacity: 1,
              transition: 'all 0.2s ease',
              backdropFilter: 'blur(10px)',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          >
            {isSelectedForComparison && (
              <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
            )}
          </div>
        </div>
      )}



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
      <div style={{ marginTop: '35px', textAlign: 'center' }}>
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
          <span>📍</span>
          {option.nearbyLocations && option.nearbyLocations.length > 0 ? (
            <span style={{ fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
              {option.nearbyLocations[0].name}
            </span>
          ) : (
            option.location
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
