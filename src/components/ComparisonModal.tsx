import React from 'react'
import { FoodOption } from '../types'

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
  if (!isOpen) return null

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Premium': return '#ef4444'
      case 'Budget': return '#10b981'
      case 'Mid-Range': return '#f59e0b'
      default: return '#6b7280'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Make': return '🍳'
      case 'Premade': return '📦'
      case 'Prepared': return '🍽️'
      default: return '🍔'
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
        background: 'rgba(0, 0, 0, 0.8)',
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
          background: 'rgba(20, 20, 20, 0.95)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '1000px',
          maxHeight: '80vh',
          overflow: 'auto',
          backdropFilter: 'blur(20px)',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            width: '30px',
            height: '30px',
            borderRadius: '50%',
            border: 'none',
            background: 'rgba(239, 68, 68, 0.8)',
            color: 'white',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            transition: 'all 0.2s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 1)'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.8)'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ×
        </button>

        {/* Header */}
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{
            color: 'white',
            fontSize: '28px',
            fontWeight: '700',
            margin: '0 0 10px 0'
          }}>
            ⚖️ Food Comparison
          </h2>
          <p style={{
            color: 'rgba(255, 255, 255, 0.7)',
            fontSize: '16px',
            margin: 0
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
                    ? 'linear-gradient(135deg, rgba(255, 215, 0, 0.2) 0%, rgba(255, 193, 7, 0.1) 100%)'
                    : 'rgba(255, 255, 255, 0.05)',
                  border: isRecommended 
                    ? '3px solid #ffd700'
                    : '2px solid rgba(255, 255, 255, 0.2)',
                  borderRadius: '16px',
                  padding: '20px',
                  position: 'relative',
                  transition: 'all 0.3s ease'
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
                      background: 'linear-gradient(135deg, #ffd700 0%, #ffb300 100%)',
                      color: '#000',
                      padding: '6px 16px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: '700',
                      boxShadow: '0 4px 15px rgba(255, 215, 0, 0.4)'
                    }}
                  >
                    🏆 AI RECOMMENDED
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
                    <span style={{ fontSize: '24px' }}>{getTypeIcon(option.type)}</span>
                    <h3 style={{
                      color: isRecommended ? '#ffd700' : 'white',
                      fontSize: '18px',
                      fontWeight: '600',
                      margin: 0
                    }}>
                      {option.name}
                    </h3>
                  </div>

                  <div style={{
                    color: 'rgba(255, 255, 255, 0.8)',
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
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#10b981', fontSize: '20px', fontWeight: '700' }}>
                        ${option.price}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                        Price
                      </div>
                    </div>

                    {/* Type */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#f59e0b', fontSize: '14px', fontWeight: '600' }}>
                        {option.type}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                        Type
                      </div>
                    </div>

                    {/* Category */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ 
                        color: getCategoryColor(option.category), 
                        fontSize: '14px', 
                        fontWeight: '600' 
                      }}>
                        {option.category}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                        Category
                      </div>
                    </div>

                    {/* Health Score */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.1)',
                      borderRadius: '8px',
                      padding: '12px',
                      textAlign: 'center'
                    }}>
                      <div style={{ color: '#22c55e', fontSize: '14px', fontWeight: '600' }}>
                        {option.type === 'Make' ? '85%' : option.type === 'Premade' ? '70%' : '60%'}
                      </div>
                      <div style={{ color: 'rgba(255, 255, 255, 0.6)', fontSize: '11px' }}>
                        Health Score
                      </div>
                    </div>
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
            border: '1px solid rgba(255, 215, 0, 0.3)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <h3 style={{
              color: '#ffd700',
              fontSize: '18px',
              fontWeight: '600',
              margin: '0 0 10px 0'
            }}>
              🤖 AI Analysis
            </h3>
            <p style={{
              color: 'rgba(255, 255, 255, 0.8)',
              fontSize: '14px',
              margin: 0,
              lineHeight: '1.5'
            }}>
              Based on nutrition quality, cost-effectiveness, and preparation type, 
              <strong style={{ color: '#ffd700' }}> {selectedOptions.find(o => o.id === aiRecommendation)?.name}</strong> 
              {' '}offers the best overall value. It provides optimal balance of health benefits, 
              affordability, and convenience for your needs.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default ComparisonModal
