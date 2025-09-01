import React, { useState, useEffect } from 'react'
import { FoodOption } from '../types'
import { NutritionFacts, NutritionAI } from '../services/nutritionAI'

interface NutritionComparisonModalProps {
  isOpen: boolean
  onClose: () => void
  foodOptions: FoodOption[]
}

const NutritionComparisonModal: React.FC<NutritionComparisonModalProps> = ({
  isOpen,
  onClose,
  foodOptions
}) => {
  const [nutritionData, setNutritionData] = useState<Record<string, NutritionFacts | null>>({})
  const [isLoading, setIsLoading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    if (isOpen && foodOptions.length > 0) {
      fetchNutritionDataForAll()
    }
  }, [isOpen, foodOptions])

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

  const fetchNutritionDataForAll = async () => {
    const newLoadingState: Record<string, boolean> = {}
    const newErrors: Record<string, string> = {}
    
    // Set loading state for all options
    foodOptions.forEach(option => {
      newLoadingState[option.id] = true
    })
    setIsLoading(newLoadingState)

    // Fetch nutrition data for each option
    const promises = foodOptions.map(async (option) => {
      try {
        const data = await NutritionAI.getNutritionFacts(option.name, option.location)
        setNutritionData(prev => ({
          ...prev,
          [option.id]: data
        }))
      } catch (err) {
        newErrors[option.id] = 'Failed to load nutrition data'
        console.error(`Nutrition data error for ${option.name}:`, err)
      } finally {
        newLoadingState[option.id] = false
      }
    })

    await Promise.all(promises)
    setIsLoading(newLoadingState)
    setErrors(newErrors)
  }

  const getHealthColor = (category: string) => {
    switch (category) {
      case 'Healthy': return '#22c55e'
      case 'Moderate': return '#f59e0b'
      case 'Indulgent': return '#ef4444'
      default: return '#6b7280'
    }
  }

  const getHealthEmoji = (category: string) => {
    switch (category) {
      case 'Healthy': return '💚'
      case 'Moderate': return '💛'
      case 'Indulgent': return '🧡'
      default: return '⚪'
    }
  }

  if (!isOpen) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(253, 246, 227, 0.3)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10001,
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'rgba(253, 246, 227, 0.98)',
          backdropFilter: 'blur(20px)',
          border: '3px solid #e8e6e0',
          borderRadius: '20px',
          padding: '20px',
          maxWidth: '1000px',
          width: '100%',
          color: '#1e293b',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
        }}
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(255, 255, 255, 0.95)',
            border: '2px solid #e8e6e0',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            color: '#1e293b',
            fontSize: '18px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 1,
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
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{
            margin: '0 0 6px 0',
            fontSize: '22px',
            fontWeight: '700',
            color: '#10b981',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            🍎 Nutrition Comparison
          </h2>
          <p style={{
            margin: 0,
            fontSize: '14px',
            color: '#64748b'
          }}>
            Compare nutrition facts across {foodOptions.length} food options
          </p>
        </div>

        {/* Nutrition Comparison Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.min(foodOptions.length, 4)}, 1fr)`,
          gap: '15px',
          marginBottom: '20px'
        }}>
          {foodOptions.map((option) => {
            const nutrition = nutritionData[option.id]
            const loading = isLoading[option.id]
            const error = errors[option.id]

            return (
              <div
                key={option.id}
                style={{
                  background: 'rgba(255, 255, 255, 0.95)',
                  border: '2px solid #e8e6e0',
                  borderRadius: '16px',
                  padding: '15px',
                  minHeight: '300px',
                  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
                }}
              >
                {/* Food Header */}
                <div style={{ textAlign: 'center', marginBottom: '15px' }}>
                  <h3 style={{
                    color: '#1e293b',
                    fontSize: '16px',
                    fontWeight: '600',
                    margin: '0 0 6px 0',
                    textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
                  }}>
                    {option.name}
                  </h3>
                  <div style={{
                    color: '#64748b',
                    fontSize: '12px'
                  }}>
                    📍 {option.location}
                  </div>
                  <div style={{
                    color: '#10b981',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginTop: '6px'
                  }}>
                    ${option.price}
                  </div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 20px'
                  }}>
                    <div style={{
                      width: '40px',
                      height: '40px',
                      border: '3px solid rgba(255, 255, 255, 0.3)',
                      borderTop: '3px solid #4ade80',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '0 auto 16px'
                    }} />
                    <p style={{ color: '#64748b', margin: 0 }}>
                      🤖 AI analyzing nutrition facts...
                    </p>
                  </div>
                )}

                {/* Error State */}
                {error && !loading && (
                  <div style={{
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '2px solid #ef4444',
                    borderRadius: '12px',
                    padding: '20px',
                    textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, color: '#dc2626' }}>
                      ⚠️ {error}
                    </p>
                  </div>
                )}

                {/* Nutrition Data */}
                {nutrition && !loading && (
                  <div>
                    {/* Health Score */}
                    <div style={{
                      background: `rgba(${getHealthColor(nutrition.healthCategory).slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
                      border: `1px solid ${getHealthColor(nutrition.healthCategory)}40`,
                      borderRadius: '10px',
                      padding: '12px',
                      marginBottom: '15px',
                      textAlign: 'center'
                    }}>
                      <div style={{
                        fontSize: '20px',
                        marginBottom: '6px'
                      }}>
                        {getHealthEmoji(nutrition.healthCategory)}
                      </div>
                      <div style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: getHealthColor(nutrition.healthCategory)
                      }}>
                        Health Score: {nutrition.healthScore}/100
                      </div>
                      <div style={{
                        fontSize: '12px',
                        color: '#64748b'
                      }}>
                        {nutrition.healthCategory} Choice
                      </div>
                    </div>

                    {/* Calories & Serving */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginBottom: '15px'
                    }}>
                      <div style={{
                        background: 'rgba(34, 197, 94, 0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '20px', fontWeight: '700', color: '#4ade80' }}>
                          {nutrition.calories}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          CALORIES
                        </div>
                      </div>
                      <div style={{
                        background: 'rgba(59, 130, 246, 0.1)',
                        borderRadius: '8px',
                        padding: '12px',
                        textAlign: 'center'
                      }}>
                        <div style={{ fontSize: '14px', fontWeight: '600', color: '#60a5fa' }}>
                          {nutrition.servingSize}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>
                          SERVING
                        </div>
                      </div>
                    </div>

                    {/* Macronutrients */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: '6px',
                      marginBottom: '15px'
                    }}>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#f59e0b' }}>
                          {nutrition.protein}g
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          PROTEIN
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#8b5cf6' }}>
                          {nutrition.carbs}g
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          CARBS
                        </div>
                      </div>
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '16px', fontWeight: '600', color: '#ec4899' }}>
                          {nutrition.fat}g
                        </div>
                        <div style={{ fontSize: '10px', color: '#64748b' }}>
                          FAT
                        </div>
                      </div>
                    </div>

                    {/* Key Nutrients */}
                    <div style={{
                      background: 'rgba(255, 255, 255, 0.8)',
                      borderRadius: '8px',
                      padding: '12px',
                      fontSize: '12px',
                      border: '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontWeight: '600', marginBottom: '8px', color: '#475569' }}>
                        Key Nutrients
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Fiber</span>
                          <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutrition.fiber}g</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Sugar</span>
                          <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutrition.sugar}g</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Sodium</span>
                          <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutrition.sodium}mg</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span style={{ color: '#64748b' }}>Sat. Fat</span>
                          <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutrition.saturatedFat}g</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Summary */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.8)',
          border: '2px solid #e2e8f0',
          borderRadius: '12px',
          padding: '15px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
        }}>
          <h3 style={{
            color: '#10b981',
            fontSize: '16px',
            fontWeight: '600',
            margin: '0 0 8px 0',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            💡 Comparison Tips
          </h3>
          <p style={{
            color: '#475569',
            fontSize: '13px',
            margin: 0,
            lineHeight: '1.4'
          }}>
            Compare health scores, calories, and macronutrients to make the best choice for your dietary needs. 
            Lower calories with higher protein often indicate better nutritional value.
          </p>
        </div>

        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    </div>
  )
}

export default NutritionComparisonModal
