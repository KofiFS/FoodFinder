# Google Places API Setup Guide

To get real nearby store locations and accurate directions, you need to set up Google Places API. Follow these steps:

## 1. Get Google Places API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Places API
   - Maps JavaScript API
   - Geocoding API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

## 2. Configure the API Key

### Option A: Environment Variable
Create a `.env` file in the root directory:
```
REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
```

### Option B: Direct Configuration
Update `src/services/googlePlacesService.ts`:
```typescript
private readonly apiKey: string = 'YOUR_ACTUAL_API_KEY_HERE'
```

## 3. Load Google Maps in Your App

Add this to your `public/index.html` (replace YOUR_API_KEY):
```html
<script async defer 
  src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places">
</script>
```

Or load dynamically in your app:
```typescript
import { loadGoogleMapsAPI } from './services/googlePlacesService'

// In your main component
useEffect(() => {
  loadGoogleMapsAPI('YOUR_API_KEY')
    .then(() => console.log('Google Maps loaded'))
    .catch(error => console.error('Failed to load Google Maps:', error))
}, [])
```

## 4. API Pricing

- **Free tier**: 2,500 requests per month
- **Paid tier**: $0.017 per request (Place Search)
- **Monthly billing**: Only charged for usage above free tier

## 5. Fallback Behavior

If Google Places API is not configured or fails:
- App uses OpenStreetMap Nominatim API as fallback
- Shows "None nearby" when no locations found
- Provides general search instead of specific directions

## 6. Testing

1. Allow location access when prompted
2. Search for a food item (e.g., "burger")
3. Click "Get Directions" on any food card
4. Should show actual nearby locations with real distances
5. Directions should lead to actual store locations

## 7. Troubleshooting

### "None nearby" showing for everything:
- Check API key is correct and has Places API enabled
- Verify your location is accurate
- Try increasing search radius in `locationService.ts`

### Directions leading nowhere:
- Ensure Geocoding API is enabled
- Check place_id is being returned correctly
- Verify coordinates are accurate

### API errors in console:
- Check API key restrictions and permissions
- Ensure billing is enabled for your Google Cloud project
- Verify daily/monthly quotas aren't exceeded

## 8. Security Best Practices

1. **Restrict API key** to your specific domain(s)
2. **Set quotas** to prevent unexpected charges
3. **Monitor usage** in Google Cloud Console
4. **Use environment variables** instead of hardcoding keys
5. **Enable only needed APIs** to minimize attack surface

## Example Working Configuration

```typescript
// In .env file
REACT_APP_GOOGLE_PLACES_API_KEY=AIzaSyC4R6AN7SmxxdDjMHBVVW6g7hr...

// In your component
const apiKey = process.env.REACT_APP_GOOGLE_PLACES_API_KEY
if (apiKey) {
  loadGoogleMapsAPI(apiKey)
}
```

Once configured, the app will show real nearby locations with accurate distances and provide actual directions to existing stores!
