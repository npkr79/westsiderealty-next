"use client";

import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={() => window.print()}
      className="border-muted text-muted-foreground hover:bg-muted"
    >
      <Printer className="h-4 w-4 mr-2" />
      Print
    </Button>
  );
}

