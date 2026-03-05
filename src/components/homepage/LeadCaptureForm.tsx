"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LeadCaptureForm() {
  const [name, setName] = useState("");

  return (
    <form className="space-y-3 rounded-xl border border-slate-700 bg-slate-950 p-4">
      <Input
        value={name}
        onChange={(event) => setName(event.target.value)}
        placeholder="Your name"
        className="bg-slate-900 text-white"
      />
      <Button type="button" className="w-full">
        Request Advisory Callback
      </Button>
    </form>
  );
}
