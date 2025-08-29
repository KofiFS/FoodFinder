import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import SearchBox from './SearchBox';
import ResultsWeb from './ResultsWeb';
import { FoodOption } from '../types/food';
import { searchFoodOptions } from '../services/foodService';

const FoodFinderContainer = styled.div`
  min-height: 100vh;
  background: transparent;
  padding: 40px 20px;
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  position: relative;
  z-index: 1;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 60px;
`;

const MainTitle = styled.h1`
  color: white;
  font-size: 3.5rem;
  font-weight: 300;
  letter-spacing: 3px;
  margin-bottom: 16px;
  text-shadow: 0 2px 10px rgba(0,0,0,0.8);
  
  @media (max-width: 768px) {
    font-size: 2.5rem;
    letter-spacing: 2px;
  }
  
  @media (max-width: 480px) {
    font-size: 2rem;
    letter-spacing: 1px;
  }
`;

const Subtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 300;
  letter-spacing: 1px;
  max-width: 600px;
  margin: 0 auto;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ContentArea = styled.div`
  position: relative;
  z-index: 2;
`;

const SelectedChoiceDisplay = styled.div`
  text-align: center;
  margin-bottom: 40px;
  padding: 30px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 20px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const SelectedChoiceTitle = styled.h2`
  color: white;
  font-size: 2rem;
  font-weight: 400;
  margin-bottom: 12px;
  letter-spacing: 1px;
`;

const SelectedChoiceSubtitle = styled.p`
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 300;
  margin-bottom: 20px;
`;

const ResetButton = styled.button`
  background: linear-gradient(135deg, #1a1a1a, #333);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 25px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  
  &:hover {
    background: linear-gradient(135deg, #333, #1a1a1a);
    border-color: rgba(255, 255, 255, 0.6);
    transform: translateY(-2px);
  }
`;

const FoodFinder: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [foodOptions, setFoodOptions] = useState<FoodOption[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    // Get user location on component mount
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to a fallback location if needed
        }
      );
    }
  }, []);

  const handleSearch = async (query: string) => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    setSearchQuery(query);
    setHasSearched(true);
    
    try {
      const options = await searchFoodOptions(query, userLocation);
      setFoodOptions(options);
    } catch (error) {
      console.error('Error searching for food options:', error);
      // You could add error handling UI here
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setFoodOptions([]);
    setHasSearched(false);
  };

  return (
    <FoodFinderContainer>
      <Header>
        <MainTitle>🍔 Food Finder</MainTitle>
        <Subtitle>
          Discover food options across different price points and preparation methods. 
          Find the perfect meal that fits your budget and preferences.
        </Subtitle>
      </Header>
      
      <ContentArea>
        {!hasSearched ? (
          <SearchBox onSearch={handleSearch} isLoading={isLoading} />
        ) : (
          <SelectedChoiceDisplay>
            <SelectedChoiceTitle>🍔 {searchQuery}</SelectedChoiceTitle>
            <SelectedChoiceSubtitle>
              Here are your food options organized by price and preparation method. 
              Click the center node to select a base option and explore the web.
            </SelectedChoiceSubtitle>
            <ResetButton onClick={handleReset}>
              Search for Something Else
            </ResetButton>
          </SelectedChoiceDisplay>
        )}
        
        {foodOptions.length > 0 && (
          <ResultsWeb foodOptions={foodOptions} />
        )}
      </ContentArea>
    </FoodFinderContainer>
  );
};

export default FoodFinder;
