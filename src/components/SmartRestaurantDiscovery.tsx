import React, { useState, useEffect } from 'react'
import { CravingToRestaurantService, CravingToRestaurantAnalysis, RestaurantMatch } from '../services/cravingToRestaurantService'
import { GooglePlacesService, RestaurantResult } from '../services/googlePlacesService'

interface SmartRestaurantDiscoveryProps {
  foodName: string
  userLocation: { lat: number; lng: number } | null
  onClose: () => void
}

const SmartRestaurantDiscovery: React.FC<SmartRestaurantDiscoveryProps> = ({ 
  foodName, 
  userLocation, 
  onClose 
}) => {
  const [cravingAnalysis, setCravingAnalysis] = useState<CravingToRestaurantAnalysis | null>(null)
  const [restaurants, setRestaurants] = useState<RestaurantResult[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState<'analyzing' | 'searching' | 'results' | 'error'>('analyzing')

  const cravingService = CravingToRestaurantService.getInstance()
  const placesService = GooglePlacesService.getInstance()

  const renderStars = (rating: number) => {
    const stars: JSX.Element[] = []
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

  useEffect(() => {
    if (userLocation) {
      analyzeCravingAndFindRestaurants()
    }
  }, [foodName, userLocation])

  const analyzeCravingAndFindRestaurants = async () => {
    if (!userLocation) return

    setIsAnalyzing(true)
    setCurrentStep('analyzing')
    setError(null)

    try {
      // Step 1: Analyze the craving with OpenAI
      console.log('🔍 Analyzing craving:', foodName)
      const analysis = await cravingService.analyzeCravingForRestaurants(foodName)
      setCravingAnalysis(analysis)
      console.log('✅ Craving analysis complete:', analysis)

      // Step 2: Generate search queries and find restaurants
      setIsAnalyzing(false)
      setIsSearching(true)
      setCurrentStep('searching')

      const searchQueries = cravingService.generateSearchQueries(analysis)
      console.log('🔍 Search queries:', searchQueries)

      const restaurantResults = await placesService.searchRestaurantsWithStrategy(
        searchQueries, 
        userLocation, 
        15
      )
      
      setRestaurants(restaurantResults)
      setCurrentStep('results')
      console.log('✅ Restaurant search complete:', restaurantResults)

    } catch (err) {
      console.error('Smart restaurant discovery error:', err)
      setError('Failed to analyze craving and find restaurants. Please try again.')
      setCurrentStep('error')
    } finally {
      setIsAnalyzing(false)
      setIsSearching(false)
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
      maxWidth: '900px',
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
          🧠 Smart Restaurant Discovery for {foodName}
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

      {/* Loading States */}
      {currentStep === 'analyzing' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(139, 92, 246, 0.3)',
            borderTop: '4px solid #8b5cf6',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', margin: 0 }}>
            🤖 AI is analyzing your craving and planning the best restaurant search strategy...
          </p>
        </div>
      )}

      {currentStep === 'searching' && (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div className="loading-spinner" style={{
            width: '40px',
            height: '40px',
            border: '4px solid rgba(59, 130, 246, 0.3)',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            margin: '0 auto 16px'
          }} />
          <p style={{ color: '#64748b', margin: 0 }}>
            🔍 Searching for restaurants using AI-optimized search strategy...
          </p>
        </div>
      )}

      {/* Error State */}
      {currentStep === 'error' && error && (
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

      {/* AI Analysis Results */}
      {cravingAnalysis && currentStep !== 'analyzing' && (
        <div className="analysis-section" style={{
          background: 'rgba(139, 92, 246, 0.1)',
          border: '2px solid rgba(139, 92, 246, 0.3)',
          borderRadius: '16px',
          padding: '20px',
          marginBottom: '24px'
        }}>
          <h3 style={{
            margin: '0 0 16px 0',
            color: '#7c3aed',
            fontSize: '18px',
            fontWeight: '600'
          }}>
            🤖 AI Analysis Results
          </h3>
          
          <div style={{ marginBottom: '16px' }}>
            <p style={{ margin: '0 0 8px 0', color: '#374151', fontWeight: '500' }}>
              <strong>Search Strategy:</strong> {cravingAnalysis.searchStrategy}
            </p>
            <p style={{ margin: '0 0 8px 0', color: '#374151' }}>
              <strong>Confidence Score:</strong> {cravingAnalysis.totalConfidence}%
            </p>
          </div>

          {/* Primary Matches */}
          <div style={{ marginBottom: '16px' }}>
            <h4 style={{
              margin: '0 0 12px 0',
              color: '#7c3aed',
              fontSize: '16px',
              fontWeight: '600'
            }}>
              🎯 Primary Restaurant Types ({cravingAnalysis.primaryMatches.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {cravingAnalysis.primaryMatches.map((match, index) => (
                <div
                  key={index}
                  className="fade-in-up"
                  style={{
                    background: 'rgba(255, 255, 255, 0.8)',
                    border: '1px solid rgba(139, 92, 246, 0.2)',
                    borderRadius: '12px',
                    padding: '16px',
                    animationDelay: `${index * 0.1}s`
                  }}
                >
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '8px'
                  }}>
                    <h5 style={{
                      margin: 0,
                      color: '#1e293b',
                      fontSize: '16px',
                      fontWeight: '600'
                    }}>
                      {match.restaurantType}
                    </h5>
                    <span style={{
                      background: '#10b981',
                      color: 'white',
                      padding: '4px 8px',
                      borderRadius: '12px',
                      fontSize: '12px',
                      fontWeight: '600'
                    }}>
                      {match.confidence}% match
                    </span>
                  </div>
                  <p style={{
                    margin: '0 0 8px 0',
                    color: '#64748b',
                    fontSize: '14px'
                  }}>
                    {match.reasoning}
                  </p>
                  <div style={{ color: '#6b7280', fontSize: '13px' }}>
                    <strong>Typical foods:</strong> {match.typicalFoods.join(', ')}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Alternative Matches */}
          {cravingAnalysis.alternativeMatches.length > 0 && (
            <div>
              <h4 style={{
                margin: '0 0 12px 0',
                color: '#7c3aed',
                fontSize: '16px',
                fontWeight: '600'
              }}>
                🔄 Alternative Options ({cravingAnalysis.alternativeMatches.length})
              </h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {cravingAnalysis.alternativeMatches.map((match, index) => (
                  <div
                    key={index}
                    className="fade-in-up"
                    style={{
                      background: 'rgba(255, 255, 255, 0.6)',
                      border: '1px solid rgba(139, 92, 246, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      animationDelay: `${index * 0.1}s`
                    }}
                  >
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <span style={{ color: '#374151', fontWeight: '500' }}>
                        {match.restaurantType}
                      </span>
                      <span style={{
                        background: '#f59e0b',
                        color: 'white',
                        padding: '2px 6px',
                        borderRadius: '8px',
                        fontSize: '11px',
                        fontWeight: '600'
                      }}>
                        {match.confidence}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Restaurant Results */}
      {currentStep === 'results' && restaurants.length > 0 && (
        <div className="fade-in-up">
          <h3 style={{
            margin: '0 0 20px 0',
            color: '#1e293b',
            fontSize: '20px',
            fontWeight: '600'
          }}>
            🍽️ Found {restaurants.length} Restaurants
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {restaurants.map((restaurant, index) => (
              <div
                key={restaurant.place_id}
                className="restaurant-card fade-in-up"
                style={{
                  background: 'rgba(255, 255, 255, 0.8)',
                  border: '2px solid #e8e6e0',
                  borderRadius: '16px',
                  padding: '20px',
                  animationDelay: `${index * 0.1}s`
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
                    <h4 style={{
                      margin: '0 0 8px 0',
                      fontSize: '18px',
                      fontWeight: '700',
                      color: '#1e293b'
                    }}>
                      {restaurant.name}
                    </h4>
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
                      <span style={{ color: '#f97316', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {renderStars(restaurant.rating)}
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          ({restaurant.totalRatings} reviews)
                        </span>
                      </span>
                      <span style={{ color: '#10b981', fontWeight: '600' }}>
                        💰 {getPriceLevelText(restaurant.priceLevel)}
                      </span>
                      <span style={{ color: '#3b82f6', fontWeight: '600' }}>
                        📏 {getDistanceText(restaurant.distance)}
                      </span>
                      {restaurant.openNow && (
                        <img 
                          src="/src/images/Open.png"
                          alt="Open"
                          style={{
                            position: 'absolute',
                            top: '-5px',
                            left: '-5px',
                            width: '35px',
                            height: '35px',
                            objectFit: 'contain',
                            transform: 'rotate(-45deg)',
                            zIndex: 10,
                            filter: 'drop-shadow(2px 2px 4px rgba(0,0,0,0.3))'
                          }}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* Reviews */}
                {restaurant.reviews.length > 0 && (
                  <div style={{ marginBottom: '16px' }}>
                    <h5 style={{
                      margin: '0 0 8px 0',
                      fontSize: '14px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Recent Reviews:
                    </h5>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {restaurant.reviews.slice(0, 2).map((review, reviewIndex) => (
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
        </div>
      )}

      {/* No Results */}
      {currentStep === 'results' && restaurants.length === 0 && !error && (
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
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          .fade-in-up {
            animation: fadeInUp 0.6s ease-out;
          }
          
          .pulse {
            animation: pulse 2s infinite;
          }
          
          .restaurant-card {
            transition: all 0.3s ease;
          }
          
          .restaurant-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
          }
          
          .analysis-section {
            animation: fadeInUp 0.8s ease-out;
          }
          
          .loading-spinner {
            animation: spin 1s linear infinite;
          }
        `}
      </style>
    </div>
  )
}

export default SmartRestaurantDiscovery

