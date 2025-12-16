"use client";

interface ProjectSpecificationsProps {
  specifications?: Record<string, string> | Array<{ label: string; value: string }>;
}

export default function ProjectSpecifications({ specifications }: ProjectSpecificationsProps) {
  if (!specifications) return null;

  const entries =
    Array.isArray(specifications)
      ? specifications
      : Object.entries(specifications).map(([label, value]) => ({ label, value }));

  if (!entries.length) return null;

  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-2xl font-semibold text-foreground">Technical Specifications</h2>
      <dl className="grid gap-3 md:grid-cols-2 text-sm text-muted-foreground">
        {entries.map((item) => (
          <div key={item.label}>
            <dt className="font-medium text-foreground">{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}


