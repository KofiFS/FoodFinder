# Google Places API Setup

## Overview
This app now uses Google Places API to provide **real restaurant recommendations** instead of generic suggestions. Users will see actual restaurant names like "Starbucks", "Olive Garden", "Local Coffee Shop on Main St" instead of generic "Local Bakery".

## How It Works

### 1. AI Analysis
- User enters a craving (e.g., "coffee", "pizza", "burgers")
- OpenAI analyzes the craving and suggests restaurant types
- AI generates search keywords for Google Places API

### 2. Google Places API Integration
- Uses AI-generated keywords to search for real restaurants
- Finds actual establishments with names, addresses, ratings
- Filters for restaurants (excludes grocery stores)
- Gets detailed info: phone, website, hours, reviews

### 3. Real Restaurant Display
- Shows actual restaurant names (e.g., "Starbucks", "Panera Bread")
- Displays real addresses and ratings
- Includes phone numbers and websites when available
- Shows "Open Now" status

## Required API Keys

### 1. OpenAI API Key
```bash
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

### 2. Google Places API Key
```bash
VITE_GOOGLE_PLACES_API_KEY=your_google_places_api_key_here
```

### 3. Google Maps API Key (for map loading)
```bash
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
```

## Environment Variables
Create a `.env` file in the root directory:

```env
VITE_OPENAI_API_KEY=sk-your_openai_key_here
VITE_GOOGLE_PLACES_API_KEY=your_google_places_key_here
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_key_here
```

## Google Places API Setup

### 1. Enable APIs in Google Cloud Console
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create a new project or select existing one
- Enable these APIs:
  - **Places API** (for restaurant search)
  - **Maps JavaScript API** (for map loading)
  - **Geocoding API** (for address lookup)

### 2. Create API Key
- Go to "Credentials" in Google Cloud Console
- Click "Create Credentials" → "API Key"
- Copy the generated API key

### 3. Restrict API Key (Recommended)
- Click on your API key
- Under "Application restrictions", select "HTTP referrers"
- Add your domain (e.g., `localhost:5173/*` for development)
- Under "API restrictions", select "Restrict key"
- Choose only the APIs you need

## Features

### Real Restaurant Data
- ✅ **Actual restaurant names** (not generic types)
- ✅ **Real addresses** with street names
- ✅ **Phone numbers** when available
- ✅ **Website URLs** for direct access
- ✅ **Ratings and reviews** from Google
- ✅ **Open/Closed status** in real-time
- ✅ **Price levels** ($, $$, $$$, $$$$)

### Smart Search
- ✅ **AI-powered keyword generation** for better search results
- ✅ **Restaurant type filtering** (excludes grocery stores)
- ✅ **Distance-based sorting** (closer restaurants first)
- ✅ **Rating-based relevance** (higher rated places prioritized)
- ✅ **Multiple search strategies** for comprehensive results

### User Experience
- ✅ **Direct Google Maps integration** with place IDs
- ✅ **One-click restaurant discovery**
- ✅ **Real-time availability** (open/closed status)
- ✅ **Contact information** (phone, website)
- ✅ **Location-based recommendations**

## Example Results

**Before (Generic):**
- "Local Bakery"
- "Italian Restaurant"
- "Coffee Shop"

**After (Real):**
- "Panera Bread - 123 Main St"
- "Olive Garden - 456 Oak Ave"
- "Starbucks - 789 Pine Blvd"

## Troubleshooting

### API Key Issues
- Ensure all environment variables are set
- Check API key restrictions in Google Cloud Console
- Verify APIs are enabled for your project

### No Results
- Check if Google Places API is enabled
- Verify API key has proper permissions
- Check browser console for error messages

### Rate Limiting
- Google Places API has quotas
- Consider implementing caching for repeated searches
- Monitor API usage in Google Cloud Console

## Development Notes

- The app falls back to AI-only recommendations if Google Places API fails
- All restaurant data is fetched in real-time
- Results are cached during the session for better performance
- Distance calculations use Haversine formula for accuracy
