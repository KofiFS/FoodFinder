import React from 'react'
import { Position } from '../types'

interface WebConnectionProps {
  start: Position
  end: Position
  isActive: boolean
  containerWidth: number
  containerHeight: number
}

const WebConnection: React.FC<WebConnectionProps> = ({ 
  start, 
  end, 
  isActive, 
  containerWidth, 
  containerHeight 
}) => {
  // Convert percentage positions to actual pixels
  const startPx = {
    x: (start.x / 100) * containerWidth,
    y: (start.y / 100) * containerHeight
  }
  
  const endPx = {
    x: (end.x / 100) * containerWidth,
    y: (end.y / 100) * containerHeight
  }

  // Calculate line properties
  const deltaX = endPx.x - startPx.x
  const deltaY = endPx.y - startPx.y
  const length = Math.sqrt(deltaX * deltaX + deltaY * deltaY)
  const angle = Math.atan2(deltaY, deltaX) * (180 / Math.PI)

  return (
    <svg
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 5
      }}
    >
      {/* Main connection line */}
      <line
        x1={startPx.x}
        y1={startPx.y}
        x2={endPx.x}
        y2={endPx.y}
        stroke={isActive ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)'}
        strokeWidth={isActive ? '3' : '2'}
        strokeDasharray={isActive ? 'none' : '5,5'}
        style={{
          filter: isActive 
            ? 'drop-shadow(0 0 10px rgba(255,255,255,0.5))' 
            : 'drop-shadow(0 0 5px rgba(255,255,255,0.2))',
          transition: 'all 0.4s ease'
        }}
      />
      
      {/* Center node connection point */}
      <circle
        cx={startPx.x}
        cy={startPx.y}
        r={isActive ? '8' : '5'}
        fill={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
        style={{
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))',
          transition: 'all 0.4s ease'
        }}
      />
      
      {/* Food card connection point */}
      <circle
        cx={endPx.x}
        cy={endPx.y}
        r={isActive ? '6' : '4'}
        fill={isActive ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.4)'}
        style={{
          filter: 'drop-shadow(0 0 6px rgba(255,255,255,0.6))',
          transition: 'all 0.4s ease'
        }}
      />
      
      {/* Animated traveling particles */}
      {Array.from({ length: isActive ? 3 : 1 }, (_, i) => {
        const uniqueId = `particle-${start.x}-${start.y}-${end.x}-${end.y}-${i}`
        return (
          <circle
            key={uniqueId}
            cx={startPx.x}
            cy={startPx.y}
            r={isActive ? '4' : '2'}
            fill={isActive ? 'rgba(74, 222, 128, 0.9)' : 'rgba(255,255,255,0.6)'}
            style={{
              filter: isActive 
                ? 'drop-shadow(0 0 8px rgba(74, 222, 128, 0.8))' 
                : 'drop-shadow(0 0 4px rgba(255,255,255,0.6))',
              transformOrigin: `${startPx.x}px ${startPx.y}px`,
              animation: `travelLine-${uniqueId} ${isActive ? '2s' : '4s'} ease-in-out infinite ${i * 0.67}s`
            }}
          >
            <animateTransform
              attributeName="transform"
              type="translate"
              values={`0,0; ${deltaX},${deltaY}; 0,0`}
              dur={isActive ? '2s' : '4s'}
              repeatCount="indefinite"
              begin={`${i * 0.67}s`}
            />
            <animate
              attributeName="opacity"
              values="0;1;1;0"
              dur={isActive ? '2s' : '4s'}
              repeatCount="indefinite"
              begin={`${i * 0.67}s`}
            />
            <animate
              attributeName="r"
              values="1;4;3;1"
              dur={isActive ? '2s' : '4s'}
              repeatCount="indefinite"
              begin={`${i * 0.67}s`}
            />
          </circle>
        )
      })}

      {/* Animated pulse effect for active connections */}
      {isActive && (
        <>
          <circle
            cx={startPx.x}
            cy={startPx.y}
            r="12"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            style={{
              animation: 'pulse 2s ease-in-out infinite'
            }}
          />
          <circle
            cx={endPx.x}
            cy={endPx.y}
            r="10"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="2"
            style={{
              animation: 'pulse 2s ease-in-out infinite 0.5s'
            }}
          />
        </>
      )}
      
      {/* CSS Animation for pulse effect */}
      <defs>
        <style>
          {`
            @keyframes pulse {
              0% { opacity: 0; transform: scale(0.8); }
              50% { opacity: 1; transform: scale(1.2); }
              100% { opacity: 0; transform: scale(1.5); }
            }
          `}
        </style>
      </defs>
    </svg>
  )
}

export default WebConnection
