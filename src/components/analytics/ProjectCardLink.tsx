"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackBehaviorEvent } from "@/lib/analytics/behaviorTracking";

interface ProjectCardLinkProps {
  href: string;
  className?: string;
  children: ReactNode;
}

export default function ProjectCardLink({ href, className, children }: ProjectCardLinkProps) {
  const onClick = () => {
    const projectSlug = href.split("/").filter(Boolean).pop() || null;
    void trackBehaviorEvent("project_view", {
      href,
      project_slug: projectSlug,
    });
  };

  return (
    <Link href={href} className={className} onClick={onClick}>
      {children}
    </Link>
  );
}
