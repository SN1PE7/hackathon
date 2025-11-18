'use client';
import React, { useRef } from 'react';
import PlaceCard from './PlaceCard';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';

interface Place {
  id: number;
  // Add other place properties as needed
  tags: any;
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
    <div className="mb-8 max-w-6xl mx-auto px-4">
      <div className="mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold">{title}</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => scroll(-500)}
            className="bg-white w-9 h-9 flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition cursor-pointer"
            aria-label="Scroll Left"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="text-gray-700" />
          </button>
          <button
            onClick={() => scroll(500)}
            className="bg-white w-9 h-9 flex items-center justify-center rounded-full shadow-md hover:bg-gray-100 transition cursor-pointer"
            aria-label="Scroll Right"
          >
            <FontAwesomeIcon icon={faChevronRight} className="text-gray-700" />
          </button>
        </div>
      </div>
      <div
        ref={scrollContainerRef}
        className="flex space-x-4 overflow-x-auto pb-4 hide-scrollbar"
      >
        {items.map((place) => (
          <PlaceCard key={place.id} place={place} />
        ))}
      </div>
    </div>
  );
};

export default PlaceCategoryRow;
