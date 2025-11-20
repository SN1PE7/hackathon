'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../ui/ToastProvider';

interface SearchProps {
    onLocationSelect: (location: { lat: number; lng: number; display: string } | null) => void;
}

const Search: React.FC<SearchProps> = ({ onLocationSelect }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState('Chọn vị trí');
  const options = ['Chọn vị trí', 'Vị trí hiện tại'];

  const [inputValue, setInputValue] = useState('');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<{ lat: number, lng: number } | null>(null);
  const fromSuggestion = useRef(false);
  const { addToast } = useToast();

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
        addToast('Đang lấy vị trí của bạn...', 'warning');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            const { latitude, longitude, accuracy } = position.coords;
            const newLocation = { 
              lat: latitude, 
              lng: longitude, 
              display: 'Vị trí hiện tại của bạn' 
            };
            setSelectedLocation(newLocation);
            onLocationSelect(newLocation);
            fromSuggestion.current = true;
            setInputValue('Vị trí hiện tại của bạn');
            addToast(`Lấy vị trí thành công (độ chính xác: ±${Math.round(accuracy)}m)`, 'success');
            console.log('Current coordinates:', newLocation);
          },
          (error) => {
            console.error('Error getting current location:', error);
            
            let errorMessage = 'Không thể lấy được vị trí hiện tại.';
            switch(error.code) {
              case error.PERMISSION_DENIED:
                errorMessage = 'Bạn đã từ chối cấp quyền truy cập vị trí. Vui lòng kiểm tra cài đặt trình duyệt.';
                break;
              case error.POSITION_UNAVAILABLE:
                errorMessage = 'Không thể xác định vị trí hiện tại. Vui lòng thử lại.';
                break;
              case error.TIMEOUT:
                errorMessage = 'Hết thời gian chờ lấy vị trí. Vui lòng thử lại.';
                break;
            }
            addToast(errorMessage, 'danger');
          },
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
          }
        );
      } else {
        addToast('Trình duyệt của bạn không hỗ trợ Geolocation.', 'danger');
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
          const newLocation = { lat: data.lat, lng: data.lng, display: suggestion.display};
          setSelectedLocation(newLocation);
          onLocationSelect(newLocation);
          console.log('Selected coordinates:', newLocation);
        }
      } catch (error) {
        console.error('Error fetching place details:', error);
        addToast('Lỗi khi lấy thông tin địa điểm', 'danger');
      }
    }
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center border border-gray-200 rounded-lg w-full bg-white gap-2 sm:gap-0">
      <div className="relative flex-shrink-0">
        <div
          className="flex items-center p-3 bg-white cursor-pointer rounded-l-lg hover:bg-gray-50 transition"
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-gray-600 flex-shrink-0">
              <path d="M10 3H4C3.44772 3 3 3.44772 3 4V10C3 10.5523 3.44772 11 4 11H10C10.5523 11 11 10.5523 11 10V4C11 3.44772 10.5523 3 10 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 3H14C13.4477 3 13 3.44772 13 4V10C13 10.5523 13.4477 11 14 11H20C20.5523 11 21 10.5523 21 10V4C21 3.44772 20.5523 3 20 3Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M10 13H4C3.44772 13 3 13.4477 3 14V20C3 20.5523 3.44772 21 4 21H10C10.5523 21 11 20.5523 11 20V14C11 13.4477 10.5523 13 10 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M20 13H14C13.4477 13 13 13.4477 13 14V20C13 20.5523 13.4477 21 14 21H20C20.5523 21 21 20.5523 21 20V14C21 13.4477 20.5523 13 20 13Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          <span className="ml-2 text-gray-700 whitespace-nowrap text-sm md:text-base">{selectedOption}</span>
          <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ml-1 text-gray-600 transition-transform duration-200 flex-shrink-0 ${isDropdownOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
        {isDropdownOpen && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-9999">
            {options.map((option) => (
              <div
                key={option}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                onClick={() => handleOptionClick(option)}
              >
                {option}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="hidden sm:block w-px bg-gray-300 h-6 self-center"></div>
      <div className="relative flex-1 min-w-0">
        <input
          type="text"
          placeholder="Nhập địa điểm bạn muốn bắt đầu"
          className="px-4 py-3 w-full focus:outline-none rounded-r-md sm:rounded-r-0 text-sm md:text-base"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
        />
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-9999 max-h-60 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={index}
                className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
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