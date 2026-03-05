"use client";

import Link from "next/link";
import type { ReactNode } from "react";

interface Props {
  href: string;
  children: ReactNode;
  className?: string;
  trackingEvent?: string;
  trackingLabel?: string;
}

export default function TrackedLink({ href, children, className }: Props) {
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
