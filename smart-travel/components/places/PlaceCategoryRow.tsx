'use client';
import React, { useRef } from 'react';
import PlaceCard from './PlaceCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface Place {
  id: number;
  lat: number;
  lon: number;
  // Add other place properties as needed
  tags: {
    name?: string;
    'name:vi'?: string;
    "addr:street"?: string;
    "addr:housenumber"?: string;
    "addr:city"?: string;
    opening_hours?: string;
    website?: string;
  };
}

interface PlaceCategoryRowProps {
  title: string;
  items: Place[];
}

const PlaceCategoryRow: React.FC<PlaceCategoryRowProps> = ({ title, items }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (scrollOffset: number) => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <div className="mb-6 sm:mb-8 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-3 sm:mb-4 flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll(-500)}
            className="bg-white w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition cursor-pointer flex-shrink-0"
            aria-label="Scroll Left"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-gray-700 text-sm sm:text-base" />
          </button>
          <button
            onClick={() => scroll(500)}
            className="bg-white w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition cursor-pointer flex-shrink-0"
            aria-label="Scroll Right"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-gray-700 text-sm sm:text-base" />
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex space-x-3 sm:space-x-4 overflow-x-auto pb-4 hide-scrollbar"
      >
        {items.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
};

export default PlaceCategoryRow;
