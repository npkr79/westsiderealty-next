"use client";

import ContactForm from "@/components/ContactForm";
import { X } from "lucide-react";
import { useState } from "react";

interface FloatingLeadCaptureProps {
  landingPageId?: string;
  brochureUrl?: string | null;
}

export default function FloatingLeadCapture({ landingPageId, brochureUrl }: FloatingLeadCaptureProps = {}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-24 right-4 z-40 rounded-full bg-primary text-primary-foreground px-4 py-2 shadow-lg"
      >
        Get Assistance
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="relative w-full max-w-lg rounded-lg bg-background p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-3 rounded-full p-1 hover:bg-muted"
            >
              <span className="sr-only">Close</span>
              <X className="h-4 w-4" />
            </button>
            <ContactForm />
          </div>
        </div>
      )}
    </>
  );
}


