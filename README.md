# 🍔 Food Finder

A web application that helps users find food options across different price points and preparation methods. The app displays results in a spider web layout with cheaper options on the left and more expensive options on the right.

## Features

- **Smart Search**: Search for any food item and get comprehensive results
- **Spider Web Layout**: Results displayed in an intuitive web format
- **Price Categorization**: Options organized by price range (Low, Medium, High)
- **Preparation Types**: Categorized as Make, Premade, or Prepared
- **Location Awareness**: Uses your location to find nearby options
- **Multiple Sources**: Includes restaurants, fast food, grocery stores, and home cooking options

## Getting Started

### Prerequisites

- Node.js (version 14 or higher)
- npm or yarn

### Installation

1. Clone the repository
2. Navigate to the project directory:
   ```bash
   cd food-finder
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm start
   ```

The app will open in your browser at `http://localhost:3000`.

## API Integration

### Claude API Setup

To integrate with Claude API for intelligent food search:

1. Get your API key from [Anthropic](https://console.anthropic.com/)
2. Create a `.env` file in the root directory:
   ```
   REACT_APP_CLAUDE_API_KEY=your_api_key_here
   ```
3. Update the `searchWithClaude` function in `src/services/foodService.ts`

### Google Places API Setup

To integrate with Google Places API for location-based search:

1. Get your API key from [Google Cloud Console](https://console.cloud.google.com/)
2. Enable the Places API
3. Add to your `.env` file:
   ```
   REACT_APP_GOOGLE_PLACES_API_KEY=your_api_key_here
   ```
4. Update the `searchNearbyLocations` function in `src/services/foodService.ts`

## Project Structure

```
src/
├── components/
│   ├── FoodFinder.tsx      # Main application component
│   ├── SearchBox.tsx       # Search input component
│   ├── ResultsWeb.tsx      # Spider web results display
│   └── FoodCard.tsx        # Individual food option card
├── services/
│   └── foodService.ts      # API service functions
├── types/
│   └── food.ts             # TypeScript interfaces
└── App.tsx                 # Root component
```

## Usage

1. **Search**: Type what you want to eat in the search box (e.g., "burger from burger king")
2. **View Results**: Results are displayed in a spider web layout:
   - **Left**: Budget options (cheaper)
   - **Right**: Premium options (more expensive)
   - **Top**: Mid-range options
   - **Bottom**: Additional choices
3. **Filter by Type**: Each option shows whether it's Make, Premade, or Prepared
4. **Price Information**: Estimated prices and price ranges are clearly displayed

## Mobile App Conversion

This React web application is designed to be easily converted to a mobile app using:

- **React Native**: Direct code conversion
- **Capacitor**: Wrap the web app for mobile
- **Progressive Web App (PWA)**: Add service workers and manifest

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

This project is licensed under the MIT License.

## Future Enhancements

- [ ] Real-time price updates
- [ ] User reviews and ratings
- [ ] Dietary restrictions filtering
- [ ] Recipe suggestions for "Make" options
- [ ] Integration with food delivery services
- [ ] Social sharing features
