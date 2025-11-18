import React from 'react';

interface PlaceCardProps {
  place: {
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
    <div className="w-[calc(25%-1rem)] flex-shrink-0 bg-white rounded-lg shadow-md p-4 border border-gray-200 flex flex-col">
      <h3 className="font-bold text-lg mb-2">{nameVi || name || 'Chưa có tên'}</h3>
      <div className="space-y-2 text-sm text-gray-600 mt-auto">
        <p><strong>Địa chỉ:</strong> {renderAddress()}</p>
        <p><strong>Giờ mở cửa:</strong> {opening_hours || 'Chưa có dữ liệu'}</p>
        <p><strong>Website:</strong> {website ? <a href={website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Truy cập</a> : 'Chưa có dữ liệu'}</p>
      </div>
    </div>
  );
};

export default PlaceCard;
