"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { microMarketService } from "@/services/microMarketService";

interface MicromarketComboboxProps {
  citySlug?: string;
  cityId?: string | null;
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void | Promise<void>;
}

export function MicromarketCombobox({ citySlug, cityId, value, onChange, onValueChange }: MicromarketComboboxProps) {
  const [options, setOptions] = useState<{ id: string; micro_market_name: string; url_slug: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!citySlug) return;
      try {
        const items = await microMarketService.getMicroMarketsByCity?.(citySlug);
        setOptions((items || []).map((item: any) => ({
          id: item.id || item.micro_market_id || '',
          micro_market_name: item.micro_market_name || item.name || '',
          url_slug: item.url_slug || item.slug || '',
        })));
      } catch {
        // ignore for now
      }
    };
    load();
  }, [citySlug]);

  const handleValueChange = async (val: string) => {
    if (onValueChange) {
      await onValueChange(val);
    }
    onChange?.(val);
  };

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger>
        <SelectValue placeholder="Select micro-market" />
      </SelectTrigger>
      <SelectContent>
        {options.map((mm) => (
          <SelectItem key={mm.id} value={mm.id}>
            {mm.micro_market_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


