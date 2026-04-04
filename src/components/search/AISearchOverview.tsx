'use client';

import { useEffect, useState } from 'react';

interface AISearchOverviewProps {
  query: string;
  results: any[];
  totalCount: number;
  isLoading?: boolean;
}

export function AISearchOverview({ query, results, totalCount, isLoading }: AISearchOverviewProps) {
  const [overview, setOverview] = useState<string | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  // Key on the first 5 project names so we re-fetch if results change
  const resultKey = results?.slice(0, 5).map(r => r.project_name).join('|') ?? '';

  useEffect(() => {
    if (!query || !results?.length || isLoading) return;

    setOverview(null);
    setOverviewLoading(true);

    fetch('/api/search/ai-overview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query, results, totalCount }),
    })
      .then(r => r.json())
      .then(d => {
        setOverview(d.overview ?? null);
        setOverviewLoading(false);
      })
      .catch(() => setOverviewLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, resultKey]);

  if (!overviewLoading && !overview) return null;

  return (
    <div style={{
      marginBottom: 20,
      borderRadius: 12,
      border: '1px solid #DBEAFE',
      background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
      padding: '16px 20px',
    }}>
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Sparkle icon */}
        <div style={{ flexShrink: 0, marginTop: 2 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#2563EB', marginBottom: 8, fontFamily: "'Outfit', sans-serif" }}>
            Westside AI Overview
          </p>
          {overviewLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[100, 80, 60].map(w => (
                <div key={w} style={{ height: 12, width: `${w}%`, borderRadius: 6, background: '#BFDBFE', animation: 'pulse 1.5s ease-in-out infinite' }} />
              ))}
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
            </div>
          ) : (
            <p style={{ fontSize: 14, lineHeight: 1.65, color: '#374151', fontFamily: "'Outfit', sans-serif", margin: 0 }}>
              {overview}
            </p>
          )}
          {!overviewLoading && totalCount > 0 && (
            <p style={{ marginTop: 8, fontSize: 12, color: '#3B82F6', fontFamily: "'Outfit', sans-serif" }}>
              {totalCount} project{totalCount !== 1 ? 's' : ''} match your search
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
