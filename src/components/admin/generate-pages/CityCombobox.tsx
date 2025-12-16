"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cityService } from "@/services/cityService";

interface CityComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function CityCombobox({ value, onChange }: CityComboboxProps) {
  const [cities, setCities] = useState<{ id: string; city_name: string; url_slug: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await cityService.getAllCities?.();
      setCities(data || []);
    };
    load();
  }, []);

  return (
    <Select value={value} onValueChange={(val) => onChange?.(val)}>
      <SelectTrigger>
        <SelectValue placeholder="Select city" />
      </SelectTrigger>
      <SelectContent>
        {cities.map((city) => (
          <SelectItem key={city.id} value={city.id}>
            {city.city_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


