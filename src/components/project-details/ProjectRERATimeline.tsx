"use client";

interface ProjectRERATimelineProps {
  reraId?: string | null;
  reraLink?: string | null;
  possessionDate?: string | null;
  constructionTimeline?: any;
}

export default function ProjectRERATimeline({
  reraId,
  reraLink,
  possessionDate,
  constructionTimeline,
}: ProjectRERATimelineProps) {
  if (!reraId && !possessionDate) return null;

  return (
    <section className="mt-10 space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Approvals & Possession</h2>
      <div className="grid gap-4 md:grid-cols-2 text-sm text-muted-foreground">
        {reraId && (
          <div>
            <p className="font-medium text-foreground">RERA Registration</p>
            <p>{reraId}</p>
            {reraLink && (
              <a
                href={reraLink}
                target="_blank"
                rel="noreferrer"
                className="text-primary underline underline-offset-2"
              >
                View on RERA portal
              </a>
            )}
          </div>
        )}
        {possessionDate && (
          <div>
            <p className="font-medium text-foreground">Projected Possession</p>
            <p>{possessionDate}</p>
          </div>
        )}
      </div>
    </section>
  );
}


