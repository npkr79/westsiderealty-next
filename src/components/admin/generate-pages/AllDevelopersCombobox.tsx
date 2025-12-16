"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { developerService } from "@/services/developerService";

interface AllDevelopersComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
}

export function AllDevelopersCombobox({ value, onChange }: AllDevelopersComboboxProps) {
  const [developers, setDevelopers] = useState<{ id: string; developer_name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await developerService.getDevelopers?.();
      setDevelopers(data || []);
    };
    load();
  }, []);

  return (
    <Select value={value} onValueChange={(val) => onChange?.(val)}>
      <SelectTrigger>
        <SelectValue placeholder="Select developer" />
      </SelectTrigger>
      <SelectContent>
        {developers.map((dev) => (
          <SelectItem key={dev.id} value={dev.id}>
            {dev.developer_name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}


