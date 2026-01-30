import Link from "next/link";

interface FileCard {
  name: string;
  slug: string;
  microMarket: string;
  rationale: string;
  metrics: string[];
}

interface FeaturedIntelligenceFilesProps {
  files: FileCard[];
}

export default function FeaturedIntelligenceFiles({ files }: FeaturedIntelligenceFilesProps) {
  return (
    <section className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Featured Intelligence Files
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Representative ecosystems for structural comparison.
          </h2>
          <p className="text-sm text-slate-600">
            Selected for structural extremes and benchmark balance, not popularity.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {files.map((file) => (
            <Link
              key={file.slug}
              href={`/residential-intelligence/hyderabad/${file.slug}`}
              className="group rounded-[24px] border border-slate-200 bg-white p-6 shadow-sm transition hover:border-slate-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500">{file.microMarket}</p>
                </div>
                <span className="rounded-full border border-slate-200 px-3 py-1 text-xs text-slate-600">
                  Intelligence File
                </span>
              </div>
              <p className="mt-4 text-sm text-slate-600">{file.rationale}</p>
              <div className="mt-4 grid gap-2 text-xs text-slate-500 sm:grid-cols-2">
                {file.metrics.map((metric) => (
                  <div key={metric} className="rounded-[12px] border border-slate-200 bg-slate-50 px-3 py-2">
                    {metric}
                  </div>
                ))}
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
