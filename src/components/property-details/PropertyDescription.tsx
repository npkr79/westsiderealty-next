"use client";

interface PropertyDescriptionProps {
  title: string;
  description: string;
  projectName?: string;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
}

export default function PropertyDescription({
  title,
  description,
  projectName,
}: PropertyDescriptionProps) {
  if (!description) return null;

  // Clean up markdown artifacts like **text::** 
  const cleanDescription = description
    .replace(/\*\*(.*?)::\*\*/g, '') // Remove **text::**
    .replace(/\*\*(.*?)\*\*/g, '$1') // Convert **bold** to plain text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/\n{3,}/g, '\n\n') // Remove excessive line breaks
    .trim();

  return (
    <section className="space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">
        {projectName || title}
      </h2>
      <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {cleanDescription}
      </div>
    </section>
  );
}


