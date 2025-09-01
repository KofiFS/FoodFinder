import React, { useState, useEffect } from 'react'
import { RestaurantResult } from '../services/googlePlacesService'
import { GooglePlacesService } from '../services/googlePlacesService'

interface RestaurantDiscoveryProps {
  foodName: string
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

const RestaurantDiscovery: React.FC<RestaurantDiscoveryProps> = ({ 
  foodName, 
  userLocation, 
  onClose 
}) => {
  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const placesService = GooglePlacesService.getInstance()

  useEffect(() => {
    if (userLocation) {
      searchRestaurants()
    }
  }, [foodName, userLocation])

  const searchRestaurants = async () => {
    if (!userLocation) return

    setIsLoading(true)
    setError(null)

    try {
      const results = await placesService.searchRestaurants(foodName, userLocation)
      setRestaurants(results)
    } catch (err) {
      setError('Failed to find restaurants. Please try again.')
      console.error('Restaurant search error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const getPriceLevelText = (level: number) => {
    switch (level) {
      case 1: return '$'
      case 2: return '$$'
      case 3: return '$$$'
      case 4: return '$$$$'
      default: return 'N/A'
    }
  }

  const getDistanceText = (distance: number) => {
    if (distance < 1) {
      return `${Math.round(distance * 1000)}m`
    }
    return `${distance.toFixed(1)}km`
  }

  const openGoogleMaps = (restaurant: RestaurantResult) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${restaurant.location.lat},${restaurant.location.lng}`
    window.open(url, '_blank')
  }

  const openRestaurantWebsite = (restaurant: RestaurantResult) => {
    if (restaurant.website) {
      window.open(restaurant.website, '_blank')
    }
  }

  if (!userLocation) {
    return (
      <div style={{
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: 'rgba(254, 254, 250, 0.98)',
        border: '3px solid #fde68a',
        borderRadius: '24px',
        padding: '32px',
        zIndex: 2000,
        minWidth: '600px',
        maxWidth: '800px',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
      }}>
        <div style={{ textAlign: 'center', color: '#dc2626' }}>
          <h2>Location Required</h2>
          <p>Please enable location access to find restaurants near you.</p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      background: 'rgba(254, 254, 250, 0.98)',
      border: '3px solid #fde68a',
      borderRadius: '24px',
      padding: '32px',
      zIndex: 2000,
      minWidth: '600px',
      maxWidth: '800px',
      maxHeight: '80vh',
      overflow: 'auto',
      boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '2px solid #fde68a',
        paddingBottom: '16px'
      }}>
        <h2 style={{
          margin: 0,
          color: '#1e293b',
          fontSize: '24px',
          fontWeight: '700'
        }}>
          🍽️ Where to find {foodName}
        </h2>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #e8e6e0',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#1e293b',
            cursor: 'pointer',
            fontSize: '18px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ✕
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(249, 115, 22, 0.3)',
            borderTop: '4px solid #f97316',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', margin: 0 }}>Finding restaurants near you...</p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div style={{
          background: 'rgba(254, 226, 226, 0.8)',
          border: '2px solid #fecaca',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          textAlign: 'center',
          color: '#dc2626'
        }}>
          {error}
        </div>
      )}

      {/* Restaurant Results */}
      {!isLoading && restaurants.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {restaurants.map((restaurant, index) => (
            <div
              key={restaurant.place_id}
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '2px solid #e8e6e0',
                borderRadius: '16px',
                padding: '20px',
                transition: 'all 0.2s ease'
              }}
            >
              {/* Restaurant Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '12px'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 8px 0',
                    fontSize: '18px',
                    fontWeight: '700',
                    color: '#1e293b'
                  }}>
                    {restaurant.name}
                  </h3>
                  <p style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    color: '#64748b'
                  }}>
                    📍 {restaurant.address}
                  </p>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                    fontSize: '14px'
                  }}>
                    <span style={{ color: '#f97316', fontWeight: '600' }}>
                      ⭐ {restaurant.rating} ({restaurant.totalRatings} reviews)
                    </span>
                    <span style={{ color: '#10b981', fontWeight: '600' }}>
                      💰 {getPriceLevelText(restaurant.priceLevel)}
                    </span>
                    <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                      📏 {getDistanceText(restaurant.distance)}
                    </span>
                    {restaurant.openNow && (
                      <span style={{ color: '#059669', fontWeight: '600' }}>
                        🟢 Open Now
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Reviews */}
              {restaurant.reviews.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <h4 style={{
                    margin: '0 0 8px 0',
                    fontSize: '14px',
                    fontWeight: '600',
                    color: '#374151'
                  }}>
                    Recent Reviews:
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {restaurant.reviews.map((review, reviewIndex) => (
                      <div
                        key={reviewIndex}
                        style={{
                          background: 'rgba(254, 243, 199, 0.6)',
                          border: '1px solid #fde68a',
                          borderRadius: '8px',
                          padding: '12px',
                          fontSize: '13px'
                        }}
                      >
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '4px'
                        }}>
                          <span style={{ fontWeight: '600', color: '#92400e' }}>
                            {review.author_name}
                          </span>
                          <span style={{ color: '#f97316' }}>
                            {'⭐'.repeat(review.rating)}
                          </span>
                        </div>
                        <p style={{
                          margin: 0,
                          color: '#92400e',
                          lineHeight: '1.4'
                        }}>
                          "{review.text}"
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
              }}>
                <button
                  onClick={() => openGoogleMaps(restaurant)}
                  style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    border: '1px solid rgba(59, 130, 246, 0.4)',
                    color: '#3b82f6',
                    padding: '8px 16px',
                    borderRadius: '8px',
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '500'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                  }}
                >
                  🗺️ Get Directions
                </button>
                
                {restaurant.website && (
                  <button
                    onClick={() => openRestaurantWebsite(restaurant)}
                    style={{
                      background: 'rgba(139, 92, 246, 0.2)',
                      border: '1px solid rgba(139, 92, 246, 0.4)',
                      color: '#8b5cf6',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                    }}
                  >
                    🌐 Visit Website
                  </button>
                )}

                {restaurant.phone && (
                  <button
                    onClick={() => window.open(`tel:${restaurant.phone}`, '_self')}
                    style={{
                      background: 'rgba(16, 185, 129, 0.2)',
                      border: '1px solid rgba(16, 185, 129, 0.4)',
                      color: '#10b981',
                      padding: '8px 16px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      fontWeight: '500'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                    }}
                  >
                    📞 Call
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* No Results */}
      {!isLoading && restaurants.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#64748b'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🍽️</div>
          <h3 style={{ margin: '0 0 8px 0', color: '#374151' }}>
            No restaurants found
          </h3>
          <p style={{ margin: 0 }}>
            We couldn't find any restaurants serving {foodName} in your area.
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  )
}

export default RestaurantDiscovery

