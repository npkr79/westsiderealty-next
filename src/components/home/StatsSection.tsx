"use client";

interface StatItem {
  label: string;
  value: string;
}

const DEFAULT_STATS: StatItem[] = [
  { label: "Years of Experience", value: "15+" },
  { label: "Properties Advised", value: "500+" },
  { label: "Client Satisfaction", value: "4.8★" },
];

export default function StatsSection({ stats = DEFAULT_STATS }: { stats?: StatItem[] }) {
  return (
    <section className="py-10 bg-background">
      <div className="container mx-auto max-w-4xl px-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {stats.map((stat, idx) => (
          <div key={idx} className="text-center">
            <p className="text-3xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}


