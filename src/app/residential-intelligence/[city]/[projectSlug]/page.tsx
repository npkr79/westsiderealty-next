import { notFound } from "next/navigation";
import { reraIntelligenceService } from "@/services/reraIntelligenceService";

interface PageProps {
  params: { city: string; projectSlug: string };
}

export default async function ResidentialIntelligencePage({ params }: PageProps) {
  const { city, projectSlug } = params;

  const data = await reraIntelligenceService.getResidentialIntelligence(city, projectSlug);

  if (!data) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="container mx-auto max-w-4xl px-4 py-10 space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold text-slate-900">
            Residential Intelligence Debug
          </h1>
          <p className="text-sm text-slate-600">
            Prototype view for structural intelligence validation.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Project Summary
          </h2>
          <div className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <span className="text-slate-500">Project Name:</span>{" "}
              <span className="font-medium">
                {(data.rera_project as any)?.project_name ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">RERA ID:</span>{" "}
              <span className="font-medium">
                {(data.rera_project as any)?.registration_number ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">City Slug:</span>{" "}
              <span className="font-medium">
                {(data.rera_project as any)?.city_slug ?? "—"}
              </span>
            </div>
            <div>
              <span className="text-slate-500">URL Slug:</span>{" "}
              <span className="font-medium">
                {(data.rera_project as any)?.url_slug ?? "—"}
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Structural Profile
          </h2>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(data.structural_profile, null, 2)}
          </pre>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">
            Land Summary
          </h2>
          <pre className="mt-4 whitespace-pre-wrap break-words rounded-lg bg-slate-50 p-4 text-xs text-slate-700">
            {JSON.stringify(data.land_summary, null, 2)}
          </pre>
        </section>
      </div>
    </main>
  );
}
