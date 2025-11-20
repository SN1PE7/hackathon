'use client';
import React, { useState, useEffect, useRef } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSearch, faPlus, faTimes, faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';
import { useSelection } from '@/context/SelectionContext';
import { useToast } from '@/components/ui/ToastProvider';

interface PlaceSearchBarProps {
  onPlaceAdded?: () => void;
}

interface Suggestion {
  ref_id: string;
  display: string;
  lat?: number;
  lng?: number;
}

interface PlaceDetail {
  lat: number;
  lng: number;
  name?: string;
  display?: string;
}

const PlaceSearchBar: React.FC<PlaceSearchBarProps> = ({ onPlaceAdded }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<PlaceDetail | null>(null);
  const { addToSelection } = useSelection();
  const { addToast } = useToast();
  const debounceTimerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const suggestionsRef = useRef<HTMLDivElement | null>(null);

  const VIETMAP_API_KEY = process.env.NEXT_PUBLIC_VIETMAP_API_KEY;

  // Fetch suggestions from Vietmap API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetch(
        `https://maps.vietmap.vn/api/autocomplete/v3?apikey=${VIETMAP_API_KEY}&text=${encodeURIComponent(
          searchQuery
        )}`
      )
        .then((response) => response.json())
        .then((data) => {
          setSuggestions(data || []);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error('Error fetching suggestions:', error);
          addToast('Không thể tải gợi ý địa điểm', 'danger');
          setIsLoading(false);
        });
    }, 300);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [searchQuery, VIETMAP_API_KEY, addToast]);

  // Fetch place details from Vietmap API
  const fetchPlaceDetails = async (refId: string, display: string) => {
    try {
      const response = await fetch(
        `https://maps.vietmap.vn/api/place/v4?apikey=${VIETMAP_API_KEY}&refid=${refId}`
      );
      const data = await response.json();

      if (data && data.lat && data.lng) {
        const placeDetail: PlaceDetail = {
          lat: data.lat,
          lng: data.lng,
          name: data.name || display,
          display: display,
        };
        setSelectedPlace(placeDetail);
        return placeDetail;
      }
    } catch (error) {
      console.error('Error fetching place details:', error);
      addToast('Không thể tải chi tiết địa điểm', 'danger');
    }
  };

  const handleSuggestionClick = async (suggestion: Suggestion) => {
    setSearchQuery(suggestion.display);
    setSuggestions([]);
    await fetchPlaceDetails(suggestion.ref_id, suggestion.display);
  };

  const handleAddToRoute = () => {
    if (!selectedPlace) {
      addToast('Vui lòng chọn một địa điểm', 'warning');
      return;
    }

    try {
      addToSelection({
        lat: selectedPlace.lat,
        lon: selectedPlace.lng,
        tags: { name: selectedPlace.name ?? selectedPlace.display ?? '' },
      });

      addToast(`Đã thêm "${selectedPlace.display}" vào lộ trình`, 'success');
      setSearchQuery('');
      setSelectedPlace(null);
      setSuggestions([]);
      onPlaceAdded?.();
    } catch (error) {
      console.error('Error adding place to selection:', error);
      addToast('Lỗi khi thêm địa điểm', 'danger');
    }
  };

  const handleClear = () => {
    setSearchQuery('');
    setSelectedPlace(null);
    setSuggestions([]);
  };

  return (
    <div className="w-full relative">
      {/* Header toggle */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between bg-white hover:bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-3 md:p-4 transition"
      >
        <span className="text-gray-700 font-medium text-xs sm:text-sm md:text-base truncate">Bạn muốn thêm địa điểm đã biết trước?</span>
        <FontAwesomeIcon
          icon={isOpen ? faChevronUp : faChevronDown}
          className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500 transition-transform shrink-0 ml-2"
        />
      </button>

      {/* Expandable content */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-0 bg-white border border-gray-300 rounded-lg p-3 sm:p-4 md:p-5 space-y-3 sm:space-y-4 shadow-xl z-9999">
          <div className="relative">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-300 rounded-lg p-2 sm:p-3">
              <FontAwesomeIcon icon={faSearch} className="text-gray-400 h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <input
                type="text"
                placeholder="Nhập tên địa điểm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent focus:outline-none text-gray-700 text-xs sm:text-sm md:text-base"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="text-gray-400 hover:text-gray-600 transition shrink-0"
                >
                  <FontAwesomeIcon icon={faTimes} className="h-3 w-3 sm:h-4 sm:w-4" />
                </button>
              )}
              {isLoading && (
                <div className="animate-spin shrink-0">
                  <FontAwesomeIcon icon={faSearch} className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
                </div>
              )}
            </div>

            {/* Suggestions dropdown - positioned below input */}
            {suggestions.length > 0 && !selectedPlace && (
              <div
                ref={suggestionsRef}
                className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-b-lg shadow-2xl z-9999 max-h-96 overflow-y-auto w-full"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 hover:bg-blue-50 border-b border-gray-200 last:border-b-0 transition flex items-center justify-between group"
                  >
                    <span className="text-gray-700 truncate text-xs sm:text-sm md:text-base">{suggestion.display}</span>
                    <FontAwesomeIcon
                      icon={faPlus}
                      className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 group-hover:text-blue-500 transition opacity-0 group-hover:opacity-100 shrink-0 ml-2"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Selected place info */}
          {selectedPlace && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
              <div className="mb-3">
                <h4 className="font-semibold text-gray-800 mb-1 text-xs sm:text-sm md:text-base">Địa điểm được chọn:</h4>
                <p className="text-gray-700 text-xs sm:text-sm md:text-base">{selectedPlace.display}</p>
                <p className="text-xs sm:text-sm text-gray-500 mt-1">
                  Tọa độ: {selectedPlace.lat.toFixed(4)}, {selectedPlace.lng.toFixed(4)}
                </p>
              </div>
              <button
                onClick={handleAddToRoute}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition text-xs sm:text-sm md:text-base"
              >
                <FontAwesomeIcon icon={faPlus} className="h-3 w-3 sm:h-4 sm:w-4" />
                Thêm vào lộ trình
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PlaceSearchBar;
