import Link from "next/link";

interface Gateway {
  label: string;
  href: string;
  summary: string;
  stats: string[];
}

interface CommandAccessProps {
  gateways: Gateway[];
}

export default function CommandAccess({ gateways }: CommandAccessProps) {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="max-w-4xl space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-500">
            Command Access
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 sm:text-4xl">
            Enter the vertical and horizontal intelligence command centers.
          </h2>
          <p className="text-sm text-slate-600">
            Gateways separate market view from project intelligence entry.
          </p>
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-2">
          {gateways.map((gateway) => (
            <Link
              key={gateway.label}
              href={gateway.href}
              className="group rounded-[26px] border border-slate-200 bg-slate-50 p-6 shadow-sm transition hover:border-slate-300 hover:bg-white"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
                {gateway.label}
              </p>
              <h3 className="mt-4 text-2xl font-semibold text-slate-900">{gateway.summary}</h3>
              <div className="mt-6 grid gap-3 text-xs text-slate-500 sm:grid-cols-2">
                {gateway.stats.map((stat) => (
                  <div key={stat} className="rounded-[12px] border border-slate-200 bg-white px-3 py-2">
                    {stat}
                  </div>
                ))}
              </div>
              <span className="mt-6 inline-flex text-sm font-semibold text-slate-900">
                Enter dashboard →
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
