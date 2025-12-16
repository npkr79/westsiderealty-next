"use client";

interface UltraLuxuryContentBlockProps {
  title?: string;
  subtitle?: string;
  bullets?: string[];
}

export function UltraLuxuryContentBlock({
  title = "Ultra-Luxury Living",
  subtitle,
  bullets,
}: UltraLuxuryContentBlockProps) {
  return (
    <section className="py-10 md:py-14">
      <div className="container mx-auto max-w-4xl px-4 space-y-4">
        <h2 className="text-2xl md:text-3xl font-bold">{title}</h2>
        {subtitle && <p className="text-muted-foreground">{subtitle}</p>}
        {bullets && bullets.length > 0 && (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-muted-foreground">
            {bullets.map((item, idx) => (
              <li key={idx}>{item}</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}


