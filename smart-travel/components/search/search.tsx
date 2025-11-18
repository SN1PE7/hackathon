'use client';
import React, { useState, useEffect, useRef } from 'react';

interface SearchProps {
    onLocationSelect: (location: { lat: number; lng: number } | null) => void;
}

const Search: React.FC<SearchProps> = ({ onLocationSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Chọn vị trí');
  const options = ['Chọn vị trí', 'Vị trí hiện tại'];

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const fromSuggestion = useRef(false);

  const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;

  useEffect(() => {
    if (fromSuggestion.current) {
        fromSuggestion.current = false;
        return;
    }
    if (inputValue.trim() === '') {
      setSuggestions([]);
      return;
    }

    const debounceTimeout = setTimeout(() => {
      fetch(`https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIETMAP_API_KEY}&text=${inputValue}`)
        .then(response => response.json())
        .then(data => {
          setSuggestions(data);
        })
        .catch(error => console.error('Error fetching suggestions:', error));
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [inputValue]);


  const handleOptionClick = (option: string) => {
    setSelectedOption(option);
    setIsDropdownOpen(false);

    if (option === 'Vị trí hiện tại') {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const newLocation = { lat: latitude, lng: longitude };
            setSelectedLocation(newLocation);
            onLocationSelect(newLocation);
            fromSuggestion.current = true;
            setInputValue('Vị trí hiện tại của bạn');
            console.log('Current coordinates:', newLocation);
          },
          (error) => {
            console.error('Error getting current location:', error);
            alert('Không thể lấy được vị trí hiện tại. Vui lòng kiểm tra quyền truy cập vị trí của trình duyệt.');
          }
        );
      } else {
        alert('Trình duyệt của bạn không hỗ trợ Geolocation.');
      }
    }
  };

  const handleSuggestionClick = async (suggestion: any) => {
    fromSuggestion.current = true;
    setInputValue(suggestion.display);
    setSuggestions([]);

    if (suggestion.ref_id) {
      try {
        const response = await fetch(`https://maps.vietmap.vn/api/place/v4?apikey=${VIETMAP_API_KEY}&refid=${suggestion.ref_id}`);
        const data = await response.json();
        if (data && data.lat && data.lng) {
          const newLocation = { lat: data.lat, lng: data.lng };
          setSelectedLocation(newLocation);
          onLocationSelect(newLocation);
          console.log('Selected coordinates:', newLocation);
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    }
  };

  return (
    <div className="flex items-center border border-gray-200 rounded-lg w-full max-w-6xl bg-white mx-auto">
      <div className="relative">
        <div
          className="flex items-center p-3 bg-white cursor-pointer rounded-l-lg"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600">
              <path d="M10 3H4C3.44772 3 3 3.44772 3 4V10C3 10.5523 3.44772 11 4 11H10C10.5523 11 11 10.5523 11 10V4C11 3.44772 10.5523 3 10 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 3H14C13.4477 3 13 3.44772 13 4V10C13 10.5523 13.4477 11 14 11H20C20.5523 11 21 10.5523 21 10V4C21 3.44772 20.5523 3 20 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13H4C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H10C10.5523 21 11 20.5523 11 20V14C11 13.4477 10.5523 13 10 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 13H14C13.4477 13 13 13.4477 13 14V20C13 20.5523 13.4477 21 14 21H20C20.5523 21 21 20.5523 21 20V14C21 13.4477 20.5523 13 20 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2 text-gray-700 whitespace-nowrap">{selectedOption}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 text-gray-600 transition-transform duration-200 ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10">
            {options.map((option) => (
              <div
                key={option}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="w-px bg-gray-300 h-6 self-center"></div>
      <div className="relative w-full">
        <input
          type="text"
          placeholder="Nhập địa điểm bạn muốn bắt đầu"
          className="px-4 py-3 w-full focus:outline-none rounded-r-md"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-20">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion.display}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
