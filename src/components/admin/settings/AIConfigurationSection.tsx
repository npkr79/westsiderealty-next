"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export function AIConfigurationSection() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="openai-key">OpenAI API Key</Label>
          <Input id="openai-key" type="password" placeholder="sk-..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="model">Default Model</Label>
          <Input id="model" placeholder="gpt-4.1" />
        </div>
      </CardContent>
    </Card>
  );
}




