"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { microMarketService } from "@/services/microMarketService";

interface MicromarketComboboxProps {
  citySlug?: string;
  value?: string;
  onChange?: (value: string) => void;
}

export function MicromarketCombobox({ citySlug, value, onChange }: MicromarketComboboxProps) {
  const [options, setOptions] = useState<{ id: string; micro_market_name: string; url_slug: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      if (!citySlug) return;
      try {
        const items = await microMarketService.getMicroMarketsByCity?.(citySlug);
        setOptions(items || []);
      } catch {
        // ignore for now
      }
    };
    load();
  }, [citySlug]);

  return (
    <Select value={value} onValueChange={(val) => onChange?.(val)}>
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


