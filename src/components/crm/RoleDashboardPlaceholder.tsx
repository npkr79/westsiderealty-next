"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RoleDashboardPlaceholderProps {
  title: string;
  description: string;
}

export default function RoleDashboardPlaceholder({ title, description }: RoleDashboardPlaceholderProps) {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">CRM</p>
        <h1 className="mt-1 text-2xl font-semibold">{title}</h1>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Phase 1 workspace</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          <p>{description}</p>
          <p>Use the Leads, Pipeline, and Tasks modules from the sidebar for day-to-day operations.</p>
        </CardContent>
      </Card>
    </div>
  );
}
