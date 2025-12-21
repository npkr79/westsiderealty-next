"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CityTabsProps {
  cities: Array<{ city_name: string; url_slug: string }>;
  selectedCity?: string;
}

export default function CityTabs({ cities, selectedCity }: CityTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleCityChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "all") {
      params.delete("city");
    } else {
      params.set("city", value);
    }
    
    // Reset micro-market when city changes
    params.delete("microMarket");
    
    const queryString = params.toString();
    const newUrl = queryString ? `/projects?${queryString}` : `/projects`;
    router.push(newUrl);
  };

  return (
    <Tabs value={selectedCity || "all"} onValueChange={handleCityChange} className="w-full">
      <TabsList className="w-full justify-start bg-transparent border-b rounded-none h-auto p-0 gap-0">
        <TabsTrigger
          value="all"
          className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
        >
          All Cities
        </TabsTrigger>
        {cities.map((city) => (
          <TabsTrigger
            key={city.url_slug}
            value={city.url_slug}
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent px-4 py-3"
          >
            {city.city_name}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}

