"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface AIPropertyDescriptionGeneratorProps {
  formData?: any;
  setFormData?: (updater: (prev: any) => any) => void;
  onDescriptionGenerated?: (description: string) => void;
}

/**
  * Lightweight placeholder for the original AI-based description generator.
  * This keeps the admin workflow intact while avoiding backend dependencies in this migration.
  */
export default function AIPropertyDescriptionGenerator({
  formData,
  setFormData,
  onDescriptionGenerated,
}: AIPropertyDescriptionGeneratorProps) {
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    // Simple placeholder behaviour: append the prompt to the description.
    const generatedDescription = prompt || "AI-generated description placeholder";
    
    if (onDescriptionGenerated) {
      onDescriptionGenerated(generatedDescription);
    } else if (setFormData) {
      setFormData((prev: any) => ({
        ...prev,
        description: (prev.description || "") + (prompt ? `\n\n${prompt}` : ""),
      }));
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Description Helper (Placeholder)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="Describe what you want to highlight (e.g. views, layout, community, proximity to IT hubs)..."
          rows={3}
        />
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={loading}
        >
          {loading ? "Generating..." : "Append to Description"}
        </Button>
      </CardContent>
    </Card>
  );
}


