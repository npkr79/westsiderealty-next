"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface CityComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void | Promise<void>;
}

export function CityCombobox({ value, onChange, onValueChange }: CityComboboxProps) {
  const [cities, setCities] = useState<{ id: string; city_name: string; url_slug: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase
        .from("cities")
        .select("id, city_name, url_slug")
        .eq("page_status", "published")
        .order("city_name");
      setCities(data || []);
    };
    load();
  }, []);

  const handleValueChange = async (val: string) => {
    if (onValueChange) {
      await onValueChange(val);
    }
    onChange?.(val);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
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


