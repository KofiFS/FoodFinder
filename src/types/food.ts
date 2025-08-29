export interface FoodOption {
  id: string;
  name: string;
  type: 'Make' | 'Premade' | 'Prepared';
  price: number;
  priceRange: 'Low' | 'Medium' | 'High';
  location: string;
  distance?: number;
  description: string;
  category: string;
  source: 'Restaurant' | 'FastFood' | 'Grocery' | 'Home';
  coordinates?: {
    lat: number;
    lng: number;
  };
}

export interface Location {
  lat: number;
  lng: number;
}
