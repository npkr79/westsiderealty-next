"use client";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface JSONEditorProps {
  label: string;
  value?: unknown;
  onChange?: (val: unknown) => void;
}

export function JSONEditor({ label, value, onChange }: JSONEditorProps) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Textarea
        rows={6}
        className="font-mono text-xs"
        value={value ? JSON.stringify(value, null, 2) : ""}
        onChange={(e) => {
          try {
            const parsed = JSON.parse(e.target.value || "{}");
            onChange?.(parsed);
          } catch {
            // keep editing state; validation can be added later
          }
        }}
      />
    </div>
  );
}


