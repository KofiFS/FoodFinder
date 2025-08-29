import React, { useState } from 'react';
import styled from 'styled-components';

const SearchContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 60px;
  animation: fadeInUp 0.6s ease-out;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 20px;
  }
  
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(30px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const SearchForm = styled.form`
  display: flex;
  align-items: center;
  gap: 20px;
  
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
    max-width: 400px;
  }
`;

const SearchInput = styled.input`
  width: 500px;
  height: 70px;
  padding: 0 30px;
  font-size: 18px;
  font-weight: 400;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 35px;
  background: rgba(255, 255, 255, 0.95);
  color: #1a1a1a;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  outline: none;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  backdrop-filter: blur(10px);
  
  &:focus {
    box-shadow: 0 12px 40px rgba(255, 255, 255, 0.15);
    transform: translateY(-3px);
    border-color: rgba(255, 255, 255, 0.8);
    background: rgba(255, 255, 255, 1);
  }
  
  &::placeholder {
    color: #666;
    font-weight: 300;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    height: 60px;
    padding: 0 25px;
    font-size: 16px;
  }
`;

const SearchButton = styled.button`
  padding: 0 40px;
  height: 70px;
  background: linear-gradient(135deg, #1a1a1a 0%, #333 100%);
  color: white;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 35px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  letter-spacing: 0.5px;
  min-width: 140px;
  
  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 40px rgba(255, 255, 255, 0.15);
    background: linear-gradient(135deg, #333 0%, #1a1a1a 100%);
    border-color: rgba(255, 255, 255, 0.6);
  }
  
  &:active {
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
    background: #666;
    border-color: #666;
  }
  
  @media (max-width: 768px) {
    width: 100%;
    height: 60px;
    padding: 0 30px;
    font-size: 16px;
    min-width: auto;
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: #fff;
  animation: spin 1s ease-in-out infinite;
  margin-right: 8px;
  
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface SearchBoxProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
}

const SearchBox: React.FC<SearchBoxProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && query.trim() && !isLoading) {
      onSearch(query.trim());
    }
  };

  return (
    <SearchContainer>
      <SearchForm onSubmit={handleSubmit}>
        <SearchInput
          type="text"
          placeholder="What do you want to eat? (e.g., burger from burger king)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isLoading}
        />
        <SearchButton type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoadingSpinner />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </SearchButton>
      </SearchForm>
    </SearchContainer>
  );
};

export default SearchBox;
