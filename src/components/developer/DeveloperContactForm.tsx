"use client";

import ContactForm from "@/components/ContactForm";

interface DeveloperContactFormProps {
  developerName?: string;
}

export default function DeveloperContactForm({ developerName }: DeveloperContactFormProps) {
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-2xl font-bold">
        Talk to {developerName || "the developer"}
      </h2>
      <ContactForm />
    </section>
  );
}


