'use client';

import { useState } from "react";
import SplitText from "@/components/text-animation/split-text";
import Search from "@/components/search/search";
import PlaceSearchBar from "@/components/search/PlaceSearchBar";
import Category from "@/components/category/category";
import PlacesSection from "@/components/places/PlacesSection";
import { searchPlaces } from "@/services/api";
import { useSelection } from "@/context/SelectionContext";

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [radius, setRadius] = useState<number | null>(5000);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const { addStartingLocation } = useSelection();

  const handleCategoryChange = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleLocationSelect = (selectedLocation: { lat: number; lng: number; display: string } | null) => {
    if (selectedLocation) {
      setLocation(selectedLocation);
      addStartingLocation(selectedLocation);
    }
  };

  const handleSearch = async () => {
    if (!location || categories.length === 0 || radius === null) {
      alert("Vui lòng chọn vị trí, ít nhất một loại địa điểm và bán kính tìm kiếm.");
      return;
    }

    setLoading(true);
    setPlaces([]);

    try {
      const foundPlaces = await searchPlaces(location, categories, radius);
      setPlaces(foundPlaces);
    } catch (error) {
      console.error("Failed to fetch places:", error);
      alert(`Đã có lỗi xảy ra khi tìm kiếm địa điểm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <section className="relative h-screen md:h-[90vh] flex flex-col items-center justify-center text-center text-white pt-16 md:pt-0">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
          <img src="/curve-bg.png" alt="curve" className="absolute bottom-0 w-full z-20" />
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-black opacity-10"></div>
        <div className="relative z-10 p-4 md:p-0">
          <SplitText
            text="Chào mừng đến với SMART TRAVEL"
            tag="h1"
            className="text-2xl sm:text-3xl md:text-5xl lg:text-6xl font-bold px-2"
            splitType="chars"
            delay={50}
          />
          <SplitText
            text="Tạo lịch trình du lịch của riêng bạn chỉ với một vài cú nhấp chuột."
            tag="p"
            className="mt-2 sm:mt-3 md:mt-4 text-sm sm:text-base md:text-lg lg:text-xl px-2"
            splitType="words"
            delay={100}
          />
        </div>
      </section>
      {/* Search Section */}
      <div className="relative z-40 w-full px-4 sm:px-6 lg:px-8 -mt-12 sm:-mt-16 md:-mt-20 pb-8 md:pb-12">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-900 to-blue-800 p-4 sm:p-5 md:p-6 rounded-xl shadow-lg space-y-3 sm:space-y-4">
          <div className="relative z-9999">
            <Search onLocationSelect={handleLocationSelect} />
          </div>
          <div className="relative z-9998">
            <Category 
              selectedCategories={categories}
              onCategoryChange={handleCategoryChange}
              radius={radius}
              onRadiusChange={setRadius}
              onSearch={handleSearch}
            />
          </div>
          <div className="relative z-9997">
            <PlaceSearchBar />
          </div>
        </div>
      </div>
      <div className="pb-8 md:pb-12">
        <PlacesSection places={places} loading={loading} />
      </div>
    </div>
  );
}

