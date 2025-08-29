import React, { useEffect, useState } from 'react'
import { NutritionFacts, NutritionAI } from '../services/nutritionAI'

interface NutritionPopupProps {
  isOpen: boolean
  onClose: () => void
  foodName: string
  restaurantName: string
}

const NutritionPopup: React.FC<NutritionPopupProps> = ({
  isOpen,
  onClose,
  foodName,
  restaurantName
}) => {
  const [nutritionData, setNutritionData] = useState<NutritionFacts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen && foodName) {
      fetchNutritionData()
    }
  }, [isOpen, foodName, restaurantName])

  const fetchNutritionData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await NutritionAI.getNutritionFacts(foodName, restaurantName)
      setNutritionData(data)
    } catch (err) {
      setError('Failed to load nutrition information')
      console.error('Nutrition data error:', err)
    } finally {
      setIsLoading(false)
    }
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
        background: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(8px)',
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
          background: 'rgba(255, 255, 255, 0.1)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          borderRadius: '20px',
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: 'white',
          position: 'relative'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '15px',
            right: '15px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.5)',
            borderRadius: '50%',
            width: '44px',
            height: '44px',
            color: '#fca5a5',
            fontSize: '20px',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s ease',
            zIndex: 1
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.7)'
            e.currentTarget.style.color = '#ffffff'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'
            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)'
            e.currentTarget.style.color = '#fca5a5'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#4ade80'
          }}>
            🍽️ Nutrition Facts
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: 'rgba(255, 255, 255, 0.8)'
          }}>
            {foodName} • {restaurantName}
          </p>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '20px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255, 255, 255, 0.3)',
              borderTop: '3px solid #4ade80',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            <p style={{ color: 'rgba(255, 255, 255, 0.8)', margin: 0 }}>
              🤖 AI analyzing nutrition facts...
            </p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.2)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '12px',
            padding: '20px',
            textAlign: 'center'
          }}>
            <p style={{ margin: 0, color: '#fca5a5' }}>
              ⚠️ {error}
            </p>
          </div>
        )}

        {/* Nutrition data */}
        {nutritionData && (
          <div>
            {/* Health score header */}
            <div style={{
              background: `rgba(${getHealthColor(nutritionData.healthCategory).slice(1).match(/.{2}/g)?.map(hex => parseInt(hex, 16)).join(', ')}, 0.2)`,
              border: `1px solid ${getHealthColor(nutritionData.healthCategory)}40`,
              borderRadius: '12px',
              padding: '16px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}>
              <span style={{ fontSize: '24px' }}>
                {getHealthEmoji(nutritionData.healthCategory)}
              </span>
              <div>
                <div style={{
                  fontSize: '18px',
                  fontWeight: '600',
                  color: getHealthColor(nutritionData.healthCategory)
                }}>
                  Health Score: {nutritionData.healthScore}/100
                </div>
                <div style={{
                  fontSize: '14px',
                  color: 'rgba(255, 255, 255, 0.8)'
                }}>
                  {nutritionData.healthCategory} Choice
                </div>
              </div>
            </div>

            {/* Main nutrition facts */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '20px'
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '16px',
                marginBottom: '16px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  background: 'rgba(34, 197, 94, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(34, 197, 94, 0.3)'
                }}>
                  <div style={{ fontSize: '28px', fontWeight: '700', color: '#4ade80' }}>
                    {nutritionData.calories}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    CALORIES
                  </div>
                </div>
                <div style={{
                  textAlign: 'center',
                  padding: '16px',
                  background: 'rgba(59, 130, 246, 0.1)',
                  borderRadius: '8px',
                  border: '1px solid rgba(59, 130, 246, 0.3)'
                }}>
                  <div style={{ fontSize: '16px', fontWeight: '600', color: '#60a5fa' }}>
                    {nutritionData.servingSize}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255, 255, 255, 0.7)' }}>
                    SERVING SIZE
                  </div>
                </div>
              </div>

              {/* Macronutrients */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr',
                gap: '12px',
                marginBottom: '16px'
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#f59e0b' }}>
                    {nutritionData.protein}g
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    PROTEIN
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#8b5cf6' }}>
                    {nutritionData.carbs}g
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    CARBS
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '20px', fontWeight: '600', color: '#ec4899' }}>
                    {nutritionData.fat}g
                  </div>
                  <div style={{ fontSize: '11px', color: 'rgba(255, 255, 255, 0.6)' }}>
                    FAT
                  </div>
                </div>
              </div>

              {/* Detailed nutrition */}
              <div style={{
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                padding: '16px',
                fontSize: '14px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#94a3b8' }}>
                  Detailed Nutrition
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Fiber</span>
                    <span>{nutritionData.fiber}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sugar</span>
                    <span>{nutritionData.sugar}g</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sodium</span>
                    <span>{nutritionData.sodium}mg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Cholesterol</span>
                    <span>{nutritionData.cholesterol}mg</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Sat. Fat</span>
                    <span>{nutritionData.saturatedFat}g</span>
                  </div>
                  {nutritionData.transFat > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                      <span>Trans Fat</span>
                      <span>{nutritionData.transFat}g</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Allergens */}
            {nutritionData.allergens.length > 0 && (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '8px', color: '#fbbf24' }}>
                  ⚠️ Contains Allergens
                </div>
                <div style={{ fontSize: '14px', color: 'rgba(255, 255, 255, 0.8)' }}>
                  {nutritionData.allergens.join(', ')}
                </div>
              </div>
            )}

            {/* Nutrition tips */}
            {nutritionData.nutritionTips.length > 0 && (
              <div style={{
                background: 'rgba(59, 130, 246, 0.1)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                borderRadius: '12px',
                padding: '16px'
              }}>
                <div style={{ fontWeight: '600', marginBottom: '12px', color: '#60a5fa' }}>
                  💡 Nutrition Tips
                </div>
                {nutritionData.nutritionTips.map((tip, index) => (
                  <div key={index} style={{
                    fontSize: '14px',
                    color: 'rgba(255, 255, 255, 0.8)',
                    marginBottom: '6px',
                    paddingLeft: '8px',
                    borderLeft: '2px solid rgba(59, 130, 246, 0.5)'
                  }}>
                    {tip}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default NutritionPopup
