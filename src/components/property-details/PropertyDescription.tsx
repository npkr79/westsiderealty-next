"use client";

import { sanitizeHTML } from "@/lib/utils/htmlSanitizer";

interface PropertyDescriptionProps {
  title: string;
  description: string;
  projectName?: string;
  maxWords?: number; // Optional max words (default: 500) - kept for backward compatibility but not used for HTML content
}

export default function PropertyDescription({
  title,
  description,
  projectName,
  maxWords = 500,
}: PropertyDescriptionProps) {
  if (!description) return null;

  // Check if description contains HTML tags
  const hasHTML = /<[^>]+>/.test(description);
  
  // If HTML content, sanitize and render as HTML
  if (hasHTML) {
    const sanitizedDescription = sanitizeHTML(description);
    
    return (
      <section className="space-y-4">
        <h2 className="text-2xl font-semibold text-foreground">
          {projectName || title}
        </h2>
        <div
          className="rich-content text-muted-foreground leading-relaxed [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-4 [&_h2]:mt-6 [&_h2]:first:mt-0 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:mb-3 [&_h3]:mt-5 [&_p]:mb-4 [&_p]:leading-relaxed [&_ul]:list-disc [&_ul]:ml-6 [&_ul]:mb-4 [&_li]:mb-2 [&_strong]:font-semibold [&_strong]:text-foreground"
          dangerouslySetInnerHTML={{ __html: sanitizedDescription }}
        />
      </section>
    );
  }

  // Fallback for plain text descriptions (backward compatibility)
  // Clean up markdown artifacts
  let cleanDescription = description
    .replace(/\*\*(.*?)::\*\*/g, '') // Remove **text::**
    .replace(/\*\*(.*?)\*\*/g, '$1') // Convert **bold** to plain text
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();

  // Split by double line breaks for paragraphs
  const paragraphs = cleanDescription.split(/\n\n+/).filter(p => p.trim());

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">
        {projectName || title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed space-y-4">
        {paragraphs.map((paragraph, index) => (
          <p key={index} className="mb-4 last:mb-0">
            {paragraph}
          </p>
        ))}
      </div>
    </section>
  );
}
