'use client';
import React, { useState, useRef, useEffect } from 'react';
import { categoriesData } from './categoryData';

interface CategoryProps {
    selectedCategories: string[];
    onCategoryChange: (category: string) => void;
    radius: number | null;
    onRadiusChange: (radius: number | null) => void;
    onSearch: () => void;
}

const translations: { [key: string]: string } = {
    amenity: "Tiện nghi",
    historic: "Lịch sử",
    leisure: "Giải trí",
    tourism: "Du lịch",
    restaurant: "Nhà hàng",
    cafe: "Quán cà phê",
    theatre: "Nhà hát",
    cinema: "Rạp chiếu phim",
    library: "Thư viện",
    monument: "Di tích",
    church: "Nhà thờ",
    building: "Tòa nhà",
    park: "Công viên",
    playground: "Sân chơi",
    stadium: "Sân vận động",
    apartment: "Căn hộ",
    aquarium: "Thủy cung",
    artwork: "Tác phẩm nghệ thuật",
    attraction: "Điểm tham quan",
    gallery: "Phòng trưng bày",
    museum: "Bảo tàng",
    theme_park: "Công viên giải trí",
    viewpoint: "Điểm ngắm cảnh",
};


const Category: React.FC<CategoryProps> = ({ selectedCategories, onCategoryChange, radius, onRadiusChange, onSearch }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleCategoryChange = (category: string) => {
    onCategoryChange(category);
  };

  const displaySelected = () => {
    if (selectedCategories.length === 0) {
      return 'Chọn loại địa điểm';
    }
    const translatedSelection = selectedCategories.map(c => translations[c] || c);
    if (translatedSelection.length > 2) {
      return `${translatedSelection.slice(0, 2).join(', ')} và ${translatedSelection.length - 2} khác`;
    }
    return translatedSelection.join(', ');
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownRef]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-2">
        <div className="relative w-full" ref={dropdownRef}>
          <button
              onClick={() => setIsOpen(!isOpen)}
              className="w-full p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center"
          >
              <span>{displaySelected()}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 transition-transform duration-200 ${isOpen ? 'transform rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
          </button>

          {isOpen && (
              <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
              {Object.entries(categoriesData).map(([group, items]) => (
                  <div key={group} className="p-2">
                  <h3 className="text-sm font-semibold capitalize text-gray-500 px-2 pt-2">{translations[group] || group}</h3>
                  <ul>
                      {items.map(item => (
                      <li
                          key={item}
                          className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                          onClick={() => handleCategoryChange(item)}
                      >
                          <input
                          type="checkbox"
                          checked={selectedCategories.includes(item)}
                          onChange={() => {}}
                          className="mr-3 h-4 w-4"
                          />
                          <span className="capitalize">{translations[item] || item}</span>
                      </li>
                      ))}
                  </ul>
                  </div>
              ))}
              </div>
          )}
        </div>
        <input
            type="number"
            placeholder="Bán kính (m)"
            value={radius === null ? '' : radius}
            onChange={(e) => onRadiusChange(e.target.value === '' ? null : Number(e.target.value))}
            className="p-3 bg-white border border-gray-200 rounded-lg w-48"
        />
        <button 
            onClick={onSearch}
            className="flex items-center bg-[#333333] text-white px-6 py-3 rounded-lg hover:bg-[#555555] focus:outline-none whitespace-nowrap cursor-pointer duration-300">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="ml-2 font-semibold">Tìm kiếm</span>
        </button>
      </div>
    </div>
  );
};

export default Category;
