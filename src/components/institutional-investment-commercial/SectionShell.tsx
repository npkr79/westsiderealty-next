import { ReactNode } from "react";

type SectionShellProps = {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
};

export default function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
}: SectionShellProps) {
  return (
    <section
      id={id}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900/85 to-slate-950/95 p-6 md:p-10"
    >
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#B48A3C]">{eyebrow}</p>
      ) : null}
      <h2 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-3xl">{title}</h2>
      {description ? <p className="mt-3 max-w-4xl text-sm text-slate-300 md:text-base">{description}</p> : null}
      <div className="mt-6">{children}</div>
    </section>
  );
}
