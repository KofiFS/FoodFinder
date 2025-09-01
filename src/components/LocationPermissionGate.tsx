import React, { useState, useEffect } from 'react'

interface LocationPermissionGateProps {
  children: React.ReactNode
}

const LocationPermissionGate: React.FC<LocationPermissionGateProps> = ({ children }) => {
  const [permissionState, setPermissionState] = useState<'checking' | 'granted' | 'denied' | 'unavailable'>('checking')
  const [isRequesting, setIsRequesting] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    checkLocationPermission()
  }, [])

  const checkLocationPermission = async () => {
    if (!navigator.geolocation) {
      setPermissionState('unavailable')
      return
    }

    try {
      // Check if permissions API is available
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({ name: 'geolocation' })
        
        if (permission.state === 'granted') {
          // Permission already granted, get location
          getCurrentLocation()
        } else if (permission.state === 'denied') {
          setPermissionState('denied')
        } else {
          // Permission not yet decided, show request prompt
          setPermissionState('denied') // Will show request button
        }
        
        // Listen for permission changes
        permission.onchange = () => {
          if (permission.state === 'granted') {
            getCurrentLocation()
          } else {
            setPermissionState('denied')
          }
        }
      } else {
        // Fallback for browsers without permissions API
        getCurrentLocation()
      }
    } catch (error) {
      console.error('Error checking location permission:', error)
      setPermissionState('denied')
    }
  }

  const getCurrentLocation = () => {
    setIsRequesting(true)
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setPermissionState('granted')
        setIsRequesting(false)
      },
      (error) => {
        console.error('Geolocation error:', error)
        setPermissionState('denied')
        setIsRequesting(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 300000 // 5 minutes
      }
    )
  }

  const requestPermission = () => {
    getCurrentLocation()
  }

  // Show loading state while checking permission
  if (permissionState === 'checking') {
    return (
             <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         width: '100vw',
         height: '100vh',
         background: 'linear-gradient(135deg, #fefefa 0%, #fde68a 100%)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 10000
       }}>
                 <div style={{
           textAlign: 'center',
           color: '#1e293b',
           maxWidth: '400px',
           padding: '40px'
         }}>
           <div style={{
             width: '60px',
             height: '60px',
             border: '4px solid rgba(249, 115, 22, 0.3)',
             borderTop: '4px solid #f97316',
             borderRadius: '50%',
             animation: 'spin 1s linear infinite',
             margin: '0 auto 30px'
           }} />
           <h2 style={{ margin: '0 0 16px 0', fontSize: '24px', fontWeight: '600', color: '#f97316' }}>
             🍔 Food Spider Web
           </h2>
           <p style={{ margin: 0, fontSize: '16px', color: '#64748b' }}>
             Checking location permissions...
           </p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      </div>
    )
  }

  // Show permission request if denied or unavailable
  if (permissionState === 'denied' || permissionState === 'unavailable') {
    return (
             <div style={{
         position: 'fixed',
         top: 0,
         left: 0,
         width: '100vw',
         height: '100vh',
         background: 'linear-gradient(135deg, #fefefa 0%, #fde68a 100%)',
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         zIndex: 10000,
         overflow: 'auto'
       }}>
        <div style={{
          background: 'rgba(254, 254, 250, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '3px solid #fde68a',
          borderRadius: '24px',
          padding: '40px',
          textAlign: 'center',
          color: '#1e293b',
          maxWidth: '500px',
          margin: '20px',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.08)'
        }}>
          <div style={{
            fontSize: '60px',
            marginBottom: '20px'
          }}>
            📍
          </div>
          
          <h1 style={{
            margin: '0 0 16px 0',
            fontSize: '28px',
            fontWeight: '700',
            color: '#f97316'
          }}>
            Location Required
          </h1>
          
          <p style={{
            margin: '0 0 24px 0',
            fontSize: '16px',
            lineHeight: '1.6',
            color: '#64748b'
          }}>
            Food Spider Web needs your location to find nearby restaurants and provide accurate directions. 
            Without location access, we can't show you relevant food options in your area.
          </p>

          {permissionState === 'unavailable' ? (
            <div style={{
              background: 'rgba(254, 226, 226, 0.8)',
              border: '2px solid #fecaca',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 8px 0', color: '#dc2626' }}>
                Location Not Available
              </h3>
              <p style={{ margin: 0, fontSize: '14px', color: '#7f1d1d' }}>
                Your browser doesn't support location services. Please use a modern browser 
                or enable location services in your device settings.
              </p>
            </div>
          ) : (
            <div style={{
              background: 'rgba(254, 243, 199, 0.8)',
              border: '2px solid #fde68a',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '24px'
            }}>
              <h3 style={{ margin: '0 0 12px 0', color: '#d97706' }}>
                Why We Need Location:
              </h3>
              <ul style={{ 
                margin: 0, 
                paddingLeft: '20px', 
                textAlign: 'left',
                fontSize: '14px',
                color: '#92400e'
              }}>
                <li>Find restaurants and stores near you</li>
                <li>Calculate accurate distances and travel times</li>
                <li>Show you relevant local food options</li>
              </ul>
            </div>
          )}

          {permissionState === 'denied' && (
            <button
              onClick={requestPermission}
              disabled={isRequesting}
              style={{
                background: isRequesting 
                  ? 'rgba(156, 163, 175, 0.5)' 
                  : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '12px',
                padding: '16px 32px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: isRequesting ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s ease',
                opacity: isRequesting ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                margin: '0 auto',
                boxShadow: isRequesting ? 'none' : '0 4px 15px rgba(249, 115, 22, 0.3)'
              }}
              onMouseEnter={(e) => {
                if (!isRequesting) {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)'
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = isRequesting ? 'none' : '0 4px 15px rgba(249, 115, 22, 0.3)'
              }}
            >
              {isRequesting ? (
                <>
                  <div style={{
                    width: '16px',
                    height: '16px',
                    border: '2px solid rgba(255, 255, 255, 0.3)',
                    borderTop: '2px solid white',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Getting Location...
                </>
              ) : (
                <>
                  📍
                  Enable Location Access
                </>
              )}
            </button>
          )}

          <p style={{
            margin: '24px 0 0 0',
            fontSize: '12px',
            color: '#94a3b8',
            lineHeight: '1.4'
          }}>
            Your location is only used to find nearby food options and is never stored or shared. 
            You can revoke this permission at any time in your browser settings.
          </p>
        </div>
      </div>
    )
  }

  // Permission granted, show the main app
  return <>{children}</>
}

export default LocationPermissionGate
