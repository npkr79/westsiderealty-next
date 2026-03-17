'use client';

import { useState, useEffect, useRef } from 'react';
import { Loader2, Check, MessageSquare, RefreshCw, ImageIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface Occasion {
  id: string;
  occasion_name: string;
  occasion_date: string;
  occasion_type?: string;
  religions?: string[];
  platforms?: string[];
  auto_generate?: boolean;
  stage: string;
}

interface OccasionCaption {
  id: string;
  occasion_id: string;
  platform: string;
  caption: string;
  hashtags?: string[];
  image_prompt?: string;
  status: string;
  feedback?: string;
  image_url?: string;
  image_status?: string;
  batch_id?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function platformColor(p: string): string {
  const map: Record<string, string> = {
    Facebook: 'bg-blue-600',
    Instagram: 'bg-pink-600',
    LinkedIn: 'bg-sky-700',
    X: 'bg-gray-800',
    WhatsApp: 'bg-green-600',
  };
  return map[p] ?? 'bg-gray-600';
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-white text-[10px] font-semibold ${platformColor(platform)}`}>
      {platform}
    </span>
  );
}

function formatOccasionDate(dateStr: string): string {
  const d = new Date(dateStr + 'T00:00:00Z');
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    timeZone: 'UTC',
  });
}

function daysUntil(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + 'T00:00:00Z');
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

function Daysbadge({ dateStr }: { dateStr: string }) {
  const days = daysUntil(dateStr);
  if (days === 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-600 text-white">Today!</span>;
  if (days < 0) return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{Math.abs(days)}d ago</span>;
  const color = days < 7 ? 'bg-orange-600' : 'bg-blue-700';
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${color} text-white`}>{days} days away</span>;
}

function StageBadge({ stage }: { stage: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    pending: { label: 'Not Started', cls: 'bg-gray-700 text-gray-400' },
    captions_generated: { label: 'Captions Ready for Review', cls: 'bg-yellow-800 text-yellow-300' },
    captions_approved: { label: 'Generating Images…', cls: 'bg-blue-800 text-blue-300' },
    images_generated: { label: 'Images Ready for Review', cls: 'bg-orange-800 text-orange-300' },
    approved: { label: 'Approved ✓', cls: 'bg-green-800 text-green-300' },
    posted: { label: 'Posted ✓', cls: 'bg-green-700 text-green-200' },
  };
  const s = map[stage] ?? { label: stage, cls: 'bg-gray-700 text-gray-400' };
  return <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${s.cls}`}>{s.label}</span>;
}

// ── Caption Review ────────────────────────────────────────────────────────────

function CaptionReviewPanel({ occasion, onStageChange }: { occasion: Occasion; onStageChange: () => void }) {
  const [captions, setCaptions] = useState<OccasionCaption[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [feedbackId, setFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch(`/api/occasions/captions?occasion_id=${occasion.id}`)
      .then((r) => r.json())
      .then((d) => { setCaptions(d.captions ?? []); setLoading(false); });
  }, [occasion.id]);

  const approve = async (captionId: string) => {
    setApprovingId(captionId);
    const res = await fetch('/api/occasions/review-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption_id: captionId, action: 'approve' }),
    });
    const data = await res.json();
    setApprovedIds((prev) => new Set(prev).add(captionId));
    setApprovingId(null);
    if (data.all_approved) onStageChange();
  };

  const approveAll = async () => {
    for (const caption of captions) {
      if (!approvedIds.has(caption.id)) {
        await approve(caption.id);
      }
    }
  };

  const submitFeedback = async (captionId: string) => {
    if (!feedbackText.trim()) return;
    setSubmittingFeedback(true);
    const res = await fetch('/api/occasions/review-caption', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption_id: captionId, action: 'feedback', feedback: feedbackText }),
    });
    const data = await res.json();
    if (data.success) {
      setCaptions((prev) =>
        prev.map((c) => (c.id === captionId ? { ...c, caption: data.new_caption, status: 'pending_review' } : c))
      );
      setFeedbackId(null);
      setFeedbackText('');
    }
    setSubmittingFeedback(false);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  if (!captions.length) return <p className="text-gray-500 text-sm py-4 text-center">No captions to review.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Caption Review — {occasion.occasion_name}</h3>
        <button
          onClick={approveAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition-colors"
        >
          <Check size={12} /> Approve All Captions
        </button>
      </div>

      {captions.map((caption) => {
        const isApproved = approvedIds.has(caption.id) || caption.status === 'approved';
        return (
          <div
            key={caption.id}
            className={`bg-gray-800 rounded-xl p-4 space-y-3 border transition-colors ${
              isApproved ? 'border-green-600' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <PlatformBadge platform={caption.platform} />
              {isApproved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900 text-green-400">Approved ✓</span>
              )}
            </div>

            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-900 rounded-lg p-3">
              {caption.caption}
            </p>

            {caption.hashtags && caption.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {caption.hashtags.map((h) => (
                  <span key={h} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-indigo-400">
                    #{h}
                  </span>
                ))}
              </div>
            )}

            {!isApproved && (
              <div className="flex gap-2">
                <button
                  onClick={() => approve(caption.id)}
                  disabled={approvingId === caption.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  {approvingId === caption.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Approve ✓
                </button>
                <button
                  onClick={() => { setFeedbackId(caption.id); setFeedbackText(''); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
                >
                  <MessageSquare size={12} /> Give Feedback
                </button>
              </div>
            )}

            {feedbackId === caption.id && (
              <div className="space-y-2 border-t border-gray-700 pt-3">
                <textarea
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                  rows={2}
                  placeholder="e.g. Make it more festive, mention Hyderabad, change the tone..."
                  className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => submitFeedback(caption.id)}
                    disabled={submittingFeedback || !feedbackText.trim()}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium"
                  >
                    {submittingFeedback ? (
                      <><Loader2 size={12} className="animate-spin" /> Regenerating caption…</>
                    ) : (
                      'Submit Feedback'
                    )}
                  </button>
                  <button
                    onClick={() => setFeedbackId(null)}
                    className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Image Review ──────────────────────────────────────────────────────────────

function ImageReviewPanel({ occasion, onStageChange }: { occasion: Occasion; onStageChange: () => void }) {
  const [captions, setCaptions] = useState<OccasionCaption[]>([]);
  const [loading, setLoading] = useState(true);
  const [approvingId, setApprovingId] = useState<string | null>(null);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [approvedIds, setApprovedIds] = useState<Set<string>>(new Set());

  const load = () => {
    fetch(`/api/occasions/captions?occasion_id=${occasion.id}&image_status=generated`)
      .then((r) => r.json())
      .then((d) => { setCaptions(d.captions ?? []); setLoading(false); });
  };

  useEffect(() => { load(); }, [occasion.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const approveImage = async (captionId: string) => {
    setApprovingId(captionId);
    const res = await fetch('/api/occasions/review-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption_id: captionId, action: 'approve' }),
    });
    const data = await res.json();
    setApprovedIds((prev) => new Set(prev).add(captionId));
    setApprovingId(null);
    if (data.all_approved) onStageChange();
  };

  const approveAll = async () => {
    for (const caption of captions) {
      if (!approvedIds.has(caption.id)) {
        await approveImage(caption.id);
      }
    }
  };

  const regenerate = async (captionId: string) => {
    setRegeneratingId(captionId);
    const res = await fetch('/api/occasions/review-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ caption_id: captionId, action: 'regenerate' }),
    });
    const data = await res.json();
    if (data.new_image_url) {
      setCaptions((prev) =>
        prev.map((c) => (c.id === captionId ? { ...c, image_url: data.new_image_url } : c))
      );
    }
    setRegeneratingId(null);
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-gray-400" /></div>;
  if (!captions.length) return <p className="text-gray-500 text-sm py-4 text-center">No images to review.</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Image Review — {occasion.occasion_name}</h3>
        <button
          onClick={approveAll}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 text-white text-xs font-medium transition-colors"
        >
          <Check size={12} /> Approve All Images
        </button>
      </div>

      {captions.map((caption) => {
        const isApproved = approvedIds.has(caption.id);
        const isRegenerating = regeneratingId === caption.id;
        return (
          <div
            key={caption.id}
            className={`bg-gray-800 rounded-xl p-4 space-y-3 border transition-colors ${
              isApproved ? 'border-green-600' : 'border-gray-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <PlatformBadge platform={caption.platform} />
              {isApproved && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900 text-green-400">Approved ✓</span>
              )}
            </div>

            <div className="relative w-full">
              {caption.image_url ? (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={caption.image_url}
                    alt={caption.platform}
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  {isRegenerating && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-lg">
                      <Loader2 size={32} className="animate-spin text-white" />
                    </div>
                  )}
                </>
              ) : (
                <div className="w-full h-64 rounded-lg bg-gray-700 flex items-center justify-center">
                  <ImageIcon size={32} className="text-gray-500" />
                </div>
              )}
            </div>

            <p className="text-sm text-gray-400 line-clamp-2">{caption.caption}</p>

            {!isApproved && (
              <div className="flex gap-2">
                <button
                  onClick={() => approveImage(caption.id)}
                  disabled={approvingId === caption.id || isRegenerating}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-700 hover:bg-green-600 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                >
                  {approvingId === caption.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  Approve Image ✓
                </button>
                <button
                  onClick={() => regenerate(caption.id)}
                  disabled={isRegenerating || approvingId === caption.id}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 text-xs font-medium transition-colors"
                >
                  {isRegenerating ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                  Regenerate Image
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main OccasionsTab ─────────────────────────────────────────────────────────

export default function OccasionsTab() {
  const [occasions, setOccasions] = useState<Occasion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState<Occasion | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const reviewRef = useRef<HTMLDivElement>(null);

  const loadOccasions = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    fetch(`/api/occasions?month=${month}&year=${year}`)
      .then((r) => r.json())
      .then((d) => {
        setOccasions(d.occasions ?? []);
        setLoading(false);
      });
  };

  useEffect(() => { loadOccasions(); }, []);

  const refreshOccasion = async (id: string) => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const res = await fetch(`/api/occasions?month=${month}&year=${year}`);
    const data = await res.json();
    const updated: Occasion[] = data.occasions ?? [];
    setOccasions(updated);
    const updatedOccasion = updated.find((o) => o.id === id);
    if (updatedOccasion) setSelectedOccasion(updatedOccasion);
  };

  const generateCaptions = async (occasion: Occasion) => {
    setActionLoading(occasion.id);
    await fetch('/api/occasions/generate-captions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion_id: occasion.id }),
    });
    await refreshOccasion(occasion.id);
    setSelectedOccasion((prev) => prev?.id === occasion.id ? { ...prev, stage: 'captions_generated' } : prev);
    setActionLoading(null);
    reviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const generateImages = async (occasion: Occasion) => {
    setActionLoading(occasion.id);
    await fetch('/api/occasions/generate-images', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ occasion_id: occasion.id }),
    });
    await refreshOccasion(occasion.id);
    setActionLoading(null);
    reviewRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* ── Section 1: Upcoming Occasions ── */}
      <div>
        <h2 className="text-base font-semibold text-white mb-4">Upcoming Occasions</h2>

        {occasions.length === 0 && (
          <p className="text-gray-500 text-sm py-6 text-center">No occasions found for this month.</p>
        )}

        <div className="space-y-3">
          {occasions.map((occasion) => {
            const isActing = actionLoading === occasion.id;
            return (
              <div
                key={occasion.id}
                className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-base font-bold text-white">{occasion.occasion_name}</h3>
                    <p className="text-xs text-gray-400">{formatOccasionDate(occasion.occasion_date)}</p>
                  </div>
                  <Daysbadge dateStr={occasion.occasion_date} />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <StageBadge stage={occasion.stage} />
                  {occasion.platforms?.map((p) => <PlatformBadge key={p} platform={p} />)}
                </div>

                {/* Action button */}
                <div>
                  {occasion.stage === 'pending' && (
                    <button
                      onClick={() => { setSelectedOccasion(occasion); generateCaptions(occasion); }}
                      disabled={isActing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                    >
                      {isActing ? (
                        <><Loader2 size={12} className="animate-spin" /> Generating captions for all platforms… (~30 seconds)</>
                      ) : (
                        'Generate Captions'
                      )}
                    </button>
                  )}

                  {occasion.stage === 'captions_generated' && (
                    <button
                      onClick={() => { setSelectedOccasion(occasion); reviewRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="px-4 py-2 rounded-lg bg-yellow-700 hover:bg-yellow-600 text-white text-xs font-medium transition-colors"
                    >
                      Review Captions ↓
                    </button>
                  )}

                  {occasion.stage === 'captions_approved' && (
                    <button
                      onClick={() => { setSelectedOccasion(occasion); generateImages(occasion); }}
                      disabled={isActing}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white text-xs font-medium transition-colors"
                    >
                      {isActing ? (
                        <><Loader2 size={12} className="animate-spin" /> Creating festive images with your logo… (~60 seconds)</>
                      ) : (
                        'Generate Images'
                      )}
                    </button>
                  )}

                  {occasion.stage === 'images_generated' && (
                    <button
                      onClick={() => { setSelectedOccasion(occasion); reviewRef.current?.scrollIntoView({ behavior: 'smooth' }); }}
                      className="px-4 py-2 rounded-lg bg-orange-700 hover:bg-orange-600 text-white text-xs font-medium transition-colors"
                    >
                      Review Images ↓
                    </button>
                  )}

                  {(occasion.stage === 'approved' || occasion.stage === 'posted') && (
                    <button disabled className="px-4 py-2 rounded-lg bg-green-800 text-green-300 text-xs font-medium opacity-70 cursor-not-allowed">
                      All Done ✓
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Section 2: Review Panel ── */}
      {selectedOccasion && (selectedOccasion.stage === 'captions_generated' || selectedOccasion.stage === 'images_generated') && (
        <div ref={reviewRef} className="border-t border-gray-700 pt-8">
          {selectedOccasion.stage === 'captions_generated' && (
            <CaptionReviewPanel
              occasion={selectedOccasion}
              onStageChange={() => refreshOccasion(selectedOccasion.id)}
            />
          )}
          {selectedOccasion.stage === 'images_generated' && (
            <ImageReviewPanel
              occasion={selectedOccasion}
              onStageChange={() => refreshOccasion(selectedOccasion.id)}
            />
          )}
        </div>
      )}
    </div>
  );
}
