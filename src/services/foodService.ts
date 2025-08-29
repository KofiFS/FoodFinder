import { FoodOption, Location } from '../types/food';

// Mock data for development - replace with actual API calls
const mockFoodOptions: FoodOption[] = [
  {
    id: '1',
    name: 'Whopper',
    type: 'Prepared',
    price: 8.99,
    priceRange: 'Medium',
    location: 'Burger King',
    distance: 0.5,
    description: 'Classic flame-grilled beef burger',
    category: 'Burger',
    source: 'FastFood',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '2',
    name: 'Big Mac',
    type: 'Prepared',
    price: 7.49,
    priceRange: 'Medium',
    location: 'McDonald\'s',
    distance: 0.8,
    description: 'Two all-beef patties with special sauce',
    category: 'Burger',
    source: 'FastFood',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '3',
    name: 'Frozen Beef Patties',
    type: 'Make',
    price: 12.99,
    priceRange: 'Low',
    location: 'Walmart',
    distance: 1.2,
    description: 'Pack of 8 frozen beef patties',
    category: 'Burger',
    source: 'Grocery',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '4',
    name: 'Gourmet Burger',
    type: 'Prepared',
    price: 18.99,
    priceRange: 'High',
    location: 'The Burger Joint',
    distance: 1.5,
    description: 'Artisanal beef burger with premium toppings',
    category: 'Burger',
    source: 'Restaurant',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '5',
    name: 'Ground Beef',
    type: 'Make',
    price: 8.49,
    priceRange: 'Low',
    location: 'Kroger',
    distance: 1.0,
    description: '1 lb ground beef for homemade burgers',
    category: 'Burger',
    source: 'Grocery',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  },
  {
    id: '6',
    name: 'Luxury Burger',
    type: 'Prepared',
    price: 24.99,
    priceRange: 'High',
    location: 'Prime Steakhouse',
    distance: 2.1,
    description: 'Wagyu beef burger with truffle aioli',
    category: 'Burger',
    source: 'Restaurant',
    coordinates: { lat: 40.7128, lng: -74.0060 }
  }
];

// Function to search for food options using Claude API
async function searchWithClaude(query: string, location: Location | null): Promise<FoodOption[]> {
  // TODO: Implement Claude API integration
  // This would involve sending the query to Claude and parsing the response
  // For now, return mock data
  
  console.log('Searching with Claude for:', query, 'at location:', location);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return mockFoodOptions.filter(option => 
    option.name.toLowerCase().includes(query.toLowerCase()) ||
    option.category.toLowerCase().includes(query.toLowerCase())
  );
}

// Function to search for nearby locations using Google Places API
async function searchNearbyLocations(query: string, location: Location): Promise<any[]> {
  // TODO: Implement Google Places API integration
  // This would involve using the Google Places API to find nearby restaurants and stores
  
  console.log('Searching nearby locations for:', query, 'at:', location);
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return [];
}

// Main function to search for food options
export async function searchFoodOptions(query: string, location: Location | null): Promise<FoodOption[]> {
  try {
    // If we have location, search for nearby places
    if (location) {
      await searchNearbyLocations(query, location);
    }
    
    // Search with Claude for food options
    const foodOptions = await searchWithClaude(query, location);
    
    // Sort by price (cheaper options first)
    return foodOptions.sort((a, b) => a.price - b.price);
    
  } catch (error) {
    console.error('Error searching for food options:', error);
    // Return mock data as fallback
    return mockFoodOptions;
  }
}

// Function to get user's current location
export async function getCurrentLocation(): Promise<Location | null> {
  return new Promise((resolve) => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          resolve(null);
        }
      );
    } else {
      resolve(null);
    }
  });
}
