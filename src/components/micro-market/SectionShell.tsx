import { ReactNode } from "react";

interface SectionShellProps {
  id?: string;
  eyebrow?: string;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export default function SectionShell({
  id,
  eyebrow,
  title,
  description,
  children,
  className = "",
}: SectionShellProps) {
  return (
    <section
      id={id}
      className={`rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900/50 md:p-10 ${className}`}
    >
      {eyebrow ? (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {eyebrow}
        </p>
      ) : null}
      <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground md:text-3xl">
        {title}
      </h2>
      {description ? (
        <p className="mt-4 max-w-4xl text-sm text-muted-foreground md:text-base leading-relaxed">{description}</p>
      ) : null}
      <div className="mt-8">{children}</div>
    </section>
  );
}
