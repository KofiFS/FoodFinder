/**
 * Service to dynamically load Google Maps JavaScript API
 */

declare global {
  interface Window {
    google: any
  }
}

export class GoogleMapsLoader {
  private static instance: GoogleMapsLoader
  private isLoaded = false
  private isLoading = false
  private loadPromise: Promise<void> | null = null

  static getInstance(): GoogleMapsLoader {
    if (!GoogleMapsLoader.instance) {
      GoogleMapsLoader.instance = new GoogleMapsLoader()
    }
    return GoogleMapsLoader.instance
  }

  /**
   * Load Google Maps JavaScript API
   */
  async loadGoogleMaps(): Promise<void> {
    // If already loaded, return immediately
    if (this.isLoaded) {
      return Promise.resolve()
    }

    // If currently loading, return the existing promise
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise
    }

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_PLACES_API_KEY
    
    if (!apiKey || apiKey === 'YOUR_GOOGLE_API_KEY_HERE') {
      throw new Error('Google Places API key not configured. Please add VITE_GOOGLE_PLACES_API_KEY to your .env.local file.')
    }

    this.isLoading = true
    this.loadPromise = this.loadGoogleMapsScript(apiKey)
    
    try {
      await this.loadPromise
      this.isLoaded = true
      this.isLoading = false
      console.log('✅ Google Maps API loaded successfully')
    } catch (error) {
      this.isLoading = false
      this.loadPromise = null
      throw error
    }

    return this.loadPromise
  }

  /**
   * Load the Google Maps script tag
   */
  private loadGoogleMapsScript(apiKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // Check if already loaded
      if (window.google && window.google.maps) {
        resolve()
        return
      }

      // Create script element
      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`
      script.async = true
      script.defer = true

      // Handle script load
      script.onload = () => {
        // Wait a bit for Google Maps to initialize
        setTimeout(() => {
          if (window.google && window.google.maps) {
            resolve()
          } else {
            reject(new Error('Google Maps failed to initialize'))
          }
        }, 100)
      }

      // Handle script error
      script.onerror = () => {
        reject(new Error('Failed to load Google Maps script'))
      }

      // Add script to document
      document.head.appendChild(script)
    })
  }

  /**
   * Check if Google Maps is available
   */
  isGoogleMapsAvailable(): boolean {
    return !!(window.google && window.google.maps && window.google.maps.places)
  }

  /**
   * Get Google Maps instance
   */
  getGoogleMaps(): any {
    if (!this.isGoogleMapsAvailable()) {
      throw new Error('Google Maps not loaded. Call loadGoogleMaps() first.')
    }
    return window.google
  }
}

export default GoogleMapsLoader



