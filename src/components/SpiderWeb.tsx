import React, { useState, useRef, useEffect } from 'react'
import { FoodOption, Position } from '../types'
import FoodCard from './FoodCard'
import WebConnection from './WebConnection'
import NutritionPopup from './NutritionPopup'
import ComparisonModal from './ComparisonModal'
import SmartRestaurantDiscovery from './SmartRestaurantDiscovery'
import { SmartRestaurantService, RestaurantOption, SmartRestaurantResult } from '../services/smartRestaurantService'

interface SpiderWebProps {
  foodOptions: FoodOption[]
  selectedCenter: FoodOption | null
  onCenterChange: (option: FoodOption) => void
  searchQuery: string
  onReset: () => void
}

const SpiderWeb: React.FC<SpiderWebProps> = ({
  foodOptions,
  selectedCenter,
  onCenterChange,
  searchQuery,
  onReset
}) => {
  const [dragOffset, setDragOffset] = useState<Position>({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<Position>({ x: 0, y: 0 })
  const [isInteracting, setIsInteracting] = useState(false)
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [foodCardInteracting, setFoodCardInteracting] = useState(false)
  const [frozenPositions, setFrozenPositions] = useState<{ option: FoodOption; pos: Position }[] | null>(null)
  const [dragFrozenPositions, setDragFrozenPositions] = useState<{ option: FoodOption; pos: Position }[] | null>(null)
  const dragThresholdPx = 6
  const [scale, setScale] = useState(1)
  const [containerDimensions, setContainerDimensions] = useState({ width: window.innerWidth * 2, height: window.innerHeight * 2 })
  const [typeFilter, setTypeFilter] = useState<'All'>('All')
  const [typeOffset, setTypeOffset] = useState(0) // For showing different options of the same type

  const [selectedForComparison, setSelectedForComparison] = useState<Set<string>>(new Set())
  const [showComparison, setShowComparison] = useState(false)
  const [aiRecommendation, setAiRecommendation] = useState<string | null>(null)
  const [showRecommendationBox, setShowRecommendationBox] = useState(true)
  const [showNutritionPopup, setShowNutritionPopup] = useState(false)
  const [selectedNutritionOption, setSelectedNutritionOption] = useState<FoodOption | null>(null)
  const [showRestaurantDiscovery, setShowRestaurantDiscovery] = useState(false)
  const [selectedFoodForDiscovery, setSelectedFoodForDiscovery] = useState<string>('')
  const [selectedFoodOptionForDiscovery, setSelectedFoodOptionForDiscovery] = useState<FoodOption | null>(null)
  const [showDiscoveryModal, setShowDiscoveryModal] = useState(false)
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null)
  
  // Smart restaurant discovery states
  const [restaurantResults, setRestaurantResults] = useState<Map<string, SmartRestaurantResult>>(new Map())
  const [loadingRestaurants, setLoadingRestaurants] = useState<Set<string>>(new Set())
  const [showRestaurantResults, setShowRestaurantResults] = useState<Set<string>>(new Set())
  const containerRef = useRef<HTMLDivElement>(null)
  const smartRestaurantService = SmartRestaurantService.getInstance()

  // Update container dimensions on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setContainerDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        })
      } else {
        // Fallback to expanded viewport dimensions
        setContainerDimensions({
          width: window.innerWidth * 2,
          height: window.innerHeight * 2
        })
      }
    }

    updateDimensions()
    window.addEventListener('resize', updateDimensions)
    return () => window.removeEventListener('resize', updateDimensions)
  }, [])

  // Get user location on component mount
  useEffect(() => {
    getUserLocation()
  }, [])

  // Calculate positions for the spider web layout
  const centerPos: Position = { x: 50, y: 50 } // Center of viewport (percentage)
  
  // Filter options based on current type filter
  const getFilteredOptions = () => {
    // Since we removed type distinctions, always return all options
    // The typeFilter is now always 'All'
    return foodOptions
  }

  const filteredOptions = getFilteredOptions()
  
  // Categorize filtered options by both category and type
  const budgetOptions = filteredOptions.filter(option => option.category === 'Budget')
  const midRangeOptions = filteredOptions.filter(option => option.category === 'Mid-Range')
  const premiumOptions = filteredOptions.filter(option => option.category === 'Premium')
  


  // Apply offset for showing different sets of options
  const getOffsetOptions = (options: FoodOption[], maxCount: number) => {
    const startIndex = typeOffset * maxCount
    return options.slice(startIndex, startIndex + maxCount)
  }

  // Define section positions in concentric circles with varying distances - patterned to avoid overlaps
  const sectionPositions = {
    premium: { // Top section - arranged in 3 concentric arcs
      center: { x: 50, y: 10 },
      positions: [
        // Inner arc (closer to center)
        { x: 40, y: 15 }, { x: 50, y: 12 }, { x: 60, y: 15 },
        // Middle arc
        { x: 30, y: 8 }, { x: 50, y: 5 }, { x: 70, y: 8 },
        // Outer arc (furthest from center)
        { x: 20, y: 3 }, { x: 35, y: 1 }, { x: 65, y: 1 }, { x: 80, y: 3 },
        // Additional spread positions
        { x: 25, y: 12 }, { x: 75, y: 12 }
      ]
    },
    budget: { // Bottom section - arranged in 3 concentric arcs, avoiding center buttons
      center: { x: 50, y: 90 },
      positions: [
        // Inner arc (closer to center, but below buttons)
        { x: 30, y: 78 }, { x: 70, y: 78 },
        // Middle arc
        { x: 20, y: 85 }, { x: 40, y: 83 }, { x: 60, y: 83 }, { x: 80, y: 85 },
        // Outer arc (furthest)
        { x: 15, y: 92 }, { x: 35, y: 95 }, { x: 65, y: 95 }, { x: 85, y: 92 },
        // Edge positions
        { x: 10, y: 88 }, { x: 90, y: 88 }
      ]
    },

    midRange: { // Mid-range positions - 2 concentric rings around center
      center: { x: 50, y: 50 },
      positions: [
        // Inner ring (closer to center)
        { x: 35, y: 35 }, { x: 65, y: 35 }, { x: 30, y: 50 }, { x: 70, y: 50 },
        // Outer ring (further from center)
        { x: 25, y: 25 }, { x: 75, y: 25 }, { x: 20, y: 50 }, { x: 80, y: 50 }
        // No bottom positions to avoid button interference
      ]
    }
  }

  // Assign options to sections based on their properties (with offset rotation)
  const assignedOptions = [
    // Premium section (top)
    ...getOffsetOptions(premiumOptions, 8).map((option, i) => ({
      option,
      pos: sectionPositions.premium.positions[i] || sectionPositions.premium.center,
      section: 'premium'
    })),
    
    // Budget section (bottom)
    ...getOffsetOptions(budgetOptions, 8).map((option, i) => ({
      option,
      pos: sectionPositions.budget.positions[i] || sectionPositions.budget.center,
      section: 'budget'
    })),
    

    
    // Mid-range section (center area) - remaining mid-range options
    ...getOffsetOptions(midRangeOptions, 8).map((option, i) => ({
      option,
      pos: sectionPositions.midRange.positions[i] || sectionPositions.midRange.center,
      section: 'midRange'
    }))
  ]

  // Remove duplicates (in case an option appears in multiple categories)
  const uniqueAssignedOptions = assignedOptions.filter((item, index, self) => 
    index === self.findIndex(t => t.option.id === item.option.id)
  )

  // Collision detection and adjustment
  const adjustForCollisions = (options: typeof uniqueAssignedOptions) => {
    const cardWidth = 220 // Food card width in pixels
    const cardHeight = 200 // Food card height in pixels
    const minDistance = 350 // Increased minimum distance between card centers to prevent overlaps
    const maxIterations = 5 // More iterations to ensure all overlaps are resolved
    
    let adjustedOptions = [...options]
    
    // Convert percentage positions to pixels for collision detection
    const getPixelPosition = (pos: Position) => ({
      x: (pos.x / 100) * containerDimensions.width,
      y: (pos.y / 100) * containerDimensions.height
    })
    
    // Convert pixels back to percentage with better boundaries
    const getPercentagePosition = (pixelPos: { x: number, y: number }) => ({
      x: Math.max(8, Math.min(92, (pixelPos.x / containerDimensions.width) * 100)),
      y: Math.max(3, Math.min(97, (pixelPos.y / containerDimensions.height) * 100))
    })
    
    // Check if two positions overlap
    const checkCollision = (pos1: Position, pos2: Position) => {
      const pixel1 = getPixelPosition(pos1)
      const pixel2 = getPixelPosition(pos2)
      const distance = Math.sqrt(
        Math.pow(pixel2.x - pixel1.x, 2) + Math.pow(pixel2.y - pixel1.y, 2)
      )
      return distance < minDistance
    }

    // Check if position overlaps with center button area (simplified since layout avoids bottom center)
    const checkCenterCollision = (pos: Position) => {
      const centerPixel = getPixelPosition(centerPos)
      const posPixel = getPixelPosition(pos)
      const distance = Math.sqrt(
        Math.pow(posPixel.x - centerPixel.x, 2) + Math.pow(posPixel.y - centerPixel.y, 2)
      )
      
      return distance < 300 // Increased center exclusion zone to prevent crowding around center
    }
    
    // Run multiple passes to resolve all collisions
    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let hasCollisions = false
      
      // Check all pairs and adjust positions
      for (let i = 0; i < adjustedOptions.length; i++) {
        for (let j = i + 1; j < adjustedOptions.length; j++) {
          const option1 = adjustedOptions[i]
          const option2 = adjustedOptions[j]
          
          if (checkCollision(option1.pos, option2.pos)) {
            hasCollisions = true
            
            // Calculate repulsion vector
            const pixel1 = getPixelPosition(option1.pos)
            const pixel2 = getPixelPosition(option2.pos)
            
            let deltaX = pixel2.x - pixel1.x
            let deltaY = pixel2.y - pixel1.y
            let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            
            // If cards are exactly on top of each other, add small random offset
            if (distance === 0) {
              deltaX = (Math.random() - 0.5) * 100
              deltaY = (Math.random() - 0.5) * 100
              distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
            }
            
            if (distance > 0) {
              // Normalize the vector and apply stronger separation to prevent overlaps
              const separationForce = (minDistance - distance) * 0.6 // Stronger force to ensure clear separation
              const normalizedX = deltaX / distance
              const normalizedY = deltaY / distance
              
              // Move both cards apart with stronger force
              const newPixel1 = {
                x: pixel1.x - normalizedX * separationForce,
                y: pixel1.y - normalizedY * separationForce
              }
              
              const newPixel2 = {
                x: pixel2.x + normalizedX * separationForce,
                y: pixel2.y + normalizedY * separationForce
              }
              
              // Ensure cards stay within bounds
              const boundedPixel1 = {
                x: Math.max(cardWidth/2, Math.min(containerDimensions.width - cardWidth/2, newPixel1.x)),
                y: Math.max(cardHeight/2, Math.min(containerDimensions.height - cardHeight/2, newPixel1.y))
              }
              
              const boundedPixel2 = {
                x: Math.max(cardWidth/2, Math.min(containerDimensions.width - cardWidth/2, newPixel2.x)),
                y: Math.max(cardHeight/2, Math.min(containerDimensions.height - cardHeight/2, newPixel2.y))
              }
              
              adjustedOptions[i].pos = getPercentagePosition(boundedPixel1)
              adjustedOptions[j].pos = getPercentagePosition(boundedPixel2)
            }
          }
        }

        // Check collision with center button area
        const option = adjustedOptions[i]
        if (checkCenterCollision(option.pos)) {
          hasCollisions = true
          
          // Push away from center
          const centerPixel = getPixelPosition(centerPos)
          const optionPixel = getPixelPosition(option.pos)
          
          let deltaX = optionPixel.x - centerPixel.x
          let deltaY = optionPixel.y - centerPixel.y
          let distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          
          if (distance === 0) {
            deltaX = (Math.random() - 0.5) * 200
            deltaY = (Math.random() - 0.5) * 200
            distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
          }
          
          if (distance > 0) {
            const pushDistance = 300 - distance + 50 + (Math.random() * 30) // Stronger push to ensure clear separation from center
            const normalizedX = deltaX / distance
            const normalizedY = deltaY / distance
            
            // Add slight random angle to prevent cards from lining up
            const randomAngle = (Math.random() - 0.5) * 0.5 // Small random angle
            const adjustedX = normalizedX * Math.cos(randomAngle) - normalizedY * Math.sin(randomAngle)
            const adjustedY = normalizedX * Math.sin(randomAngle) + normalizedY * Math.cos(randomAngle)
            
            const newPixel = {
              x: centerPixel.x + adjustedX * pushDistance,
              y: centerPixel.y + adjustedY * pushDistance
            }
            
            // Apply boundaries
            const boundedPixel = {
              x: Math.max(cardWidth/2, Math.min(containerDimensions.width - cardWidth/2, newPixel.x)),
              y: Math.max(cardHeight/2, Math.min(containerDimensions.height - cardHeight/2, newPixel.y))
            }
            
            adjustedOptions[i] = {
              ...option,
              pos: getPercentagePosition(boundedPixel)
            }
          }
        }
      }
      
      // If no collisions found, we're done
      if (!hasCollisions) {
        break
      }
    }
    
    return adjustedOptions
  }

  // Calculate base positions first
  const baseCollisionFreeOptions = adjustForCollisions(uniqueAssignedOptions)
  
  // Only apply collision detection when positions are stable (not during any interactions)
  const shouldSkipCollisionDetection = isDragging || isInteracting || foodCardInteracting
  
  let collisionFreeOptions
  
  if (isDragging && dragFrozenPositions) {
    // Use completely frozen positions during dragging
    collisionFreeOptions = dragFrozenPositions
  } else if (foodCardInteracting && frozenPositions) {
    // Use frozen positions during food card interactions
    collisionFreeOptions = frozenPositions
  } else if (shouldSkipCollisionDetection) {
    // Keep positions stable during any interactions - no collision detection
    collisionFreeOptions = uniqueAssignedOptions
  } else {
    // Only apply collision detection when everything is stable
    collisionFreeOptions = baseCollisionFreeOptions
  }
  const totalOptions = collisionFreeOptions.length

  // Dragging functionality
  // Re-enabled dragging functionality
  const handleMouseDown = (e: React.MouseEvent) => {
    // Disable dragging when recommendations modal is open
    if (showRecommendationBox) {
      return
    }
    
    // Ignore drags that start on interactive elements
    const target = e.target as HTMLElement
    if (
      target.closest('button') ||
      target.closest('a') ||
      target.closest('[role="button"]') ||
      target.closest('[data-no-drag="true"]')
    ) {
      return
    }

    setIsMouseDown(true)
    setDragStart({ x: e.clientX, y: e.clientY })
    setIsDragging(false) // Will activate after threshold
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    // Disable dragging when recommendations modal is open
    if (showRecommendationBox) {
      return
    }
    
    if (!isMouseDown) return // Only move if mouse is pressed down

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    if (!isDragging) {
      const distSq = deltaX * deltaX + deltaY * deltaY
      if (distSq > dragThresholdPx * dragThresholdPx) {
        setIsDragging(true)
        // Freeze positions immediately when dragging starts
        setDragFrozenPositions([...baseCollisionFreeOptions])
      } else {
        return
      }
    }

    setDragOffset(prev => ({ x: prev.x + deltaX, y: prev.y + deltaY }))
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    // Disable dragging when recommendations modal is open
    if (showRecommendationBox) {
      return
    }
    
    setIsMouseDown(false)
    setIsDragging(false)
    // Unfreeze positions when dragging ends
    setDragFrozenPositions(null)
  }

  // Zoom functionality
  const handleWheel = (e: React.WheelEvent) => {
    // Disable zooming when recommendations modal is open
    if (showRecommendationBox) {
      return
    }
    
    e.preventDefault()
    const delta = e.deltaY * -0.001
    setScale(prev => Math.min(Math.max(prev + delta, 0.5), 3))
  }

  const handleZoomIn = () => setScale(prev => Math.min(prev * 1.2, 3))
  const handleZoomOut = () => setScale(prev => Math.max(prev / 1.2, 0.5))

  const selectRandomCenter = () => {
    if (filteredOptions.length > 0) {
      const randomOption = filteredOptions[Math.floor(Math.random() * filteredOptions.length)]
      onCenterChange(randomOption)
    }
  }

  const handleComparisonToggle = (optionId: string) => {
    console.log('Comparison toggle clicked for:', optionId)
    setSelectedForComparison(prev => {
      const newSet = new Set(prev)
      if (newSet.has(optionId)) {
        // Remove item if already selected
        newSet.delete(optionId)
        console.log('Removed from comparison:', optionId)
      } else {
        // Add new item
        if (newSet.size >= 4) {
          // FIFO: Remove the first item added (oldest) and add the new one
          const itemsArray = Array.from(newSet)
          const firstItem = itemsArray[0] // Remove oldest item
          newSet.delete(firstItem)
          console.log('FIFO: Removed oldest item:', firstItem)
        }
        newSet.add(optionId)
        console.log('Added to comparison:', optionId, 'Total:', newSet.size)
      }
      return newSet
    })
  }

  const handleRestaurantDiscovery = (foodName: string) => {
    setSelectedFoodForDiscovery(foodName)
    setShowRestaurantDiscovery(true)
  }

  // New smart restaurant discovery handler for inline results
  const handleSmartRestaurantSearch = async (foodName: string) => {
    if (!userLocation) {
      alert('Location access required to find nearby restaurants')
      return
    }

    // Toggle show/hide if already loaded
    if (restaurantResults.has(foodName)) {
      setShowRestaurantResults(prev => {
        const newSet = new Set(prev)
        if (newSet.has(foodName)) {
          newSet.delete(foodName)
        } else {
          newSet.add(foodName)
        }
        return newSet
      })
      return
    }

    // Start loading
    setLoadingRestaurants(prev => new Set(prev).add(foodName))
    
    try {
      const result = await smartRestaurantService.findRestaurantsForCraving(foodName, userLocation)
      
      // Store results
      setRestaurantResults(prev => new Map(prev).set(foodName, result))
      
      // Show results
      setShowRestaurantResults(prev => new Set(prev).add(foodName))
      
    } catch (error) {
      console.error('Smart restaurant search failed:', error)
      alert('Failed to find restaurants. Please try again.')
    } finally {
      // Stop loading
      setLoadingRestaurants(prev => {
        const newSet = new Set(prev)
        newSet.delete(foodName)
        return newSet
      })
    }
  }

  // Get user location for restaurant discovery
  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          })
        },
        (error) => {
          console.error('Error getting location:', error)
          setUserLocation(null)
        }
      )
    }
  }

  const handleCompare = async () => {
    if (selectedForComparison.size < 2) return

    const selectedOptions = foodOptions.filter(option => 
      selectedForComparison.has(option.id)
    )

      // Simple AI recommendation logic (can be enhanced with real AI later)
  const getRecommendationScore = (option: FoodOption) => {
    let score = 0
    
    // Cost factor (lower price level = higher score)
    const maxPriceLevel = Math.max(...selectedOptions.map(o => o.priceLevel || 2))
    const minPriceLevel = Math.min(...selectedOptions.map(o => o.priceLevel || 2))
    const priceScore = maxPriceLevel > minPriceLevel ? (maxPriceLevel - (option.priceLevel || 2)) / (maxPriceLevel - minPriceLevel) * 40 : 20
    score += priceScore

    // Review rating factor (higher rating = higher score)
    if (option.realRestaurantData?.rating) {
      const ratingScore = (option.realRestaurantData.rating / 5) * 30
      score += ratingScore
    }

    // Match percentage factor (higher match = higher score)
    if (option.confidence) {
      const matchScore = (option.confidence / 100) * 30
      score += matchScore
    }

    return score
  }

  // Function to open Google Maps with directions to restaurant
  const openDirectionsToRestaurant = (restaurant: FoodOption) => {
    const destination = restaurant.realRestaurantData ? restaurant.realRestaurantData.address : `${restaurant.name} ${restaurant.restaurantType || restaurant.location}`
    window.open(`https://www.google.com/maps/dir//${encodeURIComponent(destination)}`, '_blank')
  }

    const scores = selectedOptions.map(option => ({
      option,
      score: getRecommendationScore(option)
    }))

    const bestOption = scores.reduce((best, current) => 
      current.score > best.score ? current : best
    )

    setAiRecommendation(bestOption.option.id)
    setShowComparison(true)
  }

  // Filter button functionality - now only shows all options
  const handleTypeFilterClick = () => {
    // Since we only have 'All' type now, just reset the offset
    setTypeOffset(0)
  }

  // Show more options of the same type
  const handleShowMoreOptions = () => {
    const maxPages = Math.ceil(filteredOptions.length / 24)
    setTypeOffset(prev => (prev + 1) % maxPages)
  }

  // Get filter button text and emoji
  const getFilterDisplay = () => {
    return '🌟 All Types'
  }

  // Get current recommendation box options
  const getCurrentRecommendations = () => {
    if (!selectedCenter) {
      // Initial state: show 1 recommendation + 4 options
      const allOptions = [...filteredOptions]
      if (allOptions.length === 0) return null
      
      // Pick a random center recommendation
      const centerOption = allOptions[Math.floor(Math.random() * allOptions.length)]
      const remainingOptions = allOptions.filter(option => option.id !== centerOption.id)
      
      // Sort remaining options by price level
      const sortedOptions = remainingOptions.sort((a, b) => (a.priceLevel || 2) - (b.priceLevel || 2))
      
      // Get 2 cheaper and 2 more expensive options
      const cheaperOptions = sortedOptions.slice(0, 2)
      const moreExpensiveOptions = sortedOptions.slice(-2)
      
      return {
        center: centerOption,
        cheaper: cheaperOptions,
        moreExpensive: moreExpensiveOptions
      }
    } else {
      // Dynamic state: selected center + 2 cheaper + 2 more expensive
      const centerPriceLevel = selectedCenter.priceLevel || 2 // Default to $$ if no price level
      const remainingOptions = filteredOptions.filter(option => option.id !== selectedCenter.id)
      
      // Get options strictly cheaper than center
      let cheaperOptions = remainingOptions
        .filter(option => option.priceLevel && option.priceLevel < centerPriceLevel)
        .sort((a, b) => (b.priceLevel || 1) - (a.priceLevel || 1))
        .slice(0, 2)
      
      // Get options strictly more expensive than center
      let moreExpensiveOptions = remainingOptions
        .filter(option => option.priceLevel && option.priceLevel > centerPriceLevel)
        .sort((a, b) => (a.priceLevel || 4) - (b.priceLevel || 4))
        .slice(0, 2)
      
      // If no strictly cheaper options, fall back to same price level
      if (cheaperOptions.length === 0) {
        cheaperOptions = remainingOptions
          .filter(option => option.priceLevel && option.priceLevel === centerPriceLevel)
          .slice(0, 2)
      }
      
      // If no strictly more expensive options, fall back to same price level
      if (moreExpensiveOptions.length === 0) {
        moreExpensiveOptions = remainingOptions
          .filter(option => option.priceLevel && option.priceLevel === centerPriceLevel)
          .slice(0, 2)
      }
      
      return {
        center: selectedCenter,
        cheaper: cheaperOptions,
        moreExpensive: moreExpensiveOptions
      }
    }
  }
  
  const currentRecommendations = getCurrentRecommendations()

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
              background: 'linear-gradient(135deg, #fdf6e3 0%, #f5e6d3 100%)'
    }}>
      <div 
        ref={containerRef}
        style={{
          height: '200vh', // Double the height for more vertical space
          width: '200vw',  // Double the width for more horizontal space
          position: 'absolute',
          top: '-50vh', // Center the expanded canvas
          left: '-50vw', // Center the expanded canvas
          cursor: showRecommendationBox ? 'default' : (isDragging ? 'grabbing' : 'grab'),
          background: 'radial-gradient(circle at center, #fef3c7 0%, #fde68a 100%)',
          minHeight: '2000px', // Minimum size to ensure enough space
          minWidth: '2000px'
        }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '12px'
      }} data-no-drag="true">
        <button
          onClick={onReset}
          style={{
            padding: '12px 20px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #e8e6e0',
            borderRadius: '12px',
            color: '#1e293b',
            cursor: 'pointer',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            fontWeight: '600',
            transition: 'all 0.2s ease'
          }}
        >
          ← New Search
        </button>


      </div>

      {/* Zoom Controls */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 1000,
        display: 'flex',
        gap: '8px'
      }}>
        <button onClick={handleZoomOut} style={zoomButtonStyle}>−</button>
        <button onClick={handleZoomIn} style={zoomButtonStyle}>+</button>
      </div>

             {/* Compare Button - Top Center */}
       <div style={{
         position: 'fixed',
         top: '20px',
         left: '50%',
         transform: 'translateX(-50%)',
         zIndex: 1000,
         display: 'flex',
         flexDirection: 'column',
         alignItems: 'center'
       }} data-no-drag="true">
         <button
           onClick={handleCompare}
           disabled={selectedForComparison.size < 2}
           title={`Selected: ${selectedForComparison.size}/4 items`}
           style={{
             padding: '16px 24px',
             background: selectedForComparison.size >= 2 
               ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
               : 'rgba(100, 100, 100, 0.4)',
             border: selectedForComparison.size >= 2
               ? '2px solid rgba(245, 158, 11, 0.6)'
               : '2px solid rgba(100, 100, 100, 0.4)',
             borderRadius: '50px',
             color: 'white',
             cursor: selectedForComparison.size >= 2 ? 'pointer' : 'not-allowed',
             backdropFilter: 'blur(15px)',
             opacity: selectedForComparison.size >= 2 ? 1 : 0.7,
             transition: 'all 0.3s ease',
             display: 'flex',
             alignItems: 'center',
             gap: '10px',
             fontSize: '16px',
             fontWeight: '600',
             boxShadow: selectedForComparison.size >= 2 
               ? '0 8px 25px rgba(245, 158, 11, 0.4)'
               : '0 4px 15px rgba(0, 0, 0, 0.3)',
             minWidth: '180px',
             justifyContent: 'center'
           }}
           onMouseEnter={(e) => {
             if (selectedForComparison.size >= 2) {
               e.currentTarget.style.transform = 'scale(1.05)'
               e.currentTarget.style.boxShadow = '0 12px 35px rgba(245, 158, 11, 0.6)'
             }
           }}
           onMouseLeave={(e) => {
             if (selectedForComparison.size >= 2) {
               e.currentTarget.style.transform = 'scale(1)'
               e.currentTarget.style.boxShadow = '0 8px 25px rgba(245, 158, 11, 0.4)'
             }
           }}
         >
           ⚖️ Compare ({selectedForComparison.size}/4)
         </button>
         
         {/* Recommendations Button */}
         <button
           onClick={() => setShowRecommendationBox(true)}
           style={{
             padding: '12px 20px',
             background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
             color: 'white',
             border: 'none',
             borderRadius: '50px',
             cursor: 'pointer',
             fontSize: '16px',
             fontWeight: '600',
             minWidth: '140px',
             marginTop: '10px'
           }}
         >
           ❓ Recommendations
         </button>
         
         {/* Search Button */}
         <button
           onClick={onReset}
           style={{
             padding: '12px 20px',
             background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
             color: 'white',
             border: 'none',
             borderRadius: '50px',
             cursor: 'pointer',
             fontSize: '16px',
             fontWeight: '600',
             minWidth: '140px',
             marginTop: '10px',
             transition: 'all 0.3s ease',
             boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)'
           }}
           onMouseEnter={(e) => {
             e.currentTarget.style.transform = 'scale(1.05)'
             e.currentTarget.style.boxShadow = '0 8px 25px rgba(249, 115, 22, 0.4)'
           }}
           onMouseLeave={(e) => {
             e.currentTarget.style.transform = 'scale(1)'
             e.currentTarget.style.boxShadow = '0 4px 12px rgba(249, 115, 22, 0.3)'
           }}
         >
           🔍 Search
         </button>
       </div>

      {/* Instructions */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 1000,
        background: 'rgba(0, 0, 0, 0.7)',
        padding: '12px 24px',
        borderRadius: '20px',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: '14px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)'
      }}>
        {getFilterDisplay()} active • Drag to explore • Scroll to zoom • Click filter to change type • Click center to randomize
      </div>

      {/* Spider Web Container */}
      <div style={{
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) scale(${scale})`,
        transformOrigin: 'center center',
        transition: isDragging ? 'none' : 'transform 0.1s ease',
        pointerEvents: showRecommendationBox ? 'none' : 'auto'
      }}>
        {/* Connection Lines */}
        {collisionFreeOptions.map(({ option, pos }) => (
          <WebConnection
            key={`connection-${option.id}`}
            start={centerPos}
            end={pos}
            isActive={selectedCenter?.id === option.id}
            containerWidth={containerDimensions.width}
            containerHeight={containerDimensions.height}
          />
        ))}

        {/* Center Control Widget - Groups center button, filter controls, and info */}
        <div
          style={{
            position: 'absolute',
            left: `${centerPos.x}%`,
            top: `${centerPos.y}%`,
            transform: 'translate(-50%, -50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '12px',
            zIndex: 100
          }}
          data-no-drag="true"
        >
          {/* Center Node */}
          <div
            style={{
              width: '200px',
              height: '200px',
              background: selectedCenter 
                ? 'linear-gradient(135deg, #ffffff 0%, #f0f0f0 100%)'
                : 'linear-gradient(135deg, #4a4a4a 0%, #2a2a2a 100%)',
              color: selectedCenter ? '#1a1a1a' : '#ffffff',
              borderRadius: '50%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              cursor: 'pointer',
              boxShadow: selectedCenter
                ? '0 20px 60px rgba(255,255,255,0.3), inset 0 0 30px rgba(0,0,0,0.1)'
                : '0 20px 60px rgba(255,255,255,0.2), inset 0 0 30px rgba(255,255,255,0.1)',
              border: `4px solid ${selectedCenter ? '#666' : 'rgba(255,255,255,0.6)'}`,
              backdropFilter: 'blur(10px)',
              transition: 'all 0.4s ease',
              fontSize: '16px',
              fontWeight: 'bold',
              padding: '20px'
            }}
            onClick={selectRandomCenter}
          >
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🍔</div>
            <div style={{ lineHeight: '1.2' }}>
              {selectedCenter ? selectedCenter.name : searchQuery}
            </div>
            {selectedCenter && (
              <div style={{ 
                fontSize: '12px', 
                opacity: 0.7, 
                marginTop: '4px' 
              }}>
                {selectedCenter.location} • ${selectedCenter.price}
              </div>
            )}
          </div>

          {/* Filter Controls Container */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'center'
            }}
          >
            {/* Type Filter Button */}
            <button
              onClick={handleTypeFilterClick}
              style={{
                background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '16px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 15px rgba(79, 70, 229, 0.5)',
                transition: 'all 0.3s ease',
                minWidth: '120px',
                backdropFilter: 'blur(10px)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(79, 70, 229, 0.6)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
                e.currentTarget.style.boxShadow = '0 4px 15px rgba(79, 70, 229, 0.4)'
              }}
            >
              {getFilterDisplay()}
            </button>

            {/* Show More Button */}
            {filteredOptions.length > 24 && (
              <button
                onClick={handleShowMoreOptions}
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  color: 'rgba(255, 255, 255, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.4)',
                  borderRadius: '14px',
                  padding: '6px 12px',
                  fontSize: '11px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  backdropFilter: 'blur(10px)',
                  minWidth: '120px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.25)'
                  e.currentTarget.style.color = 'white'
                  e.currentTarget.style.transform = 'scale(1.02)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)'
                  e.currentTarget.style.color = 'rgba(255, 255, 255, 0.9)'
                  e.currentTarget.style.transform = 'scale(1)'
                }}
              >
                🔄 More Options ({typeOffset + 1}/{Math.ceil(filteredOptions.length / 24)})
              </button>
            )}

            {/* Filter Info */}
            <div style={{
              fontSize: '11px',
              color: 'rgba(255, 255, 255, 0.7)',
              textAlign: 'center',
              background: 'rgba(0, 0, 0, 0.4)',
              padding: '6px 12px',
              borderRadius: '12px',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              minWidth: '180px'
            }}>
              Showing {collisionFreeOptions.length} of {filteredOptions.length} {typeFilter.toLowerCase()} options
            </div>
          </div>
        </div>

        {/* Section Labels */}
        <div style={{
          position: 'absolute',
          left: '50%',
          top: '2%',
          transform: 'translateX(-50%)',
          color: '#ef4444',
          fontSize: '18px',
          fontWeight: '700',
          textShadow: '0 2px 10px rgba(239, 68, 68, 0.6)',
          zIndex: 40
        }}>
          💎 PREMIUM
        </div>
        
        <div style={{
          position: 'absolute',
          left: '50%',
          bottom: '2%',
          transform: 'translateX(-50%)',
          color: '#10b981',
          fontSize: '18px',
          fontWeight: '700',
          textShadow: '0 2px 10px rgba(16, 185, 129, 0.6)',
          zIndex: 40
        }}>
          💰 BUDGET
        </div>
        


        {/* Food Cards */}
        {collisionFreeOptions.map(({ option, pos }) => (
          <div
            key={option.id}
            style={{
              position: 'absolute',
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 50
            }}
            data-no-drag="true"
            onMouseDown={() => {
              setIsInteracting(true)
              setFoodCardInteracting(true)
              // Freeze current positions
              setFrozenPositions([...collisionFreeOptions])
            }}
            onMouseUp={() => {
              setTimeout(() => {
                setIsInteracting(false)
                setFoodCardInteracting(false)
                setFrozenPositions(null)
              }, 300)
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                setIsInteracting(false)
                setFoodCardInteracting(false)
                setFrozenPositions(null)
              }, 300)
            }}
            onClick={() => {
              setIsInteracting(true)
              setFoodCardInteracting(true)
              // Freeze current positions
              setFrozenPositions([...collisionFreeOptions])
              setTimeout(() => {
                setIsInteracting(false)
                setFoodCardInteracting(false)
                setFrozenPositions(null)
              }, 500)
            }}
          >
                         <FoodCard 
               option={option}
               isHighlighted={selectedCenter?.id === option.id}
               onClick={() => onCenterChange(option)}
               isSelectedForComparison={selectedForComparison.has(option.id)}
               onComparisonToggle={handleComparisonToggle}
               onDiscoverClick={(option) => {
                 setSelectedFoodOptionForDiscovery(option)
                 setShowDiscoveryModal(true)
               }}
             />
          </div>
        ))}
      </div>



      {/* Comparison Modal */}
      <ComparisonModal
        isOpen={showComparison}
        onClose={() => {
          setShowComparison(false)
          setAiRecommendation(null)
        }}
        selectedOptions={foodOptions.filter(option => selectedForComparison.has(option.id))}
        aiRecommendation={aiRecommendation}
        onDiscoverClick={(option) => {
          setSelectedFoodOptionForDiscovery(option)
          setShowDiscoveryModal(true)
        }}
      />

      {/* Recommendation Box Overlay */}
      {showRecommendationBox && currentRecommendations && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(253, 246, 227, 0.98)',
          border: '3px solid #e8e6e0',
          borderRadius: '24px',
          padding: '32px',
          zIndex: 2000,
          minWidth: '600px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Close Button */}
          <button
            onClick={() => setShowRecommendationBox(false)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #e8e6e0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#1e293b',
              cursor: 'pointer',
              fontSize: '18px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              fontWeight: '600',
              transition: 'all 0.2s ease'
            }}
          >
            ✕
          </button>
          
          {/* Title */}
          <div style={{
            textAlign: 'center',
            marginBottom: '30px',
            color: '#1e293b',
            fontSize: '26px',
            fontWeight: '700',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            🍔 Recommendations
          </div>
          
          {/* Recommendation Layout */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '20px'
          }}>
                         {/* Cheaper Options (Left) */}
             <div style={{
               display: 'flex',
               flexDirection: 'column',
               gap: '15px',
               alignItems: 'center'
             }}>
               <div style={{
                 color: '#10b981',
                 fontSize: '16px',
                 fontWeight: 'bold',
                 marginBottom: '10px'
               }}>
                 {currentRecommendations.center.priceLevel && currentRecommendations.cheaper.length > 0 &&
                   currentRecommendations.cheaper.some(option => option.priceLevel && option.priceLevel < (currentRecommendations.center.priceLevel || 2))
                   ? '💰 Cheaper'
                   : '🔄 Other Options'
                 }
               </div>
                               {currentRecommendations.cheaper.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      background: 'rgba(253, 246, 227, 0.95)',
                      border: '2px solid #bbf7d0',
                      borderRadius: '16px',
                      padding: '16px',
                      minWidth: '150px',
                      textAlign: 'center',
                      color: '#1e293b',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleComparisonToggle(option.id)
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${selectedForComparison.has(option.id) ? '#10b981' : '#d1d5db'}`,
                        background: selectedForComparison.has(option.id) 
                          ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                          : 'rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {selectedForComparison.has(option.id) && (
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    
                    {/* Clickable content area */}
                    <div
                      onClick={() => {
                        onCenterChange(option)
                      }}
                      style={{ cursor: 'pointer', marginTop: '35px' }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {option.name}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        {option.location}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#10b981',
                        marginTop: '5px'
                      }}>
                        {option.priceLevel ? ['$', '$$', '$$$', '$$$$'][option.priceLevel - 1] : '$'}
                      </div>
                      
                      {/* Reviews and Open Status */}
                      {option.realRestaurantData && (
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ color: '#3b82f6' }}>
                            ⭐ {option.realRestaurantData.rating}/5 ({option.realRestaurantData.totalRatings} reviews)
                          </div>
                          {option.realRestaurantData.openNow && (
                            <div style={{ color: '#10b981' }}>
                              🟢 Open Now
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFoodOptionForDiscovery(option)
                            setShowDiscoveryModal(true)
                          }}
                          style={{
                            background: '#047857',
                            border: '1px solid #065f46',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#065f46'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#047857'
                          }}
                        >
                          🔍 Discover
                        </button>
                      </div>
                      
                      {/* Inline Restaurant Results */}
                      {showRestaurantResults.has(option.name) && restaurantResults.has(option.name) && (
                        <div style={{
                          marginTop: '12px',
                          background: 'rgba(255, 255, 255, 0.95)',
                          border: '2px solid #e8e6e0',
                          borderRadius: '12px',
                          padding: '16px',
                          maxHeight: '300px',
                          overflow: 'auto'
                        }}>
                          <h4 style={{
                            margin: '0 0 12px 0',
                            fontSize: '14px',
                            fontWeight: '600',
                            color: '#1e293b'
                          }}>
                            🍽️ Restaurants serving {option.name}
                          </h4>
                          
                          {restaurantResults.get(option.name)?.restaurants.map((restaurant, idx) => (
                            <div
                              key={restaurant.id}
                              style={{
                                background: 'rgba(254, 243, 199, 0.6)',
                                border: '1px solid #fde68a',
                                borderRadius: '8px',
                                padding: '12px',
                                marginBottom: idx < (restaurantResults.get(option.name)?.restaurants.length || 0) - 1 ? '8px' : '0',
                                fontSize: '12px'
                              }}
                            >
                              <div style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'flex-start',
                                marginBottom: '6px'
                              }}>
                                <div style={{ flex: 1 }}>
                                  <div style={{ fontWeight: '600', color: '#1e293b', marginBottom: '2px' }}>
                                    {restaurant.name}
                                  </div>
                                  <div style={{ color: '#64748b', fontSize: '11px' }}>
                                    📍 {restaurant.address}
                                  </div>
                                </div>
                                <div style={{
                                  background: restaurant.confidence > 80 ? '#10b981' : '#f59e0b',
                                  color: 'white',
                                  padding: '2px 6px',
                                  borderRadius: '6px',
                                  fontSize: '10px',
                                  fontWeight: '600'
                                }}>
                                  {restaurant.confidence}%
                                </div>
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                marginBottom: '8px',
                                fontSize: '11px'
                              }}>
                                <span style={{ color: '#f97316' }}>⭐ {restaurant.rating}</span>
                                <span style={{ color: '#10b981' }}>💰 {['$', '$$', '$$$', '$$$$'][restaurant.priceLevel - 1] || 'N/A'}</span>
                                <span style={{ color: '#3b82f6' }}>
                                  📏 {restaurant.distance < 1 ? `${Math.round(restaurant.distance * 1000)}m` : `${restaurant.distance.toFixed(1)}km`}
                                </span>
                                {restaurant.openNow && (
                                  <span style={{ color: '#059669' }}>🟢 Open</span>
                                )}
                              </div>
                              
                              <div style={{
                                display: 'flex',
                                gap: '6px',
                                flexWrap: 'wrap'
                              }}>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    window.open(`https://www.google.com/maps/dir/?api=1&destination=place_id:${restaurant.place_id}`, '_blank')
                                  }}
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.4)',
                                    color: '#3b82f6',
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    fontSize: '10px',
                                    cursor: 'pointer',
                                    fontWeight: '500'
                                  }}
                                >
                                  🗺️ Directions
                                </button>
                                
                                {restaurant.website && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(restaurant.website, '_blank')
                                    }}
                                    style={{
                                      background: 'rgba(139, 92, 246, 0.2)',
                                      border: '1px solid rgba(139, 92, 246, 0.4)',
                                      color: '#8b5cf6',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    🌐 Website
                                  </button>
                                )}
                                
                                {restaurant.phone && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      window.open(`tel:${restaurant.phone}`, '_self')
                                    }}
                                    style={{
                                      background: 'rgba(16, 185, 129, 0.2)',
                                      border: '1px solid rgba(16, 185, 129, 0.4)',
                                      color: '#10b981',
                                      padding: '4px 8px',
                                      borderRadius: '6px',
                                      fontSize: '10px',
                                      cursor: 'pointer',
                                      fontWeight: '500'
                                    }}
                                  >
                                    📞 Call
                                  </button>
                                )}
                              </div>
                            </div>
                          )) || []}
                          
                          {restaurantResults.get(option.name)?.restaurants.length === 0 && (
                            <div style={{
                              textAlign: 'center',
                              color: '#64748b',
                              fontSize: '12px',
                              padding: '16px'
                            }}>
                              No restaurants found for {option.name}
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Loading State */}
                      {loadingRestaurants.has(option.name) && (
                        <div style={{
                          marginTop: '12px',
                          textAlign: 'center',
                          padding: '16px'
                        }}>
                          <div style={{
                            width: '20px',
                            height: '20px',
                            border: '2px solid rgba(139, 92, 246, 0.3)',
                            borderTop: '2px solid #8b5cf6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 8px'
                          }} />
                          <div style={{ color: '#64748b', fontSize: '11px' }}>
                            🔍 Finding restaurants...
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
               {/* Fill empty slots with placeholder cards */}
               {Array.from({ length: 2 - currentRecommendations.cheaper.length }).map((_, index) => (
                 <div
                   key={`empty-cheaper-${index}`}
                   style={{
                     background: 'rgba(253, 246, 227, 0.6)',
                     border: '2px dashed #bbf7d0',
                     borderRadius: '16px',
                     padding: '16px',
                     minWidth: '150px',
                     textAlign: 'center',
                     color: '#94a3b8',
                     minHeight: '80px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}
                 >
                   <div style={{ fontSize: '14px' }}>
                     {currentRecommendations.center.priceLevel && currentRecommendations.cheaper.length > 0 &&
                       currentRecommendations.cheaper.some(option => option.priceLevel && option.priceLevel < (currentRecommendations.center.priceLevel || 2))
                       ? 'No cheaper options'
                       : 'No other options'
                     }
                   </div>
                 </div>
               ))}
             </div>
            
            {/* Center Option */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '15px'
            }}>
              <div style={{
                color: '#1e293b',
                fontSize: '16px',
                fontWeight: '700',
                marginBottom: '10px',
                textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
              }}>
                🎯 Current Choice
              </div>
                             <div style={{
                 background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                 border: '3px solid #e8e6e0',
                 borderRadius: '20px',
                 padding: '25px',
                 minWidth: '180px',
                 textAlign: 'center',
                 color: '#1e293b',
                 position: 'relative',
                 boxShadow: '0 8px 20px rgba(0, 0, 0, 0.1)'
               }}>
                 {/* Checkbox */}
                 <div
                   onClick={(e) => {
                     e.stopPropagation()
                     handleComparisonToggle(currentRecommendations.center.id)
                   }}
                   style={{
                     position: 'absolute',
                     top: '15px',
                     right: '15px',
                     width: '24px',
                     height: '24px',
                     borderRadius: '6px',
                     border: `2px solid ${selectedForComparison.has(currentRecommendations.center.id) ? '#10b981' : '#d1d5db'}`,
                     background: selectedForComparison.has(currentRecommendations.center.id) 
                       ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                       : 'rgba(255, 255, 255, 0.9)',
                     cursor: 'pointer',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     transition: 'all 0.2s ease',
                     boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                   }}
                 >
                   {selectedForComparison.has(currentRecommendations.center.id) && (
                     <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                   )}
                 </div>
                 
                 <div style={{ fontSize: '32px', marginBottom: '10px', marginTop: '35px' }}>🍔</div>
                 <div style={{ 
                   fontWeight: 'bold', 
                   fontSize: '18px',
                   marginBottom: '8px'
                 }}>
                   {currentRecommendations.center.name}
                 </div>
                 <div style={{ fontSize: '14px', opacity: 0.7, marginBottom: '8px' }}>
                   {currentRecommendations.center.realRestaurantData ? currentRecommendations.center.realRestaurantData.address : (currentRecommendations.center.restaurantType || currentRecommendations.center.location)}
                 </div>
                 <div style={{ 
                   fontSize: '24px', 
                   fontWeight: 'bold',
                   color: '#f59e0b'
                 }}>
                   {currentRecommendations.center.priceLevel ? ['$', '$$', '$$$', '$$$$'][currentRecommendations.center.priceLevel - 1] : '$'}
                 </div>
                 
                 {/* Reviews and Open Status */}
                 {currentRecommendations.center.realRestaurantData && (
                   <div style={{
                     fontSize: '12px',
                     color: '#64748b',
                     marginTop: '8px',
                     display: 'flex',
                     flexDirection: 'column',
                     gap: '4px'
                   }}>
                     <div style={{ color: '#3b82f6' }}>
                       ⭐ {currentRecommendations.center.realRestaurantData.rating}/5 ({currentRecommendations.center.realRestaurantData.totalRatings} reviews)
                     </div>
                     {currentRecommendations.center.realRestaurantData.openNow && (
                       <div style={{ color: '#10b981' }}>
                         🟢 Open Now
                       </div>
                     )}
                   </div>
                 )}
                 
                 {/* Action Buttons */}
                 <div style={{
                   display: 'flex',
                   gap: '8px',
                   marginTop: '12px',
                   justifyContent: 'center'
                 }}>
                   <button
                     onClick={(e) => {
                       e.stopPropagation()
                       setSelectedFoodOptionForDiscovery(currentRecommendations.center)
                       setShowDiscoveryModal(true)
                     }}
                     style={{
                       background: '#14b8a6',
                       border: '1.5px solid #0f766e',
                       color: 'white',
                       padding: '10px 16px',
                       borderRadius: '10px',
                       fontSize: '14px',
                       fontWeight: 'bold',
                       cursor: 'pointer',
                       transition: 'all 0.2s ease',
                       width: '100%',
                       boxShadow: '0 2px 8px rgba(20, 184, 166, 0.08)'
                     }}
                     onMouseEnter={(e) => {
                       e.currentTarget.style.background = '#0d9488'
                     }}
                     onMouseLeave={(e) => {
                       e.currentTarget.style.background = '#14b8a6'
                     }}
                   >
                     🔍 Discover
                   </button>
                 </div>
                 {/* Show review snippets if available */}
                 {currentRecommendations.center.realRestaurantData?.reviews && currentRecommendations.center.realRestaurantData.reviews.length > 0 && (
                   <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                     <div style={{ fontWeight: 600, color: '#374151', fontSize: '14px', marginBottom: '4px' }}>Recent Reviews:</div>
                     {currentRecommendations.center.realRestaurantData.reviews.slice(0, 3).map((review, idx) => (
                       <div key={idx} style={{
                         background: 'rgba(254, 243, 199, 0.7)',
                         border: '1px solid #fde68a',
                         borderRadius: '8px',
                         padding: '10px',
                         fontSize: '13px',
                         color: '#92400e',
                         boxShadow: '0 1px 4px rgba(0,0,0,0.04)'
                       }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                           <span style={{ fontWeight: 600 }}>{review.author_name}</span>
                           <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(review.rating)}</span>
                         </div>
                         <div style={{ fontStyle: 'italic', color: '#92400e' }}>
                           "{review.text}"
                         </div>
                       </div>
                     ))}
                   </div>
                 )}
               </div>
            </div>
            
                         {/* More Expensive Options (Right) */}
             <div style={{
               display: 'flex',
               flexDirection: 'column',
               gap: '15px',
               alignItems: 'center'
             }}>
               <div style={{
                 color: '#dc2626',
                 fontSize: '16px',
                 fontWeight: '700',
                 marginBottom: '10px',
                 textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
               }}>
                 {currentRecommendations.center.priceLevel && currentRecommendations.moreExpensive.length > 0 &&
                   currentRecommendations.moreExpensive.some(option => option.priceLevel && option.priceLevel > (currentRecommendations.center.priceLevel || 2))
                   ? '👑 More Expensive'
                   : '🔄 Other Options'
                 }
               </div>
                               {currentRecommendations.moreExpensive.map((option) => (
                  <div
                    key={option.id}
                    style={{
                      background: 'rgba(253, 246, 227, 0.95)',
                      border: '2px solid #ef4444',
                      borderRadius: '16px',
                      padding: '16px',
                      minWidth: '150px',
                      textAlign: 'center',
                      color: '#1e293b',
                      position: 'relative',
                      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                    }}
                  >
                    {/* Checkbox */}
                    <div
                      onClick={(e) => {
                        e.stopPropagation()
                        handleComparisonToggle(option.id)
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        width: '24px',
                        height: '24px',
                        borderRadius: '6px',
                        border: `2px solid ${selectedForComparison.has(option.id) ? '#ef4444' : '#d1d5db'}`,
                        background: selectedForComparison.has(option.id) 
                          ? 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'
                          : 'rgba(255, 255, 255, 0.9)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.2s ease',
                        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
                      }}
                    >
                      {selectedForComparison.has(option.id) && (
                        <span style={{ color: 'white', fontSize: '14px', fontWeight: 'bold' }}>✓</span>
                      )}
                    </div>
                    
                    {/* Clickable content area */}
                    <div
                      onClick={() => {
                        onCenterChange(option)
                      }}
                      style={{ cursor: 'pointer', marginTop: '35px' }}
                    >
                      <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>
                        {option.name}
                      </div>
                      <div style={{ fontSize: '14px', opacity: 0.8 }}>
                        {option.location}
                      </div>
                      <div style={{ 
                        fontSize: '18px', 
                        fontWeight: 'bold', 
                        color: '#dc2626',
                        marginTop: '5px'
                      }}>
                        {option.priceLevel ? ['$', '$$', '$$$', '$$$$'][option.priceLevel - 1] : '$'}
                      </div>
                      
                      {/* Reviews and Open Status */}
                      {option.realRestaurantData && (
                        <div style={{
                          fontSize: '12px',
                          color: '#64748b',
                          marginTop: '8px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px'
                        }}>
                          <div style={{ color: '#3b82f6' }}>
                            ⭐ {option.realRestaurantData.rating}/5 ({option.realRestaurantData.totalRatings} reviews)
                          </div>
                          {option.realRestaurantData.openNow && (
                            <div style={{ color: '#10b981' }}>
                              🟢 Open Now
                            </div>
                          )}
                        </div>
                      )}
                      
                      {/* Action Buttons */}
                      <div style={{
                        display: 'flex',
                        gap: '8px',
                        marginTop: '12px',
                        justifyContent: 'center'
                      }}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            setSelectedFoodOptionForDiscovery(option)
                            setShowDiscoveryModal(true)
                          }}
                          style={{
                            background: '#047857',
                            border: '1px solid #065f46',
                            color: 'white',
                            padding: '6px 12px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            width: '100%'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = '#065f46'
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = '#047857'
                          }}
                        >
                          🔍 Discover
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
               {/* Fill empty slots with placeholder cards */}
               {Array.from({ length: 2 - currentRecommendations.moreExpensive.length }).map((_, index) => (
                 <div
                   key={`empty-expensive-${index}`}
                   style={{
                     background: 'rgba(253, 246, 227, 0.6)',
                     border: '2px dashed #fecaca',
                     borderRadius: '16px',
                     padding: '16px',
                     minWidth: '150px',
                     textAlign: 'center',
                     color: '#94a3b8',
                     minHeight: '80px',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center'
                   }}
                 >
                   <div style={{ fontSize: '14px' }}>
                     {currentRecommendations.center.priceLevel && currentRecommendations.moreExpensive.length > 0 &&
                       currentRecommendations.moreExpensive.some(option => option.priceLevel && option.priceLevel > (currentRecommendations.center.priceLevel || 2))
                       ? 'No more expensive options'
                       : 'No other options'
                     }
                   </div>
                 </div>
               ))}
             </div>
          </div>
        </div>
      )}
      
      {/* Nutrition Popup */}
      {showNutritionPopup && selectedNutritionOption && (
        <NutritionPopup
          foodOption={selectedNutritionOption}
          onClose={() => {
            setShowNutritionPopup(false)
            setSelectedNutritionOption(null)
          }}
        />
      )}

      {/* Restaurant Discovery Modal */}
      {showRestaurantDiscovery && selectedFoodForDiscovery && (
        <SmartRestaurantDiscovery
          foodName={selectedFoodForDiscovery}
          userLocation={userLocation}
          onClose={() => {
            setShowRestaurantDiscovery(false)
            setSelectedFoodForDiscovery('')
          }}
        />
      )}

      {/* Discovery Modal */}
      {showDiscoveryModal && selectedFoodOptionForDiscovery && (
        <div style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(253, 246, 227, 0.98)',
          border: '3px solid #e8e6e0',
          borderRadius: '24px',
          padding: '32px',
          zIndex: 2000,
          minWidth: '500px',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        }}>
          {/* Close Button */}
          <button
            onClick={() => setShowDiscoveryModal(false)}
            style={{
              position: 'absolute',
              top: '15px',
              right: '15px',
              background: 'rgba(255, 255, 255, 0.95)',
              border: '2px solid #e8e6e0',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              color: '#1e293b',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>

          {/* Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '24px',
            paddingRight: '40px'
          }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              color: '#1e293b',
              margin: '0 0 8px 0'
            }}>
              🔍 Discover {selectedFoodOptionForDiscovery.name}
            </h2>
            <div style={{
              fontSize: '16px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              justifyContent: 'center'
            }}>
              <span>📍</span>
              {selectedFoodOptionForDiscovery.location}
            </div>
          </div>

          {/* Content */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '20px'
          }}>
            {/* Basic Info */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '2px solid #e8e6e0',
              borderRadius: '16px',
              padding: '20px'
            }}>
              <h3 style={{
                fontSize: '18px',
                fontWeight: '600',
                color: '#1e293b',
                margin: '0 0 16px 0'
              }}>
                📋 Basic Information
              </h3>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px'
              }}>
                <div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    Price Level
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#f59e0b' }}>
                    {selectedFoodOptionForDiscovery.priceLevel ? ['$', '$$', '$$$', '$$$$'][selectedFoodOptionForDiscovery.priceLevel - 1] : '$'}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                    Category
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: '600', color: '#10b981' }}>
                    {selectedFoodOptionForDiscovery.category}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{
              display: 'flex',
              gap: '12px',
              justifyContent: 'center',
              flexWrap: 'wrap'
            }}>
              <button
                onClick={() => {
                  const destination = selectedFoodOptionForDiscovery.realRestaurantData ? 
                    selectedFoodOptionForDiscovery.realRestaurantData.address : 
                    `${selectedFoodOptionForDiscovery.name} ${selectedFoodOptionForDiscovery.restaurantType || selectedFoodOptionForDiscovery.location}`
                  window.open(`https://www.google.com/maps/dir//${encodeURIComponent(destination)}`, '_blank')
                }}
                style={{
                  background: 'rgba(59, 130, 246, 0.2)',
                  border: '1px solid rgba(59, 130, 246, 0.4)',
                  color: '#3b82f6',
                  padding: '10px 16px',
                  borderRadius: '12px',
                  fontSize: '14px',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  fontWeight: '600'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(59, 130, 246, 0.2)'
                }}
              >
                🗺️ Get Directions
              </button>

              {selectedFoodOptionForDiscovery.realRestaurantData?.website && (
                <button
                  onClick={() => window.open(selectedFoodOptionForDiscovery.realRestaurantData!.website, '_blank')}
                  style={{
                    background: 'rgba(139, 92, 246, 0.2)',
                    border: '1px solid rgba(139, 92, 246, 0.4)',
                    color: '#8b5cf6',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(139, 92, 246, 0.2)'
                  }}
                >
                  🌐 Visit Website
                </button>
              )}

              {selectedFoodOptionForDiscovery.realRestaurantData?.phone && (
                <button
                  onClick={() => window.open(`tel:${selectedFoodOptionForDiscovery.realRestaurantData!.phone}`, '_self')}
                  style={{
                    background: 'rgba(16, 185, 129, 0.2)',
                    border: '1px solid rgba(16, 185, 129, 0.4)',
                    color: '#10b981',
                    padding: '10px 16px',
                    borderRadius: '12px',
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    fontWeight: '600'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.3)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'
                  }}
                >
                  📞 Call Restaurant
                </button>
              )}
            </div>

            {/* Additional Info */}
            {selectedFoodOptionForDiscovery.realRestaurantData && (
              <div style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '2px solid #e8e6e0',
                borderRadius: '16px',
                padding: '20px'
              }}>
                <h3 style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: '#1e293b',
                  margin: '0 0 16px 0'
                }}>
                  🏪 Restaurant Details
                </h3>
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}>
                  {selectedFoodOptionForDiscovery.realRestaurantData.address && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        📍 Address
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b' }}>
                        {selectedFoodOptionForDiscovery.realRestaurantData.address}
                      </div>
                    </div>
                  )}
                  {selectedFoodOptionForDiscovery.realRestaurantData.rating && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        ⭐ Rating
                      </div>
                      <div style={{ fontSize: '16px', color: '#1e293b' }}>
                        {selectedFoodOptionForDiscovery.realRestaurantData.rating}/5 ({selectedFoodOptionForDiscovery.realRestaurantData.totalRatings} reviews)
                      </div>
                    </div>
                  )}
                  {selectedFoodOptionForDiscovery.realRestaurantData.openNow !== undefined && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '4px' }}>
                        🕒 Status
                      </div>
                      <div style={{ 
                        fontSize: '16px', 
                        color: selectedFoodOptionForDiscovery.realRestaurantData.openNow ? '#10b981' : '#ef4444',
                        fontWeight: '600'
                      }}>
                        {selectedFoodOptionForDiscovery.realRestaurantData.openNow ? '🟢 Open Now' : '🔴 Closed'}
                      </div>
                    </div>
                  )}
                  {selectedFoodOptionForDiscovery.realRestaurantData.reviews && selectedFoodOptionForDiscovery.realRestaurantData.reviews.length > 0 && (
                    <div>
                      <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>
                        📝 Recent Reviews
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {selectedFoodOptionForDiscovery.realRestaurantData.reviews.slice(0, 3).map((review, idx) => (
                          <div key={idx} style={{
                            background: 'rgba(254, 243, 199, 0.6)',
                            border: '1px solid #fde68a',
                            borderRadius: '8px',
                            padding: '12px',
                            fontSize: '13px'
                          }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                              <span style={{ fontWeight: 600, color: '#92400e' }}>{review.author_name}</span>
                              <span style={{ color: '#f59e0b' }}>{'⭐'.repeat(review.rating)}</span>
                            </div>
                            <div style={{ color: '#92400e', lineHeight: '1.4', fontStyle: 'italic' }}>
                              "{review.text}"
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </div>
  )
}

const zoomButtonStyle: React.CSSProperties = {
  width: '40px',
  height: '40px',
  background: 'rgba(255, 255, 255, 0.95)',
  border: '2px solid #e8e6e0',
  borderRadius: '12px',
  color: '#1e293b',
  cursor: 'pointer',
  fontSize: '18px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
  fontWeight: '600',
  transition: 'all 0.2s ease'
}

// Add CSS animations for restaurant results
const restaurantAnimationStyles = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .restaurant-results {
    animation: fadeInUp 0.5s ease-out;
  }
  
  .restaurant-card {
    animation: fadeInUp 0.3s ease-out;
  }
`

// Inject styles into document head
if (typeof document !== 'undefined' && !document.getElementById('restaurant-animations')) {
  const style = document.createElement('style')
  style.id = 'restaurant-animations'
  style.textContent = restaurantAnimationStyles
  document.head.appendChild(style)
}

export default SpiderWeb
