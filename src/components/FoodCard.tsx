import React from 'react';
import styled from 'styled-components';
import { FoodOption } from '../types/food';

const Card = styled.div<{ isHovered: boolean }>`
  background: ${props => props.isHovered 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(255, 255, 255, 0.05)'};
  border-radius: 20px;
  padding: 25px;
  box-shadow: ${props => props.isHovered 
    ? '0 12px 40px rgba(255,255,255,0.2)' 
    : '0 8px 25px rgba(255,255,255,0.1)'};
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  min-width: 220px;
  max-width: 240px;
  border: 2px solid ${props => props.isHovered ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.4)'};
  position: relative;
  overflow: hidden;
  backdrop-filter: blur(10px);
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, #4CAF50, #2196F3, #FF9800);
    transform: scaleX(0);
    transition: transform 0.3s ease;
  }
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 50px rgba(255,255,255,0.3);
    border-color: rgba(255,255,255,0.9);
    background: rgba(255, 255, 255, 0.15);
    
    &::before {
      transform: scaleX(1);
    }
  }
  
  @media (max-width: 768px) {
    min-width: 200px;
    max-width: 220px;
    padding: 20px;
  }
`;

const TypeBadge = styled.span<{ type: string }>`
  display: inline-block;
  padding: 8px 14px;
  border-radius: 20px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  margin-bottom: 16px;
  letter-spacing: 0.5px;
  background: ${props => {
    switch (props.type) {
      case 'Make':
        return 'linear-gradient(135deg, #4CAF50, #45a049)';
      case 'Premade':
        return 'linear-gradient(135deg, #2196F3, #1976D2)';
      case 'Prepared':
        return 'linear-gradient(135deg, #FF9800, #F57C00)';
      default:
        return 'linear-gradient(135deg, #9E9E9E, #757575)';
    }
  }};
  color: white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
`;

const FoodName = styled.h4`
  margin: 0 0 16px 0;
  font-size: 18px;
  font-weight: 700;
  color: white;
  line-height: 1.4;
  letter-spacing: 0.3px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
`;

const Location = styled.p`
  margin: 0 0 16px 0;
  font-size: 14px;
  color: rgba(255, 255, 255, 0.8);
  font-weight: 500;
  line-height: 1.3;
`;

const Price = styled.div`
  font-size: 22px;
  font-weight: 800;
  color: #4CAF50;
  margin-bottom: 12px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.8);
`;

const PriceRange = styled.span<{ range: string }>`
  font-size: 11px;
  padding: 6px 10px;
  border-radius: 12px;
  background: ${props => {
    switch (props.range) {
      case 'Low':
        return 'linear-gradient(135deg, #4CAF50, #45a049)';
      case 'Medium':
        return 'linear-gradient(135deg, #FF9800, #F57C00)';
      case 'High':
        return 'linear-gradient(135deg, #F44336, #D32F2F)';
      default:
        return 'linear-gradient(135deg, #9E9E9E, #757575)';
    }
  }};
  color: white;
  font-weight: 700;
  letter-spacing: 0.3px;
  box-shadow: 0 2px 6px rgba(0,0,0,0.15);
`;

const SourceContainer = styled.div`
  display: flex;
  align-items: center;
  margin-top: 16px;
  margin-bottom: 20px;
`;

const SourceIcon = styled.span`
  font-size: 20px;
  margin-right: 10px;
`;

const SourceText = styled.span`
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const StoreLink = styled.a`
  display: block;
  padding: 14px 18px;
  background: rgba(255, 255, 255, 0.1);
  color: white;
  text-decoration: none;
  border-radius: 12px;
  font-size: 13px;
  font-weight: 700;
  text-align: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  text-transform: uppercase;
  box-shadow: 0 4px 15px rgba(0,0,0,0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  backdrop-filter: blur(10px);
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(255,255,255,0.2);
    border-color: rgba(255, 255, 255, 0.6);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

interface FoodCardProps {
  foodOption: FoodOption;
  onHover: (optionId: string) => void;
  onLeave: () => void;
  isHovered: boolean;
}

const FoodCard: React.FC<FoodCardProps> = ({ 
  foodOption, 
  onHover, 
  onLeave, 
  isHovered 
}) => {
  const getSourceIcon = (source: string) => {
    switch (source) {
      case 'Restaurant':
        return '🍽️';
      case 'FastFood':
        return '🍔';
      case 'Grocery':
        return '🛒';
      case 'Home':
        return '🏠';
      default:
        return '🍴';
    }
  };

  const formatPrice = (price: number) => {
    return `$${price.toFixed(2)}`;
  };

  const getStoreLink = (source: string, location: string) => {
    switch (source) {
      case 'FastFood':
        return `https://www.google.com/search?q=${encodeURIComponent(location)}`;
      case 'Restaurant':
        return `https://www.google.com/search?q=${encodeURIComponent(location)}`;
      case 'Grocery':
        return `https://www.google.com/search?q=${encodeURIComponent(location)}`;
      default:
        return `https://www.google.com/search?q=${encodeURIComponent(location)}`;
    }
  };

  const handleClick = () => {
    const link = getStoreLink(foodOption.source, foodOption.location);
    window.open(link, '_blank');
  };

  return (
    <Card 
      isHovered={isHovered}
      onMouseEnter={() => onHover(foodOption.id)}
      onMouseLeave={onLeave}
      onClick={handleClick}
    >
      <TypeBadge type={foodOption.type}>
        {foodOption.type}
      </TypeBadge>
      
      <FoodName>{foodOption.name}</FoodName>
      
      <Location>{foodOption.location}</Location>
      
      <Price>{formatPrice(foodOption.price)}</Price>
      
      <PriceRange range={foodOption.priceRange}>
        {foodOption.priceRange}
      </PriceRange>
      
      <SourceContainer>
        <SourceIcon>{getSourceIcon(foodOption.source)}</SourceIcon>
        <SourceText>{foodOption.source}</SourceText>
      </SourceContainer>

      <StoreLink href={getStoreLink(foodOption.source, foodOption.location)} target="_blank">
        Visit Store
      </StoreLink>
    </Card>
  );
};

export default FoodCard;
