"use client";

interface PropertyDescriptionProps {
  title: string;
  description: string;
  projectName?: string;
}

export default function PropertyDescription({
  title,
  description,
  projectName,
}: PropertyDescriptionProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-2xl font-semibold text-foreground">
        {projectName || title}
      </h2>
      <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {description}
      </p>
    </section>
  );
}


