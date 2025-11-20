import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';

import { useSelection } from '@/context/SelectionContext';

interface PlaceCardProps {
  place: {
    lat: number;
    lon: number;
    tags: {
      name?: string;
      'name:vi'?: string;
      "addr:street"?: string;
      "addr:housenumber"?: string;
      "addr:city"?: string;
      opening_hours?: string;
      website?: string;
    };
  };
}

const PlaceCard: React.FC<PlaceCardProps> = ({ place }) => {
  const { addToSelection } = useSelection();
  const {
    name,
    'name:vi': nameVi,
    "addr:street": street,
    "addr:housenumber": housenumber,
    "addr:city": city,
    opening_hours,
    website,
  } = place.tags;

  const renderAddress = () => {
    const parts = [housenumber, street, city];
    const address = parts.filter(Boolean).join(', ');
    return address || "Chưa có dữ liệu";
  };

  return (
    <div className="w-[calc(100%-0.75rem)] sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)] xl:w-[calc(25%-1rem)] shrink-0 bg-white rounded-lg shadow-md p-3 sm:p-4 border border-gray-200 flex flex-col justify-between">
      <div>
        <h3 className="font-bold text-base sm:text-lg mb-2">{nameVi || name || 'Chưa có tên'}</h3>
        <div className="space-y-2 text-xs sm:text-sm text-gray-600">
          <p><strong>Địa chỉ:</strong> {renderAddress()}</p>
          <p><strong>Giờ mở cửa:</strong> {opening_hours || 'Chưa có dữ liệu'}</p>
          <p><strong>Website:</strong> {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Truy cập</a> : 'Chưa có dữ liệu'}</p>
        </div>
      </div>
      <div className="flex justify-end mt-3 sm:mt-4">
        <button onClick={() => addToSelection(place)} className="bg-blue-900 text-white px-2 sm:px-3 py-1 rounded-md text-xs sm:text-sm flex items-center space-x-2 cursor-pointer hover:bg-blue-800 transition">
            <FontAwesomeIcon icon={faPlus} className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>Chọn</span>
        </button>
      </div>
    </div>
  );
};

export default PlaceCard;
