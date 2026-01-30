import Link from "next/link";

export default function IntelligenceFooter() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">
              Westside
            </p>
          </div>
          <Link href="/about-westside" className="text-sm text-slate-300 hover:text-white">
            About Westside
          </Link>
          <Link
            href="/apartment-intelligence"
            className="text-sm text-slate-300 hover:text-white"
          >
            Apartment Intelligence
          </Link>
          <Link
            href="/villa-intelligence"
            className="text-sm text-slate-300 hover:text-white"
          >
            Villa Intelligence
          </Link>
          <Link href="/contact" className="text-sm text-slate-300 hover:text-white">
            Contact
          </Link>
          <div className="text-sm text-slate-300">
            Research
            <span className="ml-2 rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-slate-400">
              Soon
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
