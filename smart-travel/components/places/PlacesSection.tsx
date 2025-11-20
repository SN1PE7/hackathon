'use client';
import React from 'react';
import PlaceCategoryRow from './PlaceCategoryRow';

// ... (interface definitions remain the same) ...
interface Place {
  id: number;
  type: string;
  lat: number;
  lon: number;
  tags: {
    name?: string;
    'name:vi'?: string;
    'addr:street'?: string;
    'addr:housenumber'?: string;
    'addr:city'?: string;
    opening_hours?: string;
    website?: string;
    [key: string]: any;
  };
}

interface PlacesSectionProps {
  places: Place[];
  loading: boolean;
}


const PlacesSection: React.FC<PlacesSectionProps> = ({ places, loading }) => {
  if (loading) {
    return (
      <div className="max-w-6xl h-screen mx-auto mt-4 sm:mt-6 md:mt-8 px-4 text-center">
        <p className="text-sm md:text-base">Đang tìm kiếm địa điểm...</p>
      </div>
    );
  }

  if (places.length === 0) {
    return (
        <div className="text-center h-screen mt-8 sm:mt-12 px-4">
            <img src="/travel.gif" alt="Travel Animation" className="mx-auto w-64 sm:w-80 md:w-96 h-64 sm:h-80 md:h-96" />
            <p className="mt-4 text-sm sm:text-base md:text-lg text-gray-600 px-2">
                Vui lòng chọn địa điểm, danh mục và bán kính để bắt đầu khám phá!
            </p>
        </div>
    );
  }

  const groupedPlaces: { [key: string]: Place[] } = {};
  const mainCategories = ["tourism", "amenity", "historic", "leisure"];

  places.forEach(place => {
    let foundCategory = false;
    for (const mainCat of mainCategories) {
      const subCat = place.tags[mainCat];
      if (subCat) {
        // Normalize subCat in case of multiple values, e.g., "restaurant;cafe"
        const subCategories = subCat.split(';');
        for (const category of subCategories) {
          if (!groupedPlaces[category]) {
            groupedPlaces[category] = [];
          }
          // Avoid adding duplicate places to the same category
          if (!groupedPlaces[category].find(p => p.id === place.id)) {
            groupedPlaces[category].push(place);
          }
          foundCategory = true;
        }
      }
    }
    if (!foundCategory) {
      if (!groupedPlaces['other']) {
        groupedPlaces['other'] = [];
      }
      groupedPlaces['other'].push(place);
    }
  });

  const subCategoryTranslations: { [key: string]: string } = {
    restaurant: "Nhà hàng",
    cafe: "Quán cà phê",
    theatre: "Nhà hát",
    cinema: "Rạp chiếu phim",
    library: "Thư viện",
    monument: "Tượng đài",
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
    other: "Khác"
  };

  return (
    <div className="mt-8 sm:mt-12 md:mt-16">
      {Object.entries(groupedPlaces).map(([category, items]) => (
        <PlaceCategoryRow 
          key={category}
          title={subCategoryTranslations[category] || category.charAt(0).toUpperCase() + category.slice(1)}
          items={items}
        />
      ))}
    </div>
  );
};

export default PlacesSection;
