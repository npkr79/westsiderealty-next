"use client";

import { useEffect, useState } from "react";
import { developerService } from "@/services/developerService";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

interface FeaturedDevelopersSelectorProps {
  value?: string[];
  onChange?: (ids: string[]) => void;
}

export function FeaturedDevelopersSelector({
  value = [],
  onChange,
}: FeaturedDevelopersSelectorProps) {
  const [developers, setDevelopers] = useState<{ id: string; developer_name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await developerService.getDevelopers?.();
      setDevelopers(data || []);
    };
    load();
  }, []);

  const toggle = (id: string) => {
    const next = value.includes(id)
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange?.(next);
  };

  return (
    <div className="space-y-2">
      <Label>Featured Developers</Label>
      <div className="grid grid-cols-2 gap-2">
        {developers.map((dev) => (
          <label key={dev.id} className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={value.includes(dev.id)}
              onCheckedChange={() => toggle(dev.id)}
            />
            <span>{dev.developer_name}</span>
          </label>
        ))}
      </div>
    </div>
  );
}


