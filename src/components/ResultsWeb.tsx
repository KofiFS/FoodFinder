import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled from 'styled-components';
import { FoodOption } from '../types/food';
import FoodCard from './FoodCard';

const WebContainer = styled.div`
  position: relative;
  width: 100%;
  height: 1000px;
  margin-top: 80px;
  overflow: hidden;
  cursor: grab;
  
  &:active {
    cursor: grabbing;
  }
  
  @media (max-width: 768px) {
    height: 800px;
    margin-top: 60px;
  }
`;

const DraggableArea = styled.div<{ isDragging: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 200%;
  height: 200%;
  transform-origin: center;
  cursor: ${props => props.isDragging ? 'grabbing' : 'grab'};
  transition: ${props => props.isDragging ? 'none' : 'transform 0.1s ease'};
`;

const CenterNode = styled.div<{ isSelected: boolean; scale: number }>`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%) scale(${props => props.scale});
  width: 160px;
  height: 160px;
  background: ${props => props.isSelected 
    ? 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)' 
    : 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)'};
  color: ${props => props.isSelected ? '#1a1a1a' : '#ffffff'};
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 14px;
  text-align: center;
  box-shadow: ${props => props.isSelected 
    ? '0 20px 60px rgba(255,255,255,0.6), inset 0 0 20px rgba(0,0,0,0.1)' 
    : '0 20px 60px rgba(255,255,255,0.3), inset 0 0 20px rgba(255,255,255,0.1)'};
  z-index: 15;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border: 4px solid ${props => props.isSelected ? '#666' : 'rgba(255,255,255,0.6)'};
  padding: 20px;
  line-height: 1.2;
  backdrop-filter: blur(10px);
  
  &:hover {
    transform: translate(-50%, -50%) scale(${props => props.scale * 1.1});
    box-shadow: ${props => props.isSelected 
      ? '0 25px 70px rgba(255,255,255,0.7), inset 0 0 30px rgba(0,0,0,0.15)' 
      : '0 25px 70px rgba(255,255,255,0.4), inset 0 0 30px rgba(255,255,255,0.15)'};
    border-color: ${props => props.isSelected ? '#999' : 'rgba(255,255,255,0.8)'};
  }
  
  &:active {
    transform: translate(-50%, -50%) scale(${props => props.scale * 0.95});
  }
  
  @media (max-width: 768px) {
    width: 130px;
    height: 130px;
    font-size: 12px;
    padding: 15px;
  }
`;

const CenterNodeIcon = styled.span`
  font-size: 22px;
  margin-bottom: 6px;
  display: block;
  
  @media (max-width: 768px) {
    font-size: 18px;
  }
`;

const CenterNodeText = styled.div`
  font-size: 12px;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    font-size: 11px;
  }
`;

const WebSection = styled.div<{ 
  position: 'left' | 'right' | 'top' | 'bottom';
  scale: number;
  offsetX: number;
  offsetY: number;
}>`
  position: absolute;
  transform: scale(${props => props.scale}) translate(${props => props.offsetX}px, ${props => props.offsetY}px);
  ${props => {
    switch (props.position) {
      case 'left':
        return 'left: 2%; top: 50%; transform: translateY(-50%) scale(' + props.scale + ') translate(' + props.offsetX + 'px, ' + props.offsetY + 'px);';
      case 'right':
        return 'right: 2%; top: 50%; transform: translateY(-50%) scale(' + props.scale + ') translate(' + props.offsetX + 'px, ' + props.offsetY + 'px);';
      case 'top':
        return 'top: 2%; left: 50%; transform: translateX(-50%) scale(' + props.scale + ') translate(' + props.offsetX + 'px, ' + props.offsetY + 'px);';
      case 'bottom':
        return 'bottom: 2%; left: 50%; transform: translateX(-50%) scale(' + props.scale + ') translate(' + props.offsetX + 'px, ' + props.offsetY + 'px);';
      default:
        return '';
    }
  }}
  
  @media (max-width: 768px) {
    ${props => {
      switch (props.position) {
        case 'left':
          return 'left: 1%;';
        case 'right':
          return 'right: 1%;';
        case 'top':
          return 'top: 1%;';
        case 'bottom':
          return 'bottom: 1%;';
        default:
          return '';
      }
    }}
  }
`;

const SectionTitle = styled.h3<{ position: 'left' | 'right' | 'top' | 'bottom' }>`
  color: white;
  text-align: center;
  margin-bottom: 40px;
  font-size: 1.5rem;
  font-weight: 600;
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  letter-spacing: 0.5px;
  ${props => {
    switch (props.position) {
      case 'left':
        return 'text-align: right;';
      case 'right':
        return 'text-align: left;';
      case 'top':
        return 'text-align: center;';
      case 'bottom':
        return 'text-align: center;';
      default:
        return 'text-align: center;';
    }
  }}
  
  @media (max-width: 768px) {
    font-size: 1.3rem;
    margin-bottom: 30px;
  }
`;

const CardsContainer = styled.div<{ 
  position: 'left' | 'right' | 'top' | 'bottom';
  scale: number;
}>`
  display: flex;
  flex-direction: ${props => props.position === 'left' || props.position === 'right' ? 'column' : 'row'};
  gap: 40px;
  flex-wrap: wrap;
  justify-content: ${props => {
    switch (props.position) {
      case 'left':
        return 'flex-end';
      case 'right':
        return 'flex-start';
      case 'top':
        return 'center';
      case 'bottom':
        return 'center';
      default:
        return 'center';
    }
  }};
  max-width: ${props => props.position === 'left' || props.position === 'right' ? '280px' : '800px'};
  transform: scale(${props => props.scale});
  
  @media (max-width: 768px) {
    gap: 30px;
    max-width: ${props => props.position === 'left' || props.position === 'right' ? '220px' : '600px'};
  }
`;

const ConnectionLine = styled.div<{ 
  startX: number; 
  startY: number; 
  endX: number; 
  endY: number;
  isActive: boolean;
  scale: number;
}>`
  position: absolute;
  top: ${props => props.startY}px;
  left: ${props => props.startX}px;
  width: ${props => Math.sqrt(Math.pow(props.endX - props.startX, 2) + Math.pow(props.endY - props.startY, 2))}px;
  height: 4px;
  background: ${props => props.isActive 
    ? 'linear-gradient(90deg, rgba(255,255,255,0.9), rgba(255,255,255,0.6), rgba(255,255,255,0.9))' 
    : 'linear-gradient(90deg, rgba(255,255,255,0.4), rgba(255,255,255,0.2), rgba(255,255,255,0.4))'};
  transform-origin: left center;
  transform: ${props => {
    const angle = Math.atan2(props.endY - props.startY, props.endX - props.startX);
    return `rotate(${angle}rad)`;
  }};
  z-index: 5;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 2px;
  box-shadow: ${props => props.isActive 
    ? '0 0 15px rgba(255,255,255,0.5)' 
    : '0 0 8px rgba(255,255,255,0.2)'};
  
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: -6px;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: ${props => props.isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'};
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(255,255,255,0.6);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    right: -6px;
    transform: translateY(-50%);
    width: 12px;
    height: 12px;
    background: ${props => props.isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'};
    border-radius: 50%;
    box-shadow: 0 0 12px rgba(255,255,255,0.6);
  }
`;

const Instructions = styled.div`
  position: absolute;
  top: -60px;
  left: 50%;
  transform: translateX(-50%);
  color: rgba(255, 255, 255, 0.8);
  font-size: 1.1rem;
  font-weight: 400;
  text-align: center;
  letter-spacing: 0.5px;
  background: rgba(0, 0, 0, 0.3);
  padding: 15px 30px;
  border-radius: 20px;
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  z-index: 20;
  
  @media (max-width: 768px) {
    top: -50px;
    font-size: 1rem;
    padding: 12px 25px;
  }
`;

const ZoomControls = styled.div`
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  gap: 10px;
  z-index: 20;
`;

const ZoomButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  padding: 8px 12px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 18px;
  backdrop-filter: blur(10px);
  transition: all 0.3s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    border-color: rgba(255, 255, 255, 0.6);
  }
`;

interface Position {
  x: number;
  y: number;
}

interface SectionState {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface ResultsWebProps {
  foodOptions: FoodOption[];
}

const ResultsWeb: React.FC<ResultsWebProps> = ({ foodOptions }) => {
  const [selectedBaseOption, setSelectedBaseOption] = useState<FoodOption | null>(null);
  const [hoveredOption, setHoveredOption] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [sectionStates, setSectionStates] = useState<Record<string, SectionState>>({
    left: { scale: 1, offsetX: 0, offsetY: 0 },
    right: { scale: 1, offsetX: 0, offsetY: 0 },
    top: { scale: 1, offsetX: 0, offsetY: 0 },
    bottom: { scale: 1, offsetX: 0, offsetY: 0 }
  });

  const containerRef = useRef<HTMLDivElement>(null);

  // Categorize food options by price range
  const lowPriceOptions = foodOptions.filter(option => option.priceRange === 'Low');
  const mediumPriceOptions = foodOptions.filter(option => option.priceRange === 'Medium');
  const highPriceOptions = foodOptions.filter(option => option.priceRange === 'High');

  // Get the search query from the first option (assuming they all have the same base query)
  const searchQuery = foodOptions[0]?.category || 'Food';

  // Collision detection and automatic positioning - ONLY when not dragging
  const detectCollisions = useCallback(() => {
    // Skip collision detection while actively dragging
    if (isDragging) return;
    
    const newStates = { ...sectionStates };
    let hasCollisions = false;

    // Check for collisions between sections
    const sections = ['left', 'right', 'top', 'bottom'];
    
    for (let i = 0; i < sections.length; i++) {
      for (let j = i + 1; j < sections.length; j++) {
        const section1 = sections[i];
        const section2 = sections[j];
        
        // Calculate distance between sections
        const distance = Math.sqrt(
          Math.pow(newStates[section1].offsetX - newStates[section2].offsetX, 2) +
          Math.pow(newStates[section1].offsetY - newStates[section2].offsetY, 2)
        );
        
        // If sections are too close, adjust their positions
        if (distance < 300) {
          hasCollisions = true;
          const angle = Math.atan2(
            newStates[section2].offsetY - newStates[section1].offsetY,
            newStates[section2].offsetX - newStates[section1].offsetX
          );
          
          // Move sections apart
          const moveDistance = 350 - distance;
          newStates[section1].offsetX -= Math.cos(angle) * moveDistance * 0.5;
          newStates[section1].offsetY -= Math.sin(angle) * moveDistance * 0.5;
          newStates[section2].offsetX += Math.cos(angle) * moveDistance * 0.5;
          newStates[section2].offsetY += Math.sin(angle) * moveDistance * 0.5;
        }
      }
    }

    // Adjust scales based on density
    sections.forEach(section => {
      const cardCount = section === 'left' || section === 'right' ? 
        (section === 'left' ? lowPriceOptions.length : highPriceOptions.length) :
        (section === 'top' ? mediumPriceOptions.length : foodOptions.length);
      
      if (cardCount > 2) {
        newStates[section].scale = Math.max(0.8, 1 - (cardCount - 2) * 0.1);
      } else {
        newStates[section].scale = 1;
      }
    });

    if (hasCollisions) {
      setSectionStates(newStates);
    }
  }, [sectionStates, lowPriceOptions.length, mediumPriceOptions.length, highPriceOptions.length, foodOptions.length, isDragging]);

  // Run collision detection when food options change
  useEffect(() => {
    detectCollisions();
  }, [foodOptions, detectCollisions]);

  // Auto-select a base option when food options are loaded
  useEffect(() => {
    if (foodOptions.length > 0 && !selectedBaseOption) {
      // Select the first medium price option, or fallback to any option
      const defaultOption = mediumPriceOptions[0] || foodOptions[0];
      setSelectedBaseOption(defaultOption);
    }
  }, [foodOptions, selectedBaseOption, mediumPriceOptions]);

  const handleCenterNodeClick = () => {
    if (foodOptions.length > 0) {
      const baseOption = foodOptions[Math.floor(Math.random() * foodOptions.length)];
      setSelectedBaseOption(baseOption);
    }
  };

  const handleOptionHover = (optionId: string) => {
    setHoveredOption(optionId);
  };

  const handleOptionLeave = () => {
    setHoveredOption(null);
  };

  // Dragging functionality - FIXED to maintain cumulative offset
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;
      // Add to existing offset instead of replacing it
      setDragOffset(prev => ({ 
        x: prev.x + deltaX, 
        y: prev.y + deltaY 
      }));
      // Update drag start to current position for smooth continuous dragging
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    // Keep the drag offset - don't reset anything
  };

  // Zoom functionality
  const handleZoomIn = () => setZoom(prev => Math.min(prev * 1.2, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev / 1.2, 0.5));

  // Calculate connection line positions with proper coordinates
  const getConnectionLine = (position: string) => {
    // Use actual pixel coordinates relative to the container
    const centerX = 400; // Center of 800px wide container
    const centerY = 500; // Center of 1000px tall container
    
    let endX, endY;
    switch (position) {
      case 'left':
        endX = 100;  // Left section position
        endY = 500;
        break;
      case 'right':
        endX = 700;  // Right section position
        endY = 500;
        break;
      case 'top':
        endX = 400;
        endY = 100;  // Top section position
        break;
      case 'bottom':
        endX = 400;
        endY = 900;  // Bottom section position
        break;
      default:
        endX = 400;
        endY = 500;
    }
    
    return { startX: centerX, startY: centerY, endX, endY };
  };

  return (
    <WebContainer 
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <Instructions>
        {selectedBaseOption 
          ? `Selected: ${selectedBaseOption.name}` 
          : 'Click the center to select a base option • Drag to move around • Use zoom controls'
        }
      </Instructions>

      <ZoomControls>
        <ZoomButton onClick={handleZoomOut}>−</ZoomButton>
        <ZoomButton onClick={handleZoomIn}>+</ZoomButton>
      </ZoomControls>
      
      <DraggableArea 
        isDragging={isDragging}
        style={{
          transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${zoom})`
        }}
      >
        <CenterNode 
          isSelected={!!selectedBaseOption}
          onClick={handleCenterNodeClick}
          scale={1}
        >
          <CenterNodeIcon>🍔</CenterNodeIcon>
          <CenterNodeText>
            {selectedBaseOption ? selectedBaseOption.name : searchQuery}
          </CenterNodeText>
        </CenterNode>
        
        {/* Connection lines - Always visible for better visual structure */}
        <ConnectionLine 
          {...getConnectionLine('left')} 
          isActive={!!selectedBaseOption}
          scale={1}
        />
        <ConnectionLine 
          {...getConnectionLine('right')} 
          isActive={!!selectedBaseOption}
          scale={1}
        />
        <ConnectionLine 
          {...getConnectionLine('top')} 
          isActive={!!selectedBaseOption}
          scale={1}
        />
        <ConnectionLine 
          {...getConnectionLine('bottom')} 
          isActive={!!selectedBaseOption}
          scale={1}
        />
        
        {/* Left side - Cheaper options */}
        <WebSection 
          position="left"
          scale={sectionStates.left.scale}
          offsetX={sectionStates.left.offsetX}
          offsetY={sectionStates.left.offsetY}
        >
          <SectionTitle position="left">Budget Options</SectionTitle>
          <CardsContainer position="left" scale={1}>
            {lowPriceOptions.slice(0, 3).map((option) => (
              <FoodCard 
                key={option.id} 
                foodOption={option} 
                onHover={handleOptionHover}
                onLeave={handleOptionLeave}
                isHovered={hoveredOption === option.id}
              />
            ))}
          </CardsContainer>
        </WebSection>

        {/* Right side - More expensive options */}
        <WebSection 
          position="right"
          scale={sectionStates.right.scale}
          offsetX={sectionStates.right.offsetX}
          offsetY={sectionStates.right.offsetY}
        >
          <SectionTitle position="right">Premium Options</SectionTitle>
          <CardsContainer position="right" scale={1}>
            {highPriceOptions.slice(0, 3).map((option) => (
              <FoodCard 
                key={option.id} 
                foodOption={option} 
                onHover={handleOptionHover}
                onLeave={handleOptionLeave}
                isHovered={hoveredOption === option.id}
              />
            ))}
          </CardsContainer>
        </WebSection>

        {/* Top section - Medium price options */}
        <WebSection 
          position="top"
          scale={sectionStates.top.scale}
          offsetX={sectionStates.top.offsetX}
          offsetY={sectionStates.top.offsetY}
        >
          <SectionTitle position="top">Mid-Range Options</SectionTitle>
          <CardsContainer position="top" scale={1}>
            {mediumPriceOptions.slice(0, 4).map((option) => (
              <FoodCard 
                key={option.id} 
                foodOption={option} 
                onHover={handleOptionHover}
                onLeave={handleOptionLeave}
                isHovered={hoveredOption === option.id}
              />
            ))}
          </CardsContainer>
        </WebSection>

        {/* Bottom section - Additional options */}
        <WebSection 
          position="bottom"
          scale={sectionStates.bottom.scale}
          offsetX={sectionStates.bottom.offsetX}
          offsetY={sectionStates.bottom.offsetY}
        >
          <SectionTitle position="bottom">More Choices</SectionTitle>
          <CardsContainer position="bottom" scale={1}>
            {foodOptions.slice(0, 4).map((option) => (
              <FoodCard 
                key={option.id} 
                foodOption={option} 
                onHover={handleOptionHover}
                onLeave={handleOptionLeave}
                isHovered={hoveredOption === option.id}
              />
            ))}
          </CardsContainer>
        </WebSection>
      </DraggableArea>
    </WebContainer>
  );
};

export default ResultsWeb;
