import React, { useState, useEffect } from 'react'
import { FoodOption } from '../types'
import NutritionComparisonModal from './NutritionComparisonModal'

interface ComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  selectedOptions: FoodOption[]
  aiRecommendation: string | null
}

const ComparisonModal: React.FC<ComparisonModalProps> = ({
  isOpen,
  onClose,
  selectedOptions,
  aiRecommendation
}) => {
  const [showNutritionComparison, setShowNutritionComparison] = useState(false)

  // Disable scrolling and dragging when modal is open
  useEffect(() => {
    if (isOpen) {
      // Disable body scrolling
      document.body.style.overflow = 'hidden'
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'
      
      return () => {
        // Re-enable body scrolling when modal closes
        document.body.style.overflow = ''
        document.body.style.userSelect = ''
        document.body.style.webkitUserSelect = ''
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Premium': return '#ef4444'
      case 'Budget': return '#10b981'
      case 'Mid-Range': return '#f59e0b'
      default: return '#6b7280'
    }
  }



  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(253, 246, 227, 0.3)',
        backdropFilter: 'blur(10px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(253, 246, 227, 0.98)',
          border: '3px solid #e8e6e0',
          borderRadius: '24px',
          padding: '30px',
          maxWidth: '1200px',
          minHeight: '900px',
          backdropFilter: 'blur(20px)',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            border: '2px solid #e8e6e0',
            background: 'rgba(255, 255, 255, 0.95)',
            color: '#1e293b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '600',
            transition: 'all 0.2s ease',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.9)'
            e.currentTarget.style.color = 'white'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(255, 255, 255, 0.95)'
            e.currentTarget.style.color = '#1e293b'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{
            color: '#1e293b',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 10px 0',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            ⚖️ Food Comparison
          </h2>
          <p style={{
            color: '#475569',
            fontSize: '16px',
            margin: 0,
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            AI analyzed nutrition and cost to find your best option
          </p>
        </div>

        {/* Comparison Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(selectedOptions.length, 2)}, 1fr)`,
            gap: '20px',
            marginBottom: '30px'
          }}
        >
          {selectedOptions.map((option) => {
            const isRecommended = aiRecommendation === option.id
            
            return (
              <div
                key={option.id}
                style={{
                  background: isRecommended 
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.15) 0%, rgba(255, 193, 7, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.95)',
                  border: isRecommended 
                    ? '3px solid #f59e0b'
                    : '2px solid #e8e6e0',
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  transition: 'all 0.3s ease',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* AI Recommendation Badge */}
                {isRecommended && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '-10px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                      color: 'white',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(245, 158, 11, 0.4)',
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.2)'
                    }}
                  >
                    🏆 RECOMMENDED
                  </div>
                )}

                {/* Food Info */}
                <div style={{ marginTop: isRecommended ? '20px' : '0' }}>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    marginBottom: '12px'
                  }}>
                    <span style={{ fontSize: '24px' }}>🍔</span>
                    <h3 style={{
                      color: isRecommended ? '#f59e0b' : '#1e293b',
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: 0,
                      textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                    }}>
                      {option.name}
                    </h3>
                  </div>

                  <div style={{
                    color: '#64748b',
                    fontSize: '14px',
                    marginBottom: '15px'
                  }}>
                    📍 {option.location}
                  </div>

                  {/* Stats Grid */}
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '15px'
                  }}>
                    {/* Price */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ color: '#10b981', fontSize: '20px', fontWeight: '700' }}>
                        {option.priceLevel ? ['$', '$$', '$$$', '$$$$'][option.priceLevel - 1] : '$'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>
                        Price
                      </div>
                    </div>

                    {/* Type - Removed since we no longer have type distinctions */}

                    {/* Category */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ 
                        color: getCategoryColor(option.category), 
                        fontSize: '14px', 
                        fontWeight: '600' 
                      }}>
                        {option.category}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '11px' }}>
                        Category
                      </div>
                    </div>

                    {/* Review Score */}
                    {option.realRestaurantData && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0',
                        marginBottom: '8px'
                      }}>
                        <div style={{ color: '#3b82f6', fontSize: '14px', fontWeight: '600' }}>
                          ⭐ {option.realRestaurantData.rating}/5
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          Rating
                        </div>
                      </div>
                    )}
                    
                    {/* Match Percentage */}
                    {option.confidence && (
                      <div style={{
                        background: 'rgba(255, 255, 255, 0.8)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center',
                        border: '1px solid #e2e8f0'
                      }}>
                        <div style={{ color: '#10b981', fontSize: '14px', fontWeight: '600' }}>
                          {option.confidence}% match
                        </div>
                        <div style={{ color: '#64748b', fontSize: '11px' }}>
                          Match
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>



        {/* AI Analysis Summary */}
        {aiRecommendation && (
          <div style={{
            background: 'rgba(255, 215, 0, 0.1)',
            border: '2px solid #f59e0b',
            borderRadius: '16px',
            padding: '20px',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.1)'
          }}>
            <h3 style={{
              color: '#f59e0b',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 10px 0',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
            }}>
              🤖 AI Analysis
            </h3>
            <p style={{
              color: '#475569',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Based on review ratings, match percentage, and price level, 
              <strong style={{ color: '#f59e0b' }}> {selectedOptions.find(o => o.id === aiRecommendation)?.name}</strong> 
              {' '}offers the best overall value. It provides optimal balance of customer satisfaction, 
              craving match, and affordability for your needs.
            </p>
          </div>
        )}

        {/* Nutrition Comparison Modal */}
        <NutritionComparisonModal
          isOpen={showNutritionComparison}
          onClose={() => setShowNutritionComparison(false)}
          foodOptions={selectedOptions}
        />
      </div>
    </div>
  )
}

export default ComparisonModal
