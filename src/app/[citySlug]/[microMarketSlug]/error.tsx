"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error("[MicroMarketPage] error", error);
  return (
    <div style={{ padding: 24 }}>
      <h1>Something went wrong</h1>
      <p>We're fixing this page. Please try again.</p>
      <button onClick={() => reset()}>Retry</button>
    </div>
  );
}
