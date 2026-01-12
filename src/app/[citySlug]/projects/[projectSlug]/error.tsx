"use client";

import { useEffect } from "react";

export default function ProjectError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ProjectDetailPage Error]", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
