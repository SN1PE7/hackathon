import { categoriesData } from "@/components/category/categoryData";

interface Location {
  lat: number;
  lng: number;
}

export const searchPlaces = async (
  location: Location,
  categories: string[],
  radius: number
) => {
  const tags: { [key: string]: string[] } = {};
  categories.forEach(cat => {
    const group =
      Object.keys(categoriesData).find(key =>
        (categoriesData as any)[key].includes(cat)
      ) || "tourism";

    if (!tags[group]) {
      tags[group] = [];
    }
    tags[group].push(cat);
  });

  const payload = {
    lat: location.lat.toString(),
    lon: location.lng.toString(),
    radius: radius,
    tags: tags,
  };

  console.log("Sending payload:", payload);

  try {
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_BASE_URL}/api/overpass/search`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
        // Throw an error with status to handle it in the component
        const errorData = await response.json().catch(() => ({})); // catch if response is not json
        throw new Error(errorData.message || `Error: ${response.status}`);
    }

    const data = await response.json();
    return data.elements || [];
  } catch (error) {
    console.error("Failed to fetch places:", error);
    // Re-throw the error to be caught by the calling function
    throw error;
  }
};
