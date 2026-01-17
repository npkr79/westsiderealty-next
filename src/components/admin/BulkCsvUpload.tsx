"use client";

import { useState } from "react";
import Papa from "papaparse";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface BulkCsvUploadProps<T> {
  label: string;
  templateHeaders: string[];
  onUpload: (rows: T[]) => Promise<{ successCount: number; errorCount: number; errorMessage?: string }>;
}

export default function BulkCsvUpload<T>({
  label,
  templateHeaders,
  onUpload,
}: BulkCsvUploadProps<T>) {
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");

  const downloadTemplate = () => {
    const content = `${templateHeaders.join(",")}\n`;
    const blob = new Blob([content], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${label.toLowerCase().replace(/\s+/g, "-")}-template.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    setMessage("");
    setIsUploading(true);

    Papa.parse<T>(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors?.length) {
          setMessage("Failed to parse CSV. Please check the template.");
          setIsUploading(false);
          return;
        }

        const rows = (results.data || []) as T[];
        try {
          const result = await onUpload(rows);
          setMessage(
            `Uploaded ${result.successCount} rows${
              result.errorCount ? `, ${result.errorCount} failed` : ""
            }.`
          );
        } catch (error: any) {
          setMessage(error?.message || "Bulk upload failed.");
        } finally {
          setIsUploading(false);
        }
      },
      error: () => {
        setMessage("Failed to parse CSV. Please try again.");
        setIsUploading(false);
      },
    });
  };

  return (
    <div className="space-y-3 rounded-lg border p-4">
      <div className="text-sm font-medium">{label} (CSV)</div>
      <div className="flex flex-col gap-2 md:flex-row md:items-center">
        <Input
          type="file"
          accept=".csv"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) handleFile(file);
          }}
          disabled={isUploading}
        />
        <Button type="button" variant="outline" onClick={downloadTemplate}>
          Download Template
        </Button>
      </div>
      {message && <p className="text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
