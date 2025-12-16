"use client";

import ContactForm from "@/components/ContactForm";

interface PermanentLeadFormProps {
  landingPageId?: string;
  brochureUrl?: string | null;
  projectName?: string;
}

export default function PermanentLeadForm({ landingPageId, brochureUrl, projectName }: PermanentLeadFormProps = {}) {
  return (
    <section className="py-10 md:py-14 bg-muted/30">
      <div className="container mx-auto max-w-4xl px-4">
        <ContactForm />
      </div>
    </section>
  );
}


