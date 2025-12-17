"use client";

interface StatItem {
  label: string;
  value?: string;
  number?: string;
  description?: string;
  icon?: any;
}

const DEFAULT_STATS: StatItem[] = [
  { label: "Years of Experience", value: "15+" },
  { label: "Properties Advised", value: "500+" },
  { label: "Client Satisfaction", value: "4.8★" },
];

export default function StatsSection({ stats = DEFAULT_STATS }: { stats?: StatItem[] }) {
  // Normalize stats to ensure they have the expected structure
  const normalizedStats = (stats || []).map((stat) => ({
    ...stat,
    value: stat.value || stat.number || "",
    label: stat.label || "",
    description: stat.description || "",
    icon: stat.icon,
  }));

  return (
    <section className="py-10 bg-white">
      <div className="container mx-auto max-w-4xl px-4 grid grid-cols-1 gap-6 md:grid-cols-3">
        {normalizedStats.map((stat, idx) => (
          <div key={idx} className="bg-white rounded-xl shadow-md p-6 text-center">
            {stat.icon && (
              <stat.icon className="h-8 w-8 text-blue-600 mx-auto mb-4" />
            )}
            <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-600 mt-1 font-semibold">{stat.label}</p>
            {stat.description && (
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}


