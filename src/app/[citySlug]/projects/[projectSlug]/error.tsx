"use client";

import * as React from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    console.error("[ProjectPage error.tsx]", error);
  }, [error]);

  return (
    <div className="container mx-auto px-4 py-16">
      <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
      <p className="text-muted-foreground mb-4">{error.message}</p>
      {error.digest ? <p className="text-xs text-muted-foreground mb-4">Digest: {error.digest}</p> : null}
      <button
        onClick={() => reset()}
        className="rounded-md bg-primary text-primary-foreground px-4 py-2 hover:bg-primary/90"
      >
        Try again
      </button>
    </div>
  );
}
