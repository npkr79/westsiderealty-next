"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface LifestyleSection {
  title: string;
  description: string;
}

interface LifestyleInfraEditorProps {
  value?: LifestyleSection[];
  onChange?: (value: LifestyleSection[]) => void;
}

export function LifestyleInfraEditor({ value = [], onChange }: LifestyleInfraEditorProps) {
  const [items, setItems] = useState<LifestyleSection[]>(value);

  const updateItem = (index: number, field: keyof LifestyleSection, val: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: val };
    setItems(next);
    onChange?.(next);
  };

  const addItem = () => {
    const next = [...items, { title: "", description: "" }];
    setItems(next);
    onChange?.(next);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle> Lifestyle & Infrastructure </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="space-y-2">
            <Label>Title</Label>
            <input
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={item.title}
              onChange={(e) => updateItem(idx, "title", e.target.value)}
            />
            <Label>Description</Label>
            <Textarea
              rows={3}
              value={item.description}
              onChange={(e) => updateItem(idx, "description", e.target.value)}
            />
          </div>
        ))}
        <button
          type="button"
          className="text-sm text-primary underline"
          onClick={addItem}
        >
          + Add another section
        </button>
      </CardContent>
    </Card>
  );
}


