import React, { useState, useEffect } from 'react'
import { FoodChainService, FoodChainResult } from '../services/foodChainService'

interface SearchInputProps {
  onSearch: (query: string, result: FoodChainResult) => void
  isLoading: boolean
  googleMapsLoaded?: boolean
  googleMapsError?: string | null
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading, googleMapsLoaded, googleMapsError }) => {
  const [query, setQuery] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [locationPermission, setLocationPermission] = useState<'granted' | 'denied' | 'prompt' | 'checking'>('checking')
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [isLocationLoading, setIsLocationLoading] = useState(false)


  // Check location permission status on component mount
  useEffect(() => {
    checkLocationPermission()
  }, [])



  // Check location permission status
  const checkLocationPermission = async () => {
    try {
      if (!navigator.geolocation) {
        setLocationPermission('denied')
        return
      }

      // Check if we already have permission
      const permission = await navigator.permissions?.query({ name: 'geolocation' })
      if (permission) {
        setLocationPermission(permission.state)
        
        // If permission is granted, get the location
        if (permission.state === 'granted') {
          getUserLocation() // This will set isLocationLoading internally
        }
        
        // Listen for permission changes
        permission.onchange = () => {
          setLocationPermission(permission.state)
          if (permission.state === 'granted') {
            getUserLocation()
          }
        }
      } else {
        // Fallback for browsers that don't support permissions API
        setLocationPermission('prompt')
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      setLocationPermission('prompt')
    }
  }

  // Get user location for nearby food search
  const getUserLocation = (): Promise<{ lat: number; lng: number }> => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported'))
        return
      }

      // Set loading state when starting to get location
      setIsLocationLoading(true)

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          }
          setUserLocation(location)
          setIsLocationLoading(false) // Clear loading when successful
          resolve(location)
        },
        (error) => {
          console.error('Geolocation error:', error)
          setLocationPermission('denied')
          setIsLocationLoading(false) // Clear loading on error
          reject(new Error('Unable to get your location. Please enable location access.'))
        },
        {
          enableHighAccuracy: true,
          timeout: 15000,
          maximumAge: 300000 // 5 minutes
        }
      )
    })
  }

  // Request location permission
  const requestLocationPermission = async () => {
    try {
      setIsLocationLoading(true)
      setLocationPermission('checking')
      const location = await getUserLocation()
      setLocationPermission('granted')
      setUserLocation(location)
    } catch (error) {
      console.error('Error requesting location permission:', error)
      setLocationPermission('denied')
    } finally {
      setIsLocationLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      try {
        // Clear any previous errors
        setError(null)
        
        // Check if we have user location
        if (!userLocation) {
          setError('Location access is required. Please enable location services.')
          return
        }
        
        // Set local loading state to show loading screen immediately
        setIsLocationLoading(true)
        
        // Use Food Chain Service to create complete food chain
        const foodChainResult = await FoodChainService.createFoodChain(query.trim(), userLocation)
        try {
          onSearch(query.trim(), foodChainResult)
        } catch (searchError) {
          // Handle errors from the search (like no results found)
          console.error('Error in search:', searchError)
          setError(searchError instanceof Error ? searchError.message : 'An error occurred during the search.')
        }
      } catch (error) {
        console.error('Error creating food chain:', error)
        // Set error message to display above search bar
        setError(error instanceof Error ? error.message : 'Unable to create food chain at this time.')
      } finally {
        // Clear local loading state
        setIsLocationLoading(false)
      }
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 1000,
      width: '100%',
      maxWidth: '600px',
      padding: '0 20px'
    }}>




      {/* Loading Screen */}
      {(isLoading || isLocationLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(253, 246, 227, 0.3)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'rgba(253, 246, 227, 0.98)',
            padding: '48px',
            borderRadius: '24px',
            textAlign: 'center',
            border: '3px solid #e8e6e0',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid #fde68a',
              borderTop: '4px solid #f97316',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: '#1e293b', marginBottom: '10px' }}>
                                      🍔 Finding places that suit your craving...
            </h2>
            <p style={{ color: '#64748b', fontSize: '16px' }}>
              Analyzing your craving and searching for the perfect food matches in your area. Hang tight while we curate your personalized food journey!
            </p>
            

            {isLoading && (
              <div style={{
                marginTop: '20px',
                textAlign: 'center'
              }}>
                <div style={{
                  display: 'flex',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '12px'
                }}>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f97316',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f97316',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#f97316',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                  }}></div>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Almost there...
                </div>
              </div>
            )}
            <div style={{
              width: '200px',
              height: '4px',
              background: '#fde68a',
              borderRadius: '2px',
              margin: '20px auto 0',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: 'linear-gradient(90deg, #f97316, #ea580c)',
                borderRadius: '2px',
                animation: 'loading 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
      )}





      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(254, 254, 250, 0.98)',
          color: '#b91c1c',
          padding: '18px 24px',
          borderRadius: '18px',
          marginBottom: '20px',
          border: '3px solid #fecaca',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '15px',
          lineHeight: '1.4',
          position: 'relative',
          margin: '0 auto 20px',
          boxShadow: '0 8px 20px rgba(0, 0, 0, 0.08)',
          fontWeight: '600',
          textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
        }}>
          ⚠️ {error}
          <div style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginTop: '12px'
          }}>
            <button
              onClick={() => setError(null)}
              style={{
                background: '#f8fafc',
                border: '2px solid #e2e8f0',
                color: '#64748b',
                borderRadius: '12px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                fontWeight: '500'
              }}
            >
              Dismiss
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                border: 'none',
                color: 'white',
                borderRadius: '12px',
                padding: '10px 20px',
                cursor: 'pointer',
                fontSize: '14px',
                transition: 'all 0.2s ease',
                fontWeight: '500',
                boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)'
              }}
            >
              🔄 Refresh Page
            </button>
          </div>
        </div>
      )}

      {/* Location Permission Status */}
      {locationPermission === 'checking' && (
        <div style={{
          background: 'rgba(254, 254, 250, 0.98)',
          color: '#0369a1',
          padding: '36px',
          borderRadius: '24px',
          marginBottom: '20px',
          border: '3px solid #bae6fd',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🔍</div>
          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Checking Location Access...</h3>
          <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
            Please wait while we check your location permissions.
          </p>
        </div>
      )}

      {locationPermission === 'denied' && (
        <div style={{
          background: 'rgba(254, 254, 250, 0.98)',
          color: '#b91c1c',
          padding: '36px',
          borderRadius: '24px',
          marginBottom: '20px',
          border: '3px solid #fecaca',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>🚫</div>
          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Location Access Denied</h3>
          <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
            To find nearby food options, we need access to your location. 
            Please enable location services in your browser settings and refresh the page.
          </p>
          <button
            onClick={() => window.location.reload()}
            style={{
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '600',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
            }}
          >
            🔄 Refresh Page
          </button>
        </div>
      )}

      {/* Search Form - Only show when location is granted */}
      {locationPermission === 'granted' && userLocation && (
        <form onSubmit={handleSubmit} style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          alignItems: 'center',
          background: 'rgba(253, 246, 227, 0.98)',
          padding: '32px',
          borderRadius: '24px',
          border: '2px solid #e8e6e0',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)',
          minWidth: '400px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
            <h1 style={{
              color: '#1e293b',
              fontSize: '32px',
              fontWeight: '700',
              margin: '0 0 8px 0',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
              letterSpacing: '-0.5px'
            }}>
              🍔 Food Chain Explorer
            </h1>
            <p style={{
              color: '#475569',
              fontSize: '16px',
              margin: '0 auto',
              lineHeight: '1.6',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
              maxWidth: '500px',
              padding: '0 16px'
            }}>
              AI analyzes your cravings, finds nearby food options, and creates a chain of choices. Discover real locations where you can satisfy your hunger!
            </p>
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you craving? (e.g., burger, pizza, tacos)"
            disabled={isLoading || isLocationLoading}
            style={{
              width: '100%',
              padding: '20px 24px',
              fontSize: '18px',
              background: (isLoading || isLocationLoading) ? '#f8fafc' : '#ffffff',
              border: '3px solid #d1d5db',
              borderRadius: '16px',
              outline: 'none',
              color: (isLoading || isLocationLoading) ? '#9ca3af' : '#111827',
              cursor: (isLoading || isLocationLoading) ? 'not-allowed' : 'text',
              transition: 'all 0.2s ease',
              boxShadow: '0 4px 8px rgba(0, 0, 0, 0.08)',
              fontWeight: '500',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || isLocationLoading || !query.trim()}
            style={{
              padding: '20px 36px',
              fontSize: '18px',
              fontWeight: '700',
              background: (isLoading || isLocationLoading) ? '#9ca3af' : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '18px',
              cursor: (isLoading || isLocationLoading) ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '220px',
              opacity: (isLoading || isLocationLoading) ? 0.7 : 1,
              boxShadow: '0 6px 16px rgba(249, 115, 22, 0.4)',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
              letterSpacing: '0.5px'
            }}
          >
            {(isLoading || isLocationLoading) ? '🔍 Finding your perfect meal...' : 'Explore Food Chain'}
          </button>
        </form>
      )}

      {/* Location Permission Request - Show when permission is needed */}
      {locationPermission === 'prompt' && (
        <div style={{
          background: 'rgba(253, 246, 227, 0.98)',
          color: '#c2410c',
          padding: '36px',
          borderRadius: '24px',
          marginBottom: '20px',
          border: '3px solid #fed7aa',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>📍</div>
          <h3 style={{ marginBottom: '12px', fontSize: '18px' }}>Location Access Required</h3>
          <p style={{ marginBottom: '20px', fontSize: '14px', opacity: 0.9, lineHeight: '1.5' }}>
            To find nearby food options, we need access to your location. 
            This helps us show you restaurants and stores that are actually close to you.
          </p>
          <button
            onClick={requestLocationPermission}
            disabled={isLocationLoading}
            style={{
              padding: '16px 32px',
              fontSize: '16px',
              fontWeight: '600',
              background: isLocationLoading 
                ? '#94a3b8' 
                : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '16px',
              cursor: isLocationLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '200px',
              opacity: isLocationLoading ? 0.6 : 1,
              boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
            }}
            onMouseEnter={(e) => {
              if (!isLocationLoading) {
                e.currentTarget.style.transform = 'translateY(-2px)'
                e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)'
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            {isLocationLoading ? '⏳ Getting Location...' : '📍 Turn On Location'}
          </button>
        </div>
      )}
    </div>
  )
}

export default SearchInput
