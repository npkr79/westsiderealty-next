"use client";

import { truncateWords, splitIntoParagraphs, countWords } from "@/lib/textUtils";

interface PropertyDescriptionProps {
  title: string;
  description: string;
  projectName?: string;
  maxWords?: number; // Optional max words (default: 500)
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function PropertyDescription({
  title,
  description,
  projectName,
  maxWords = 500,
}: PropertyDescriptionProps) {
  if (!description) return null;

  // Clean up markdown artifacts like **text::** 
  let cleanDescription = description
    .replace(/\*\*(.*?)::\*\*/g, '') // Remove **text::**
    .replace(/\*\*(.*?)\*\*/g, '$1') // Convert **bold** to plain text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();

  // Truncate to maxWords (default 500)
  cleanDescription = truncateWords(cleanDescription, maxWords);

  // Count words to determine if we should split into paragraphs
  const wordCount = countWords(cleanDescription);
  const shouldSplitIntoParagraphs = wordCount > 200;

  // Split into paragraphs if more than 200 words
  const paragraphs = shouldSplitIntoParagraphs 
    ? splitIntoParagraphs(cleanDescription, 200)
    : [cleanDescription];

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


