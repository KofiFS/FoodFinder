import React, { useEffect, useState } from 'react'
import { NutritionFacts, NutritionAI } from '../services/nutritionAI'
import { FoodOption } from '../types'

interface NutritionPopupProps {
  foodOption: FoodOption
  onClose: () => void
}

const NutritionPopup: React.FC<NutritionPopupProps> = ({
  foodOption,
  onClose
}) => {
  const [nutritionData, setNutritionData] = useState<NutritionFacts | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (foodOption && foodOption.name) {
      fetchNutritionData()
    }
  }, [foodOption])

  const fetchNutritionData = async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await NutritionAI.getNutritionFacts(foodOption.name, foodOption.location)
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

  if (!foodOption) return null

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
        zIndex: 10000,
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
          padding: '30px',
          maxWidth: '500px',
          width: '100%',
          maxHeight: '80vh',
          overflowY: 'auto',
          color: '#1e293b',
          position: 'relative',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)'
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
        <div style={{ marginBottom: '25px' }}>
          <h2 style={{
            margin: '0 0 8px 0',
            fontSize: '24px',
            fontWeight: '700',
            color: '#10b981',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.1)'
          }}>
            🍽️ Nutrition Facts
          </h2>
          <p style={{
            margin: 0,
            fontSize: '16px',
            color: '#475569',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.05)'
          }}>
            {foodOption.name} • {foodOption.location}
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
            <p style={{ color: '#64748b', margin: 0 }}>
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
                   color: '#64748b'
                 }}>
                   {nutritionData.healthCategory} Choice
                 </div>
              </div>
            </div>

            {/* Main nutrition facts */}
            <div style={{
              background: 'rgba(255, 255, 255, 0.8)',
              border: '2px solid #e2e8f0',
              borderRadius: '16px',
              padding: '20px',
              marginBottom: '20px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
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
                                     <div style={{ fontSize: '12px', color: '#64748b' }}>
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
                   <div style={{ fontSize: '12px', color: '#64748b' }}>
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
                                     <div style={{ fontSize: '11px', color: '#64748b' }}>
                     PROTEIN
                   </div>
                 </div>
                 <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '20px', fontWeight: '600', color: '#8b5cf6' }}>
                     {nutritionData.carbs}g
                   </div>
                   <div style={{ fontSize: '11px', color: '#64748b' }}>
                     CARBS
                   </div>
                 </div>
                 <div style={{ textAlign: 'center' }}>
                   <div style={{ fontSize: '20px', fontWeight: '600', color: '#ec4899' }}>
                     {nutritionData.fat}g
                   </div>
                   <div style={{ fontSize: '11px', color: '#64748b' }}>
                     FAT
                   </div>
                </div>
              </div>

              {/* Detailed nutrition */}
                             <div style={{
                 background: 'rgba(255, 255, 255, 0.8)',
                 borderRadius: '8px',
                 padding: '16px',
                 fontSize: '14px',
                 border: '1px solid #e2e8f0'
               }}>
                 <div style={{ fontWeight: '600', marginBottom: '12px', color: '#475569' }}>
                   Detailed Nutrition
                 </div>
                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#64748b' }}>Fiber</span>
                     <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.fiber}g</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#64748b' }}>Sugar</span>
                     <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.sugar}g</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#64748b' }}>Sodium</span>
                     <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.sodium}mg</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#64748b' }}>Cholesterol</span>
                     <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.cholesterol}mg</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                     <span style={{ color: '#64748b' }}>Sat. Fat</span>
                     <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.saturatedFat}g</span>
                   </div>
                   {nutritionData.transFat > 0 && (
                     <div style={{ display: 'flex', justifyContent: 'space-between', color: '#ef4444' }}>
                       <span style={{ color: '#64748b' }}>Trans Fat</span>
                       <span style={{ color: '#1e293b', fontWeight: '600' }}>{nutritionData.transFat}g</span>
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
                                 <div style={{ fontSize: '14px', color: '#475569' }}>
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
                     color: '#475569',
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
