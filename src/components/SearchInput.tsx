import React, { useState } from 'react'

interface SearchInputProps {
  onSearch: (query: string) => void
  isLoading: boolean
}

const SearchInput: React.FC<SearchInputProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      onSearch(query.trim())
    }
  }

  return (
    <div style={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      textAlign: 'center',
      zIndex: 1000
    }}>
      <div style={{
        marginBottom: '40px'
      }}>
        <h1 style={{
          fontSize: '3rem',
          fontWeight: '700',
          marginBottom: '16px',
          background: 'linear-gradient(135deg, #ffffff 0%, #cccccc 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          textAlign: 'center'
        }}>
          🍔 Food Spider Web
        </h1>
        <p style={{
          fontSize: '1.2rem',
          color: '#888',
          maxWidth: '500px',
          lineHeight: '1.6'
        }}>
          Discover food options organized in a web of price and preparation methods.
          Find the perfect meal that fits your budget and preferences.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'center',
        background: 'rgba(255, 255, 255, 0.1)',
        padding: '24px',
        borderRadius: '20px',
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        minWidth: '400px'
      }}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="What are you craving? (e.g., burger, pizza, tacos)"
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '16px 20px',
            fontSize: '16px',
            background: 'rgba(255, 255, 255, 0.9)',
            border: 'none',
            borderRadius: '12px',
            outline: 'none',
            color: '#333'
          }}
        />
        <button
          type="submit"
          disabled={isLoading || !query.trim()}
          style={{
            padding: '16px 24px',
            fontSize: '16px',
            fontWeight: '600',
            background: isLoading ? '#666' : 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            transition: 'all 0.3s ease',
            minWidth: '120px'
          }}
        >
          {isLoading ? '🕷️ Spinning Web...' : 'Explore Web'}
        </button>
      </form>
    </div>
  )
}

export default SearchInput
