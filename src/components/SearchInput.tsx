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
        
        // Use Food Chain Service to create complete food chain
        const foodChainResult = await FoodChainService.createFoodChain(query.trim(), userLocation)
        onSearch(query.trim(), foodChainResult)
      } catch (error) {
        console.error('Error creating food chain:', error)
        // Set error message to display above search bar
        setError(error instanceof Error ? error.message : 'Unable to create food chain at this time.')
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
      zIndex: 1000
    }}>
      <div style={{
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          🍔 Food Chain Explorer
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#888',
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          AI analyzes your cravings, finds nearby food options, and creates a chain of choices.
          Discover real locations where you can satisfy your hunger!
        </p>
      </div>

      {/* Debug Info */}
      <div style={{
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '16px 20px',
        borderRadius: '12px',
        marginBottom: '20px',
        fontSize: '14px',
        fontFamily: 'monospace',
        textAlign: 'center',
        maxWidth: '500px',
        margin: '0 auto 20px'
      }}>
        <div style={{ marginBottom: '12px' }}>
          Debug: isLoading={isLoading.toString()}, isLocationLoading={isLocationLoading.toString()}, locationPermission={locationPermission}
        </div>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px',
          flexWrap: 'wrap'
        }}>
          <button 
            onClick={() => setIsLocationLoading(!isLocationLoading)}
            style={{ 
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#555'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#333'
            }}
          >
            Toggle Location Loading
          </button>
          <button 
            onClick={() => onSearch('test', { foods: [], reasoning: '', nearbyLocations: [] })}
            style={{ 
              background: '#333',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '12px',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#555'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = '#333'
            }}
          >
            Test Search Loading
          </button>
        </div>
      </div>

      {/* Loading Screen */}
      {(isLoading || isLocationLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          backdropFilter: 'blur(10px)'
        }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            padding: '40px',
            borderRadius: '20px',
            textAlign: 'center',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(255, 255, 255, 0.3)',
              borderTop: '4px solid #4f46e5',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 20px'
            }}></div>
            <h2 style={{ color: 'white', marginBottom: '10px' }}>
              {isLocationLoading ? '📍 Getting Your Location...' : '🔍 Searching Food Chain'}
            </h2>
            <p style={{ color: '#ccc', fontSize: '16px' }}>
              {isLocationLoading 
                ? 'Please allow location access to find nearby food options...'
                : 'AI is analyzing your craving and finding nearby food options...'
              }
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
                    background: '#4f46e5',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#4f46e5',
                    animation: 'pulse 1.5s ease-in-out infinite 0.2s'
                  }}></div>
                  <div style={{
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    background: '#4f46e5',
                    animation: 'pulse 1.5s ease-in-out infinite 0.4s'
                  }}></div>
                </div>
                <div style={{
                  fontSize: '12px',
                  color: '#888',
                  textTransform: 'uppercase',
                  letterSpacing: '1px'
                }}>
                  Processing...
                </div>
              </div>
            )}
            <div style={{
              width: '200px',
              height: '4px',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '2px',
              margin: '20px auto 0',
              overflow: 'hidden'
            }}>
              <div style={{
                width: '30%',
                height: '100%',
                background: 'linear-gradient(90deg, #4f46e5, #7c3aed)',
                borderRadius: '2px',
                animation: 'loading 2s ease-in-out infinite'
              }}></div>
            </div>
          </div>
        </div>
      )}

      {/* Google Maps Status */}
      {googleMapsError && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.9)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 auto 20px'
        }}>
          🗺️ {googleMapsError}
        </div>
      )}

      {googleMapsLoaded && !googleMapsError && (
        <div style={{
          background: 'rgba(34, 197, 94, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(34, 197, 94, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 auto 20px'
        }}>
          🗺️ Google Maps loaded - Location services available
        </div>
      )}

      {/* Location Status */}
      {locationPermission === 'granted' && userLocation && (
        <div style={{
          background: 'rgba(16, 185, 129, 0.9)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 auto 20px'
        }}>
          📍 Location access granted - Ready to find nearby food!
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div style={{
          background: 'rgba(220, 38, 38, 0.9)',
          color: 'white',
          padding: '16px 24px',
          borderRadius: '12px',
          marginBottom: '20px',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          fontSize: '14px',
          lineHeight: '1.4',
          position: 'relative',
          margin: '0 auto 20px'
        }}>
          ⚠️ {error}
          <button
            onClick={() => setError(null)}
            style={{
              position: 'absolute',
              top: '8px',
              right: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: 'none',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              cursor: 'pointer',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>
      )}

      {/* Location Permission Status */}
      {locationPermission === 'checking' && (
        <div style={{
          background: 'rgba(59, 130, 246, 0.9)',
          color: 'white',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(59, 130, 246, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
          background: 'rgba(239, 68, 68, 0.9)',
          color: 'white',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              background: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.3)',
              borderRadius: '8px',
              cursor: 'pointer',
              transition: 'all 0.3s ease'
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
          gap: '12px',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.1)',
          padding: '24px',
          borderRadius: '20px',
          backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
          minWidth: '400px'
        }}>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are you craving? (e.g., burger, pizza, tacos)"
            disabled={isLoading}
            style={{
              flex: 1,
              padding: '16px 20px',
              fontSize: '16px',
              background: isLoading ? 'rgba(200, 200, 200, 0.9)' : 'rgba(255, 255, 255, 0.9)',
              border: 'none',
              borderRadius: '12px',
              outline: 'none',
              color: isLoading ? '#999' : '#333',
              cursor: isLoading ? 'not-allowed' : 'text'
            }}
          />
          <button
            type="submit"
            disabled={isLoading || !query.trim()}
            style={{
              padding: '16px 24px',
              fontSize: '16px',
              fontWeight: '600',
              background: isLoading ? '#666' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '120px',
              opacity: isLoading ? 0.7 : 1
            }}
          >
            {isLoading ? '🔍 Searching Food Chain...' : 'Explore Food Chain'}
          </button>
        </form>
      )}

      {/* Location Permission Request - Show when permission is needed */}
      {locationPermission === 'prompt' && (
        <div style={{
          background: 'rgba(245, 158, 11, 0.9)',
          color: 'white',
          padding: '24px',
          borderRadius: '20px',
          marginBottom: '20px',
          border: '1px solid rgba(245, 158, 11, 0.3)',
          backdropFilter: 'blur(10px)',
          maxWidth: '500px',
          textAlign: 'center',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
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
              padding: '14px 28px',
              fontSize: '16px',
              fontWeight: '600',
              background: isLocationLoading 
                ? 'rgba(100, 100, 100, 0.5)' 
                : 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              cursor: isLocationLoading ? 'not-allowed' : 'pointer',
              transition: 'all 0.3s ease',
              minWidth: '160px',
              opacity: isLocationLoading ? 0.6 : 1
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
