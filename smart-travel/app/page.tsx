'use client';

import { useState } from "react";
import SplitText from "@/components/text-animation/split-text";
import Search from "@/components/search/search";
import Category from "@/components/category/category";
import PlacesSection from "@/components/places/PlacesSection";
import { searchPlaces } from "@/services/api";

export default function Home() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [radius, setRadius] = useState<number | null>(5000);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleCategoryChange = (category: string) => {
    setCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
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
      <section className="relative h-[90vh] flex flex-col items-center justify-center text-center text-white">
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
        <div className="relative z-10 p-4">
          <SplitText
            text="Chào mừng đến với SMART TRAVEL"
            tag="h1"
            className="text-4xl md:text-6xl font-bold"
            splitType="chars"
            delay={50}
          />
          <SplitText
            text="Tạo lịch trình du lịch của riêng bạn chỉ với một vài cú nhấp chuột."
            tag="p"
            className="mt-4 text-lg md:text-xl"
            splitType="words"
            delay={100}
          />
        </div>
      </section>
      <div className="relative z-30 -mt-20 w-full px-4">
        <div className="max-w-6xl mx-auto bg-gradient-to-r from-blue-900 to-blue-800 p-6 rounded-xl shadow-lg space-y-4">
            <Search onLocationSelect={setLocation} />
            <Category 
              selectedCategories={categories}
              onCategoryChange={handleCategoryChange}
              radius={radius}
              onRadiusChange={setRadius}
              onSearch={handleSearch}
            />
        </div>
      </div>
      <div className="pb-12">
        <PlacesSection places={places} loading={loading} />
      </div>
    </div>
  );
}

