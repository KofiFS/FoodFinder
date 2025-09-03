import React from 'react'

interface WebControlsProps {
  onZoomIn: () => void
  onZoomOut: () => void
}

const buttonStyle: React.CSSProperties = {
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

export const WebControls: React.FC<WebControlsProps> = ({ onZoomIn, onZoomOut }) => {
  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 20000,
      display: 'flex',
      gap: '8px'
    }}>
      <button onClick={onZoomOut} style={buttonStyle}>−</button>
      <button onClick={onZoomIn} style={buttonStyle}>+</button>
    </div>
  )
}

export default WebControls



