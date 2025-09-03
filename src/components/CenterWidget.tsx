import React from 'react'
import { FoodOption, Position } from '../types'

interface CenterWidgetProps {
  centerPos: Position
  selectedCenter: FoodOption | null
  searchQuery: string
  filteredCount: number
  page: number
  onRandomize: () => void
  onShowMore: () => void
}

export const CenterWidget: React.FC<CenterWidgetProps> = ({
  centerPos,
  selectedCenter,
  searchQuery,
  filteredCount,
  page,
  onRandomize,
  onShowMore
}) => {
  return (
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
        onClick={onRandomize}
      >
        <div style={{ lineHeight: '1.2' }}>
          {selectedCenter ? selectedCenter.name : searchQuery}
        </div>
      </div>

      {filteredCount > 24 && (
        <button
          onClick={onShowMore}
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
        >
          🔄 More Options ({page})
        </button>
      )}
    </div>
  )
}

export default CenterWidget



