interface Props {
  projects?: unknown[];
}

export default function PremiumProjectsSection({ projects }: Props) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
      <h2 className="text-xl font-semibold text-white">Premium Projects</h2>
      <p className="mt-2 text-sm text-slate-300">
        {Array.isArray(projects) && projects.length > 0
          ? `${projects.length} premium projects are featured.`
          : "Premium projects will appear here shortly."}
      </p>
    </section>
  );
}
