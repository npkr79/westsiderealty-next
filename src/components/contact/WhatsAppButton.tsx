"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";

export default function WhatsAppButton() {
  return (
    <Card>
      <CardContent className="pt-4">
        <Link
          href="/contact"
          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
        >
          Contact Us
        </Link>
      </CardContent>
    </Card>
  );
}

