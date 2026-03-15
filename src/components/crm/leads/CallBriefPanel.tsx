'use client';

import { useEffect, useState } from 'react';

interface CallBriefPanelProps {
  leadId: string;
  onClose: () => void;
}

interface PhoneIntelligence {
  found: boolean;
  name?: string | null;
  designation?: string | null;
  company?: string | null;
  location?: string | null;
  profile_url?: string | null;
  confidence?: string;
  summary?: string | null;
  source?: string | null;
  all_results?: { title: string; url: string; snippet: string }[];
  ai_profile?: string | null;
}

interface Brief {
  ai_summary: string;
  phone_intelligence: PhoneIntelligence;
  generated_at: string;
  cached?: boolean;
}

function timeAgo(ts: string): string {
  if (!ts) return '';
  const normalized = ts.includes('Z') || ts.includes('+') ? ts : ts + 'Z';
  const mins = Math.floor((Date.now() - new Date(normalized).getTime()) / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function CallBriefPanel({ leadId, onClose }: CallBriefPanelProps) {
  const [brief, setBrief] = useState<Brief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrief = async (forceRefresh = false) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/crm/leads/${leadId}/call-brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ forceRefresh }),
      });
      const data = await res.json();
      if (data.success) {
        setBrief({ ...data.brief, cached: data.cached });
      } else {
        setError('Failed to generate brief');
      }
    } catch {
      setError('Network error — please try again');
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => { fetchBrief(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 9998,
          background: 'rgba(0,0,0,0.5)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        zIndex: 9999,
        background: typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
          ? '#1a1a1a' : '#ffffff',
        borderRadius: '16px 16px 0 0',
        padding: '20px 16px 40px',
        maxHeight: '80vh',
        overflowY: 'auto',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
      }}>

        {/* Header */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'center', marginBottom: '16px',
        }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--color-text-primary)' }}>
            📋 Call Brief
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none',
              fontSize: '20px', cursor: 'pointer',
              color: 'var(--color-text-tertiary)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Loading state */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '32px 0' }}>
            <div style={{ fontSize: '24px', marginBottom: '12px' }}>🤖</div>
            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
              Analysing lead data...
            </div>
          </div>
        )}

        {/* Error state */}
        {error && !loading && (
          <div style={{
            padding: '16px', borderRadius: '8px',
            background: 'var(--color-background-danger)',
            color: 'var(--color-text-danger)',
            fontSize: '13px', marginBottom: '12px',
          }}>
            {error}
            <button
              onClick={() => fetchBrief()}
              style={{
                marginLeft: '12px', textDecoration: 'underline',
                background: 'none', border: 'none', cursor: 'pointer',
                color: 'var(--color-text-danger)', fontSize: '13px',
              }}
            >
              Try again
            </button>
          </div>
        )}

        {/* Brief content */}
        {brief && !loading && (
          <>
            {/* AI Summary */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '8px',
              }}>
                AI Summary
              </div>
              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: '12px',
                padding: '14px',
                fontSize: '14px',
                lineHeight: '1.6',
                color: 'var(--color-text-primary)',
              }}>
                {brief.ai_summary}
              </div>
            </div>

            {/* Phone Intelligence */}
            <div style={{ marginBottom: '16px' }}>
              <div style={{
                fontSize: '10px', fontWeight: 500,
                color: 'var(--color-text-tertiary)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
                marginBottom: '8px',
                display: 'flex', alignItems: 'center', gap: '6px',
              }}>
                Phone Intelligence
                <span style={{
                  fontSize: '9px', padding: '1px 6px',
                  background: 'var(--color-background-info)',
                  color: 'var(--color-text-info)',
                  borderRadius: '10px',
                }}>
                  Public data only
                </span>
              </div>

              <div style={{
                background: 'var(--color-background-secondary)',
                borderRadius: '12px',
                padding: '14px',
              }}>
                {!brief.phone_intelligence?.found ? (
                  <div style={{
                    fontSize: '13px',
                    color: 'var(--color-text-tertiary)',
                    fontStyle: 'italic',
                  }}>
                    No public profile found for this number.
                  </div>
                ) : (
                  <div>
                    {/* Best result highlight */}
                    {brief.phone_intelligence.name && (
                      <div style={{
                        fontSize: '14px', fontWeight: 600,
                        color: 'var(--color-text-primary)',
                        marginBottom: '4px',
                      }}>
                        👤 {brief.phone_intelligence.name}
                      </div>
                    )}

                    {brief.phone_intelligence.source && (
                      <div style={{
                        fontSize: '11px',
                        color: 'var(--color-text-tertiary)',
                        marginBottom: '10px',
                      }}>
                        Found on {brief.phone_intelligence.source} · Confidence: {brief.phone_intelligence.confidence}
                      </div>
                    )}

                    {/* AI profile summary */}
                    {brief.phone_intelligence.ai_profile &&
                     brief.phone_intelligence.ai_profile !== 'No meaningful profile found.' && (
                      <div style={{
                        background: 'var(--color-background-secondary)',
                        borderRadius: '8px',
                        padding: '10px 12px',
                        fontSize: '13px',
                        lineHeight: 1.6,
                        color: 'var(--color-text-primary)',
                        marginBottom: '12px',
                      }}>
                        {brief.phone_intelligence.ai_profile}
                      </div>
                    )}

                    {/* Search results */}
                    <div style={{
                      fontSize: '11px', fontWeight: 500,
                      color: 'var(--color-text-tertiary)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                      marginBottom: '8px',
                    }}>
                      Google Results
                    </div>

                    {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                    {brief.phone_intelligence.all_results?.slice(0, 3).map((r: any, i: number) => (
                      <a
                        key={i}
                        href={r.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'block',
                          padding: '10px 0',
                          borderBottom: i < 2 ? '0.5px solid var(--color-border-tertiary)' : 'none',
                          textDecoration: 'none',
                        }}
                      >
                        <div style={{
                          fontSize: '13px', fontWeight: 500,
                          color: 'var(--color-text-info)',
                          marginBottom: '3px',
                          lineHeight: 1.3,
                        }}>
                          {r.title}
                        </div>
                        <div style={{
                          fontSize: '11px',
                          color: 'var(--color-text-tertiary)',
                          lineHeight: 1.5,
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}>
                          {r.snippet}
                        </div>
                        <div style={{
                          fontSize: '10px',
                          color: 'var(--color-text-tertiary)',
                          marginTop: '2px',
                          opacity: 0.6,
                        }}>
                          {r.url?.slice(0, 50)}...
                        </div>
                      </a>
                    ))}

                    <div style={{
                      marginTop: '12px', paddingTop: '8px',
                      borderTop: '0.5px solid var(--color-border-tertiary)',
                      fontSize: '11px',
                      color: 'var(--color-text-tertiary)',
                      fontStyle: 'italic',
                    }}>
                      ⚠ Public data only · verify before using
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
            }}>
              <span>
                {brief.cached ? '📦 Cached' : '✨ Fresh'} · Generated {timeAgo(brief.generated_at)}
              </span>
              <button
                onClick={() => fetchBrief(true)}
                style={{
                  background: 'none', border: 'none',
                  fontSize: '11px', cursor: 'pointer',
                  color: 'var(--color-text-info)',
                  textDecoration: 'underline',
                }}
              >
                🔄 Refresh
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
