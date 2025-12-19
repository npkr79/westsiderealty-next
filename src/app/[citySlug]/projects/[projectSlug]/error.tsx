"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ErrorBoundary] ❌ Page error caught:", error);
    console.error("[ErrorBoundary] Error message:", error?.message);
    console.error("[ErrorBoundary] Error stack:", error?.stack);
    console.error("[ErrorBoundary] Error digest:", error?.digest);
  }, [error]);

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-2xl font-semibold">This page crashed</h1>
      <p className="mt-2 text-sm opacity-80">
        Copy the message below and paste it back in chat.
      </p>

      <pre className="mt-6 whitespace-pre-wrap rounded-md border p-4 text-sm">
        {error?.message || "Unknown error"}
        {error?.digest ? `\n\ndigest: ${error.digest}` : ""}
        {error?.stack ? `\n\nstack: ${error.stack}` : ""}
      </pre>

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => reset()}
          className="rounded-md border px-4 py-2 text-sm"
        >
          Try again
        </button>
        <Link className="rounded-md border px-4 py-2 text-sm" href="/">
          Go home
        </Link>
      </div>
    </main>
  );
}

