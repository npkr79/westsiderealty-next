"use client";

import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { developersHubService } from "@/services/developersHubService";

interface AllDevelopersComboboxProps {
  value?: string;
  onChange?: (value: string) => void;
  onValueChange?: (value: string) => void | Promise<void>;
}

export function AllDevelopersCombobox({ value, onChange, onValueChange }: AllDevelopersComboboxProps) {
  const [developers, setDevelopers] = useState<{ id: string; developer_name: string }[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await developersHubService.getDevelopers();
      setDevelopers(data.map((d: any) => ({ id: d.id, developer_name: d.developer_name })) || []);
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


