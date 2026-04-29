'use client';

import { useState, useEffect, useCallback } from 'react';
import OccasionsTab from './OccasionsTab';
import {
  Loader2, Copy, Check, Trash2, Send, ImagePlus, Clock,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle, Sparkles,
  ChevronDown, ChevronUp, RefreshCw, Pencil,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  batch_id: string;
  platform: string;
  content_type: string;
  topic_type: string;
  content_idea: string;
  title?: string;
  caption?: string;
  article_title?: string;
  article_body?: string;
  hashtags?: string[];
  image_prompt?: string;
  status: 'draft';
  // UI state
  _scheduledAt: string;
  _imagePrompt: string;
  _expanded: boolean;
  _saved: boolean;
  _discarded: boolean;
}

interface SavedPost {
  id: string;
  batch_id?: string;
  content_idea?: string;
  content_type: string;
  topic_type?: string;
  platform: string;
  title?: string;
  caption?: string;
  article_title?: string;
  article_body?: string;
  hashtags?: string[];
  image_prompt?: string;
  image_url?: string;
  scheduled_at?: string;
  status: string;
  platform_post_id?: string;
  posted_at?: string;
  post_error?: string;
  created_at: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Renders a caption string with:
 * - **text** → bold bright-orange
 * - \n\n  → paragraph break
 * - "— REMAX…" signature → forced onto its own line in orange
 */
function renderCaption(text: string): React.ReactNode {
  if (!text) return null;

  // Guarantee the signature is always on its own paragraph
  const normalized = text.replace(
    /\s*\n*\s*(—\s*(?:REMAX|Remax)\b[^\n]*)/g,
    '\n\n$1'
  );

  const paragraphs = normalized.split(/\n\n+/);

  return (
    <span className="leading-relaxed">
      {paragraphs.map((para, pIdx) => {
        const isSignature = /^—\s*(REMAX|Remax)/i.test(para.trim());
        const parts = para.split(/(\*\*[^*]+\*\*)/g);
        return (
          <span key={pIdx} className={`block ${pIdx > 0 ? 'mt-2' : ''}`}>
            {parts.map((part, i) => {
              const bold = part.match(/^\*\*(.+)\*\*$/s);
              if (bold) {
                return (
                  <strong key={i} className="font-bold text-orange-400">
                    {bold[1]}
                  </strong>
                );
              }
              return (
                <span key={i} className={isSignature ? 'font-semibold text-orange-400' : ''}>
                  {part}
                </span>
              );
            })}
          </span>
        );
      })}
    </span>
  );
}

function toIST(ts: string): string {
  if (!ts) return '';
  return new Date(ts).toLocaleString('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }) + ' IST';
}

// ── Shared Helpers ─────────────────────────────────────────────────────────────

function platformBg(p: string): string {
  const map: Record<string, string> = {
    Facebook: 'bg-blue-600', Instagram: 'bg-pink-600',
    LinkedIn: 'bg-sky-700', X: 'bg-gray-800', WhatsApp: 'bg-green-600',
  };
  return map[p] ?? 'bg-gray-600';
}

function platformIconEl(p: string, size = 12) {
  if (p === 'Facebook') return <Facebook size={size} />;
  if (p === 'Instagram') return <Instagram size={size} />;
  if (p === 'LinkedIn') return <Linkedin size={size} />;
  if (p === 'X') return <Twitter size={size} />;
  if (p === 'WhatsApp') return <MessageCircle size={size} />;
  return null;
}

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold ${platformBg(platform)}`}>
      {platformIconEl(platform)} {platform}
    </span>
  );
}

function FormatBadge({ contentType }: { contentType: string }) {
  const label = { post: 'POST', article: 'ARTICLE', tweet: 'TWEET', broadcast: 'BROADCAST' }[contentType]
    ?? contentType.toUpperCase();
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-400">{label}</span>
  );
}

function CopyButton({ text, label = 'Copy Caption' }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
      }}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied!' : label}
    </button>
  );
}

function FilterBar({ filters, active, onSelect }: { filters: string[]; active: string; onSelect: (f: string) => void }) {
  return (
    <div className="flex gap-1.5 flex-wrap mb-4">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onSelect(f)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            active === f ? 'bg-gray-600 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

// ── Topic types and platform combos ───────────────────────────────────────────

const TOPIC_TYPES = [
  { id: 'Property Launch', emoji: '🏠', desc: 'New project or phase announcement' },
  { id: 'Market Intelligence', emoji: '📊', desc: 'Price trends, data, market analysis' },
  { id: 'Investment Insight', emoji: '💡', desc: 'ROI, appreciation, investment thesis' },
  { id: 'Listing Showcase', emoji: '🏡', desc: 'Specific property or unit highlight' },
  { id: 'Area Guide', emoji: '📍', desc: 'Micro-market deep dive' },
  { id: 'Announcement', emoji: '📢', desc: 'Events, news, milestones' },
];

const ALL_COMBOS = [
  { platform: 'Facebook', content_type: 'post', formatLabel: 'POST', charLimit: '200–400 chars' },
  { platform: 'Instagram', content_type: 'post', formatLabel: 'POST', charLimit: '150–250 chars' },
  { platform: 'LinkedIn', content_type: 'post', formatLabel: 'POST', charLimit: '150–300 chars' },
  { platform: 'LinkedIn', content_type: 'article', formatLabel: 'ARTICLE', charLimit: 'Long form' },
  { platform: 'X', content_type: 'tweet', formatLabel: 'POST', charLimit: 'Long form (Premium)' },
  { platform: 'WhatsApp', content_type: 'broadcast', formatLabel: 'BROADCAST', charLimit: '150–300 chars' },
];

const DEFAULTS: Record<string, string[]> = {
  'Property Launch': ['Facebook|post', 'Instagram|post', 'WhatsApp|broadcast'],
  'Market Intelligence': ['LinkedIn|article', 'LinkedIn|post', 'X|tweet'],
  'Investment Insight': ['LinkedIn|article', 'X|tweet'],
  'Listing Showcase': ['Instagram|post', 'Facebook|post'],
  'Area Guide': ['LinkedIn|article', 'Facebook|post'],
  'Announcement': ['Facebook|post', 'Instagram|post', 'WhatsApp|broadcast', 'X|tweet'],
};

// ── Result Card ───────────────────────────────────────────────────────────────

interface ResultCardProps {
  post: GeneratedPost;
  saving: boolean;
  regenerating: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onRegenerate: () => void;
  onUpdate: (patch: Partial<GeneratedPost>) => void;
}

function ResultCard({ post, saving, regenerating, onSave, onDiscard, onRegenerate, onUpdate }: ResultCardProps) {
  const isArticle = post.content_type === 'article';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <PlatformBadge platform={post.platform} />
          <FormatBadge contentType={post.content_type} />
          {post._saved && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-900 text-green-400">Saved ✓</span>
          )}
        </div>
        {post.title && !isArticle && (
          <span className="text-xs text-gray-500 truncate max-w-[200px]">{post.title}</span>
        )}
      </div>

      {isArticle ? (
        <div>
          <div className="text-sm font-semibold text-white mb-2">{post.article_title}</div>
          <div className="text-sm text-gray-400 leading-relaxed whitespace-pre-wrap">
            {post._expanded
              ? post.article_body
              : `${(post.article_body ?? '').slice(0, 200)}${(post.article_body?.length ?? 0) > 200 ? '…' : ''}`}
          </div>
          {(post.article_body?.length ?? 0) > 200 && (
            <button
              onClick={() => onUpdate({ _expanded: !post._expanded })}
              className="flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 transition-colors"
            >
              {post._expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              {post._expanded ? 'Collapse' : 'Read full article'}
            </button>
          )}
        </div>
      ) : (
        <div>
          <p className="text-sm text-gray-200">{renderCaption(post.caption ?? '')}</p>
          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-xs text-indigo-400 mt-1.5">{post.hashtags.map((h) => '#' + h).join(' ')}</p>
          )}
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-500 mb-1">Image prompt</label>
        <input
          type="text"
          value={post._imagePrompt}
          onChange={(e) => onUpdate({ _imagePrompt: e.target.value })}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
        />
      </div>

      <div>
        <label className="block text-xs text-gray-500 mb-1">Schedule (optional)</label>
        <input
          type="datetime-local"
          value={post._scheduledAt}
          onChange={(e) => onUpdate({ _scheduledAt: e.target.value })}
          className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={onSave}
          disabled={saving || post._saved}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
          {post._saved ? 'Saved ✓' : 'Save to Queue'}
        </button>
        <button
          onClick={onRegenerate}
          disabled={regenerating || post._saved}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 text-sm font-medium transition-colors"
        >
          {regenerating ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Regenerate
        </button>
        <button
          onClick={onDiscard}
          disabled={post._saved}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-red-900/60 disabled:opacity-40 disabled:cursor-not-allowed text-gray-400 hover:text-red-300 text-sm font-medium transition-colors"
        >
          <Trash2 size={14} /> Discard
        </button>
      </div>
    </div>
  );
}

// ── Tab: Generate ─────────────────────────────────────────────────────────────

function GenerateTab() {
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 'results'>(1);
  const [idea, setIdea] = useState('');
  const [topicType, setTopicType] = useState<string | null>(null);
  const [selections, setSelections] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [generatedPosts, setGeneratedPosts] = useState<GeneratedPost[]>([]);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [regeneratingIdx, setRegeneratingIdx] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const selectTopicType = (type: string) => {
    setTopicType(type);
    setSelections(new Set(DEFAULTS[type] ?? []));
  };

  const toggleSelection = (key: string) => {
    setSelections((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const selectedCombos = ALL_COMBOS.filter((c) => selections.has(`${c.platform}|${c.content_type}`));

  const generate = async () => {
    if (!idea.trim() || !topicType || selectedCombos.length === 0) return;
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          topic_type: topicType,
          selections: selectedCombos.map(({ platform, content_type }) => ({ platform, content_type })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setGeneratedPosts(
        (data.posts as GeneratedPost[]).map((p) => ({
          ...p,
          _scheduledAt: '',
          _imagePrompt: (p.image_prompt as string) ?? '',
          _expanded: false,
          _saved: false,
          _discarded: false,
        }))
      );
      setStep('results');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed');
    } finally {
      setGenerating(false);
    }
  };

  const saveToQueue = async (idx: number) => {
    const post = generatedPosts[idx];
    setSavingIdx(idx);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: post.batch_id,
          content_idea: post.content_idea,
          content_type: post.content_type,
          topic_type: post.topic_type,
          platform: post.platform,
          title: post.article_title ?? post.title,
          caption: post.caption ?? null,
          article_title: post.article_title ?? null,
          article_body: post.article_body ?? null,
          hashtags: post.hashtags ?? [],
          image_prompt: post._imagePrompt,
          scheduled_at: post._scheduledAt || null,
          status: post._scheduledAt ? 'scheduled' : 'draft',
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setGeneratedPosts((prev) => prev.map((p, i) => (i === idx ? { ...p, _saved: true } : p)));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingIdx(null);
    }
  };

  const regenerate = async (idx: number) => {
    const post = generatedPosts[idx];
    setRegeneratingIdx(idx);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idea,
          topic_type: topicType,
          selections: [{ platform: post.platform, content_type: post.content_type }],
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Regeneration failed');
      const newPost = data.posts?.[0];
      if (newPost) {
        setGeneratedPosts((prev) =>
          prev.map((p, i) =>
            i === idx
              ? {
                  ...newPost,
                  _scheduledAt: p._scheduledAt,
                  _imagePrompt: (newPost.image_prompt as string) ?? '',
                  _expanded: false,
                  _saved: false,
                  _discarded: false,
                }
              : p
          )
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Regeneration failed');
    } finally {
      setRegeneratingIdx(null);
    }
  };

  const resetWizard = () => {
    setStep(1);
    setIdea('');
    setTopicType(null);
    setSelections(new Set());
    setGeneratedPosts([]);
    setError(null);
  };

  // ── Results view ──
  if (step === 'results') {
    const visible = generatedPosts.filter((p) => !p._discarded);
    return (
      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-white">Generated Content</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              {visible.length} piece{visible.length !== 1 ? 's' : ''} · {idea.slice(0, 60)}{idea.length > 60 ? '…' : ''}
            </p>
          </div>
          <button
            onClick={resetWizard}
            className="text-sm text-gray-500 hover:text-white transition-colors flex-shrink-0"
          >
            ← New batch
          </button>
        </div>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        {visible.length === 0 ? (
          <p className="text-gray-500 text-sm py-8 text-center">All posts discarded.</p>
        ) : (
          visible.map((post, visualIdx) => {
            const realIdx = generatedPosts.findIndex((p) => p === post);
            return (
              <ResultCard
                key={realIdx}
                post={post}
                saving={savingIdx === realIdx}
                regenerating={regeneratingIdx === realIdx}
                onSave={() => saveToQueue(realIdx)}
                onDiscard={() =>
                  setGeneratedPosts((prev) => prev.map((p, i) => (i === realIdx ? { ...p, _discarded: true } : p)))
                }
                onRegenerate={() => regenerate(realIdx)}
                onUpdate={(patch) =>
                  setGeneratedPosts((prev) => prev.map((p, i) => (i === realIdx ? { ...p, ...patch } : p)))
                }
              />
            );
          })
        )}
      </div>
    );
  }

  // ── Wizard ──
  return (
    <div className="space-y-6">
      {/* Step indicator */}
      <div className="flex items-center mb-2">
        {[1, 2, 3, 4].map((s, i) => {
          const isActive = step === s;
          const isDone = typeof step === 'number' && step > s;
          return (
            <div key={s} className="flex items-center">
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  isDone ? 'bg-green-700 text-white' : isActive ? 'bg-indigo-600 text-white' : 'bg-gray-800 text-gray-500'
                }`}
              >
                {isDone ? '✓' : s}
              </div>
              {i < 3 && (
                <div className={`h-px w-8 ${isDone ? 'bg-green-700' : 'bg-gray-700'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step 1 — Idea */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-0.5">What&apos;s the topic?</h2>
            <p className="text-xs text-gray-500 mb-3">
              Add specific details — price, location, developer, USPs — for better content
            </p>
            <textarea
              value={idea}
              onChange={(e) => setIdea(e.target.value)}
              rows={5}
              placeholder="e.g. My Home Udyan launched in Tellapur beside My Home Vipina. 3BHK starting ₹1.8Cr. Gated community with clubhouse."
              className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={() => setStep(2)}
              disabled={!idea.trim()}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — Topic type */}
      {step === 2 && (
        <div className="space-y-4">
          <h2 className="text-base font-semibold text-white">What type of content?</h2>
          <div className="grid grid-cols-2 gap-3">
            {TOPIC_TYPES.map(({ id, emoji, desc }) => (
              <button
                key={id}
                onClick={() => selectTopicType(id)}
                className={`text-left p-4 rounded-xl border transition-colors ${
                  topicType === id
                    ? 'border-indigo-500 bg-indigo-950/50'
                    : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                }`}
              >
                <div className="text-2xl mb-1.5">{emoji}</div>
                <div className="text-sm font-semibold text-white">{id}</div>
                <div className="text-xs text-gray-500 mt-0.5">{desc}</div>
              </button>
            ))}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-gray-500 hover:text-white transition-colors">
              ← Back
            </button>
            <button
              onClick={() => setStep(3)}
              disabled={!topicType}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 3 — Platforms & formats */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-semibold text-white mb-0.5">Choose platforms & formats</h2>
            <p className="text-xs text-gray-500">Recommended for {topicType} are pre-selected</p>
          </div>
          <div className="space-y-2">
            {ALL_COMBOS.map(({ platform, content_type, formatLabel, charLimit }) => {
              const key = `${platform}|${content_type}`;
              const selected = selections.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleSelection(key)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border transition-colors ${
                    selected ? 'border-indigo-500 bg-indigo-950/40' : 'border-gray-700 bg-gray-800 hover:border-gray-500'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${platformBg(platform)}`}>
                      {platformIconEl(platform, 14)}
                    </div>
                    <span className="text-sm font-medium text-white">{platform}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                      {formatLabel}
                    </span>
                    <span className="text-xs text-gray-500 hidden sm:block">{charLimit}</span>
                    <div
                      className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                        selected ? 'border-indigo-500 bg-indigo-600' : 'border-gray-600'
                      }`}
                    >
                      {selected && <Check size={10} className="text-white" />}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="flex justify-between">
            <button onClick={() => setStep(2)} className="text-sm text-gray-500 hover:text-white transition-colors">
              ← Back
            </button>
            <button
              onClick={() => setStep(4)}
              disabled={selections.size === 0}
              className="px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      )}

      {/* Step 4 — Generate */}
      {step === 4 && (
        <div className="space-y-5">
          <h2 className="text-base font-semibold text-white">Ready to generate</h2>

          <div className="bg-gray-800 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0 pt-0.5">Topic</span>
              <span className="text-sm text-gray-300">{idea.slice(0, 120)}{idea.length > 120 ? '…' : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0">Type</span>
              <span className="text-sm text-gray-300">{topicType}</span>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs text-gray-500 w-20 flex-shrink-0 pt-0.5">Generating</span>
              <div className="flex flex-wrap gap-1.5">
                {selectedCombos.map(({ platform, content_type, formatLabel }) => (
                  <span key={`${platform}|${content_type}`} className="text-xs px-2 py-0.5 rounded-full bg-gray-700 text-gray-300">
                    {platform} {formatLabel}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          {generating ? (
            <div className="flex flex-col items-center py-10 gap-3 text-gray-400">
              <Loader2 size={36} className="animate-spin text-indigo-400" />
              <span className="text-sm">AI is crafting your content…</span>
              <span className="text-xs text-gray-600">
                Generating {selectedCombos.length} piece{selectedCombos.length !== 1 ? 's' : ''}
              </span>
            </div>
          ) : (
            <div className="flex justify-between">
              <button onClick={() => setStep(3)} className="text-sm text-gray-500 hover:text-white transition-colors">
                ← Back
              </button>
              <button
                onClick={generate}
                className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium transition-colors"
              >
                <Sparkles size={16} />
                Generate with AI
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Tab: Queue ─────────────────────────────────────────────────────────────────

function QueueTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [platformFilter, setPlatformFilter] = useState('All');
  const [actionId, setActionId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCaption, setEditCaption] = useState('');
  const [editScheduledAt, setEditScheduledAt] = useState('');
  const [postErrors, setPostErrors] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/social/posts?status=draft,scheduled');
    const data = await res.json();
    setPosts(data.posts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const postNow = async (id: string) => {
    setActionId(id);
    setPostErrors((prev) => { const e = { ...prev }; delete e[id]; return e; });
    const res = await fetch('/api/social/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id }),
    });
    const data = await res.json();
    if (!data.success) {
      setPostErrors((prev) => ({ ...prev, [id]: data.error ?? 'Post failed — check platform credentials' }));
    }
    await load();
    setActionId(null);
  };

  const deletePost = async (id: string) => {
    setActionId(id);
    await fetch(`/api/social/posts?id=${id}`, { method: 'DELETE' });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setActionId(null);
  };

  const generateImage = async (post: SavedPost) => {
    setActionId(post.id);
    await fetch('/api/social/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: post.id }),
    });
    await load();
    setActionId(null);
  };

  const startEdit = (post: SavedPost) => {
    setEditingId(post.id);
    setEditCaption(post.caption ?? '');
    setEditScheduledAt(post.scheduled_at ? post.scheduled_at.slice(0, 16) : '');
  };

  const saveEdit = async (id: string) => {
    setActionId(id);
    await fetch('/api/social/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id,
        caption: editCaption,
        scheduled_at: editScheduledAt || null,
        status: editScheduledAt ? 'scheduled' : 'draft',
      }),
    });
    setEditingId(null);
    await load();
    setActionId(null);
  };

  const PLATFORM_FILTERS = ['All', 'Facebook', 'Instagram', 'LinkedIn', 'X', 'WhatsApp'];
  const filteredPosts = platformFilter === 'All' ? posts : posts.filter((p) => p.platform === platformFilter);

  // Group by batch_id
  const groups: Record<string, { content_idea: string; posts: SavedPost[] }> = {};
  for (const post of filteredPosts) {
    const key = post.batch_id ?? `single-${post.id}`;
    if (!groups[key]) groups[key] = { content_idea: post.content_idea ?? '', posts: [] };
    groups[key].posts.push(post);
  }

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-5">
      <FilterBar filters={PLATFORM_FILTERS} active={platformFilter} onSelect={setPlatformFilter} />

      {filteredPosts.length === 0 && (
        <p className="text-gray-500 text-sm py-6 text-center">No posts in queue.</p>
      )}

      {Object.entries(groups).map(([batchId, { content_idea, posts: batchPosts }]) => (
        <div key={batchId}>
          {content_idea && (
            <p className="text-xs text-gray-500 mb-2 px-0.5">
              {content_idea.slice(0, 100)}{content_idea.length > 100 ? '…' : ''}
            </p>
          )}
          <div className="space-y-3">
            {batchPosts.map((post) => (
              <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
                {/* Header */}
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <PlatformBadge platform={post.platform} />
                    <FormatBadge contentType={post.content_type} />
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        post.status === 'scheduled' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>
                </div>

                {/* Image */}
                {post.image_url && (
                  <div className="w-full overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url} alt="" loading="lazy" decoding="async" className="w-full h-40 object-cover rounded-lg" />
                  </div>
                )}

                {/* Content preview */}
                {post.article_title ? (
                  <div>
                    <div className="text-sm font-semibold text-white">{post.article_title}</div>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{post.article_body ?? ''}</p>
                  </div>
                ) : (
                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
                    {(post.caption ?? '').slice(0, 120)}{(post.caption?.length ?? 0) > 120 ? '…' : ''}
                  </p>
                )}

                {post.scheduled_at && (
                  <p className="flex items-center gap-1 text-xs text-gray-500">
                    <Clock size={12} /> {toIST(post.scheduled_at)}
                  </p>
                )}

                {/* Post error */}
                {(postErrors[post.id] || post.post_error) && (
                  <p className="text-xs text-red-400 bg-red-950/40 rounded-lg px-3 py-2 border border-red-900">
                    ⚠ {postErrors[post.id] ?? post.post_error}
                  </p>
                )}

                {/* Inline editor */}
                {editingId === post.id && (
                  <div className="space-y-2 border-t border-gray-700 pt-3">
                    <textarea
                      value={editCaption}
                      onChange={(e) => setEditCaption(e.target.value)}
                      rows={3}
                      className="w-full bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                    />
                    <input
                      type="datetime-local"
                      value={editScheduledAt}
                      onChange={(e) => setEditScheduledAt(e.target.value)}
                      className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => saveEdit(post.id)}
                        disabled={actionId === post.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium"
                      >
                        {actionId === post.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Actions */}
                {editingId !== post.id && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => postNow(post.id)}
                      disabled={actionId === post.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium transition-colors"
                    >
                      {actionId === post.id ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                      Post Now
                    </button>
                    <button
                      onClick={() => startEdit(post)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-xs font-medium transition-colors"
                    >
                      <Pencil size={12} /> Edit
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={actionId === post.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-red-300 text-xs font-medium transition-colors"
                    >
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Manual ───────────────────────────────────────────────────────────────

function ManualTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/social/posts?status=draft,scheduled')
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.posts ?? []).filter(
          (p: SavedPost) => p.platform === 'X' || p.platform === 'WhatsApp'
        );
        setPosts(filtered);
        setLoading(false);
      });
  }, []);

  const markPosted = async (id: string) => {
    setMarkingId(id);
    await fetch('/api/social/posts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'published', posted_at: new Date().toISOString() }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setMarkingId(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (posts.length === 0) return <p className="text-gray-500 text-sm py-8 text-center">No X or WhatsApp posts in queue.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <PlatformBadge platform={post.platform} />

          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-500">Caption</span>
              <CopyButton text={post.caption ?? ''} />
            </div>
            <p className="text-sm text-gray-200 bg-gray-900 rounded-lg p-3">
              {renderCaption(post.caption ?? '')}
            </p>
          </div>

          {post.hashtags && post.hashtags.length > 0 && (
            <p className="text-xs text-indigo-400">{post.hashtags.map((h) => '#' + h).join(' ')}</p>
          )}

          {post.scheduled_at && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} /> Scheduled: {toIST(post.scheduled_at)}
            </p>
          )}

          <button
            onClick={() => markPosted(post.id)}
            disabled={markingId === post.id}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-800 hover:bg-green-700 disabled:opacity-40 text-green-200 text-xs font-medium transition-colors"
          >
            {markingId === post.id ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
            Mark as Posted
          </button>
        </div>
      ))}
    </div>
  );
}

// ── Tab: History ──────────────────────────────────────────────────────────────

function HistoryTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/social/posts?status=published')
      .then((r) => r.json())
      .then((data) => { setPosts(data.posts ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (posts.length === 0) return <p className="text-gray-500 text-sm py-8 text-center">No published posts yet.</p>;

  return (
    <div className="space-y-3">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 flex items-start gap-4">
          {post.image_url && (
            <div className="w-16 h-16 overflow-hidden rounded-lg flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={post.image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <PlatformBadge platform={post.platform} />
              <FormatBadge contentType={post.content_type} />
            </div>
            <p className="text-sm text-gray-400 line-clamp-2">
              {post.article_title ?? (post.caption ?? '').slice(0, 120)}
            </p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              {post.posted_at && (
                <p className="text-xs text-gray-600">
                  {toIST(post.posted_at)}
                </p>
              )}
              {post.platform_post_id && (
                <span className="text-xs text-gray-600 font-mono">{post.platform_post_id}</span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: News ─────────────────────────────────────────────────────────────────

interface NewsPost extends SavedPost {
  news_article_id?: string;
  post_category?: string;
}

const PLATFORM_COLORS: Record<string, string> = {
  LinkedIn: 'bg-blue-900 text-blue-300',
  Instagram: 'bg-pink-900 text-pink-300',
  Facebook: 'bg-indigo-900 text-indigo-300',
  X: 'bg-gray-700 text-gray-300',
};

// Daily publish slots (UTC) in chronological order: 9:30am, 1:00pm, 7:00pm, 9:00pm IST
const DAILY_SLOTS_UTC: [number, number][] = [
  [4, 0],   // 9:30am IST
  [7, 30],  // 1:00pm IST
  [13, 30], // 7:00pm IST
  [15, 30], // 9:00pm IST
];

function slotISO(dateIST: string, hourUTC: number, minuteUTC: number): string {
  return new Date(
    `${dateIST}T${String(hourUTC).padStart(2, '0')}:${String(minuteUTC).padStart(2, '0')}:00Z`
  ).toISOString();
}

// Find next available slot across days. Each day has 4 slots; overflow → next day.
async function findNextAvailableSlot(): Promise<string> {
  const res = await fetch('/api/social/posts?status=scheduled');
  const data = await res.json();
  const scheduledPosts = (data.posts ?? []).filter(
    (p: NewsPost) => p.post_category === 'news' && p.scheduled_at
  );

  // Normalize ISO strings to epoch ms for reliable comparison
  // (Supabase returns "2026-04-13T04:00:00+00:00", slotISO returns "2026-04-13T04:00:00.000Z" — same time, different strings)
  const bookedByDate: Record<string, Set<number>> = {};
  for (const post of scheduledPosts) {
    const epochMs = new Date(post.scheduled_at!).getTime();
    const pIST = new Date(epochMs + 5.5 * 60 * 60 * 1000);
    const dateStr = pIST.toISOString().split('T')[0];
    if (!bookedByDate[dateStr]) bookedByDate[dateStr] = new Set();
    bookedByDate[dateStr].add(epochMs);
  }

  const nowUTC = Date.now();
  const nowIST = new Date(nowUTC + 5.5 * 60 * 60 * 1000);
  for (let dayOffset = 0; dayOffset < 14; dayOffset++) {
    const checkDate = new Date(nowIST);
    checkDate.setUTCDate(checkDate.getUTCDate() + dayOffset);
    const dateIST = checkDate.toISOString().split('T')[0];
    const booked = bookedByDate[dateIST] ?? new Set();
    if (booked.size >= DAILY_SLOTS_UTC.length) continue; // day full
    for (const [h, m] of DAILY_SLOTS_UTC) {
      const slotTime = slotISO(dateIST, h, m);
      const slotTimeUTC = new Date(slotTime).getTime();
      if (dayOffset === 0 && slotTimeUTC <= nowUTC) continue; // past slot
      if (booked.has(slotTimeUTC)) continue; // already taken
      return slotTime;
    }
  }
  const fallback = new Date(nowIST);
  fallback.setUTCDate(fallback.getUTCDate() + 14);
  return slotISO(fallback.toISOString().split('T')[0], 4, 0);
}

interface FormattedPosts {
  x: string;
  linkedin: string;
  facebook: string;
  instagram: string;
}

function NewsTab() {
  const [groups, setGroups] = useState<Map<string, NewsPost[]>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [scheduleLabels, setScheduleLabels] = useState<Record<string, string>>({});
  const [formattedPosts, setFormattedPosts] = useState<Map<string, FormattedPosts | 'loading'>>(new Map());
  const [formCopiedKey, setFormCopiedKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [r1, r2] = await Promise.all([
      fetch('/api/social/posts?status=pending_review').then((r) => r.json()),
      fetch('/api/social/posts?status=manual_ready').then((r) => r.json()),
    ]);
    const newsPosts: NewsPost[] = [
      ...(r1.posts ?? []).filter((p: NewsPost) => p.post_category === 'news'),
      ...(r2.posts ?? []).filter((p: NewsPost) => p.post_category === 'news'),
    ];
    const map = new Map<string, NewsPost[]>();
    for (const post of newsPosts) {
      const key = post.news_article_id ?? post.id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(post);
    }
    setGroups(map);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = async (post: NewsPost) => {
    const text = post.caption + (post.hashtags?.length ? '\n\n' + post.hashtags.map((h) => `#${h}`).join(' ') : '');
    await navigator.clipboard.writeText(text);
    setCopiedId(post.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const scheduleGroup = async (articleId: string, scheduledAt: string) => {
    // Only schedule FB/Instagram (pending_review) — skip manual_ready posts
    const posts = (groups.get(articleId) ?? []).filter((p) => p.status === 'pending_review');
    await Promise.all(
      posts.map((p) =>
        fetch('/api/social/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, status: 'scheduled', scheduled_at: scheduledAt }),
        })
      )
    );
    await load();
  };

  const handleApprove = async (articleId: string) => {
    setActionId(articleId);
    const scheduledAt = await findNextAvailableSlot();
    await scheduleGroup(articleId, scheduledAt);
    const label = new Date(scheduledAt).toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true,
    }) + ' IST';
    setScheduleLabels((prev) => ({ ...prev, [articleId]: label }));
    setActionId(null);
  };

  const markManualPosted = async (articleId: string) => {
    setActionId(articleId);
    const posts = (groups.get(articleId) ?? []).filter((p) => p.status === 'manual_ready');
    await Promise.all(
      posts.map((p) =>
        fetch('/api/social/posts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: p.id, status: 'published', posted_at: new Date().toISOString() }),
        })
      )
    );
    setGroups((prev) => { const m = new Map(prev); m.delete(articleId); return m; });
    setActionId(null);
  };

  const rejectGroup = async (articleId: string) => {
    setActionId(articleId);
    const posts = groups.get(articleId) ?? [];
    // Delete all social posts
    await Promise.all(posts.map((p) => fetch(`/api/social/posts?id=${p.id}`, { method: 'DELETE' })));
    // Mark the news article as rejected so it won't be re-generated
    const newsArticleId = posts[0]?.news_article_id;
    if (newsArticleId) {
      await fetch('/api/news/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: newsArticleId, is_rejected: true }),
      });
    }
    setGroups((prev) => { const m = new Map(prev); m.delete(articleId); return m; });
    setActionId(null);
  };

  const generateFormattedPosts = async (articleId: string) => {
    setFormattedPosts((prev) => new Map(prev).set(articleId, 'loading'));
    try {
      const res = await fetch('/api/news/generate-formatted-post', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId }),
      });
      const data = await res.json();
      if (data.success && data.posts) {
        setFormattedPosts((prev) => new Map(prev).set(articleId, data.posts as FormattedPosts));
      } else {
        setFormattedPosts((prev) => { const m = new Map(prev); m.delete(articleId); return m; });
        alert(data.error ?? 'Generation failed');
      }
    } catch {
      setFormattedPosts((prev) => { const m = new Map(prev); m.delete(articleId); return m; });
    }
  };

  const copyFormattedPost = async (articleId: string, platform: string, text: string) => {
    await navigator.clipboard.writeText(text);
    setFormCopiedKey(`${articleId}-${platform}`);
    setTimeout(() => setFormCopiedKey(null), 2000);
  };

  const IMAGE_PROMPT_TEMPLATE = `Create a professional social media post image using the following fixed design system.

Image size must be 940 px width × 788 px height (Facebook post size)

1) Image Size & Layout
Clean, modern, professional infographic style
Balanced layout with strong visual hierarchy
Keep adequate spacing and margins
Do not overcrowd the design
Prioritize readability on mobile screens

2) Visual Style (IMPORTANT — ALWAYS FOLLOW)
Use broad daylight lighting by default
Avoid dark, sunset, golden hour, or night themes unless explicitly requested
Use realistic urban / office / infrastructure / business environments
Use modern, high-quality, editorial-style visuals
Maintain a corporate, trustworthy, regulatory tone

3) Branding & Logos (MANDATORY)

Include logos as needed:
Regulatory bodies
Companies
Organizations
Institutions

*Avoid Govt of India logos*
Do not add any logos on top right of the image. That will be used for my company logo.
If relevant, include:

Photos of notable people mentioned
CEO / Minister / Chairman / Founder
Public figures

Logos and faces must:
Look realistic
Be clean and professional
Be placed naturally (top corner or header area)

4) Text Rules (CRITICAL)

Reduce text on the image.
Keep content short and punchy.

Follow this exact structure:

Title
Subtitle

5) Text Styling

Use:

White text for normal content
Yellow text for highlighted keywords
Bold emphasis on:

Numbers
Percentages
Years
Key warnings
Important phrases

Use a dark overlay behind text for readability.

6) Positioning Rules

Place the main title sentence near the bottom of the image.

Maintain:

Clear spacing between the bottom edge and text
Consistent alignment
Strong visual balance

7) Content Tone

The tone must be:

Professional
Regulatory
Informative
Credible
Authoritative

Avoid:

Marketing hype
Sales language
Clickbait tone

8) Visual Elements to Use

Use relevant icons such as:

Warning icons
Growth charts
Buildings
Infrastructure
Money
Legal symbols
Checklists
Government seals

But keep the design clean and minimal.

9) Output Quality

The image must be:

Sharp
Modern
Corporate-grade
Social-media ready
Readable on mobile
Professional enough for LinkedIn / Facebook

This is the post:
`;

  // Extract only the title + subtitle + FIRST content section from a post.
  // Cuts off at the second bold heading, any "Why This Matters" / "Strategic
  // Implications" / "Key Takeaway" / hashtag block, whichever comes first.
  // This keeps image-prompt context short so ChatGPT doesn't try to render
  // every bullet on the image.
  const extractFirstSection = (postText: string): string => {
    const text = postText.trim();
    if (!text) return text;

    const lines = text.split('\n');

    // Build a regex that detects "second heading"-style lines: short bold
    // Unicode lines (no bullets, no hashtags). We start counting heading-like
    // lines from the top — title (1st), subtitle (2nd if present), first
    // section heading (3rd). Cut when we hit the SECOND section heading.
    const isBoldHeading = (line: string): boolean => {
      const t = line.trim();
      if (t.length < 3 || t.length > 90) return false;
      if (t.startsWith('•') || t.startsWith('-') || t.startsWith('#')) return false;
      // Heading lines are typically all-bold (Unicode mathematical bold range)
      // or contain explicit section markers.
      const sectionMarkers = /(why this matters|strategic implications|key takeaway|key facts|key data points|implications|impact|takeaway|next steps|what to watch)/i;
      if (sectionMarkers.test(t)) return true;
      // Detect lines composed mostly of Unicode mathematical bold chars
      // Unicode mathematical sans-serif bold ranges. Need /u flag because the
      // codepoints are above BMP (surrogate pairs) — without it the engine
      // treats them as separate UTF-16 units and the range "out of order"
      // throws at parse time.
      const boldChars = (t.match(/[\u{1D5D4}-\u{1D5ED}\u{1D5EE}-\u{1D607}\u{1D7EC}-\u{1D7F5}]/gu) ?? []).length;
      return boldChars >= Math.max(3, Math.floor(t.replace(/\s/g, '').length * 0.4));
    };

    // Track heading occurrences. Stop just BEFORE the 2nd section-content heading.
    // Order: [Title] [Subtitle?] [1st Section Heading] ... bullets ...  STOP at next heading.
    let headingsSeen = 0;
    const out: string[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      // Hard stop at hashtag block — never include hashtags in image prompt.
      if (trimmed.startsWith('#')) break;

      if (isBoldHeading(trimmed)) {
        headingsSeen++;
        // Title + subtitle + first section heading are all OK (1st, 2nd, 3rd).
        // The 4th heading-like line is the start of section 2 — stop.
        if (headingsSeen >= 4) break;
      }

      out.push(line);
    }

    return out.join('\n').trim();
  };

  const buildImagePrompt = (postText: string): string =>
    IMAGE_PROMPT_TEMPLATE + extractFirstSection(postText);

  const copyImagePrompt = async (articleId: string, postText: string) => {
    const prompt = buildImagePrompt(postText);
    await navigator.clipboard.writeText(prompt);
    setFormCopiedKey(`${articleId}-imageprompt`);
    setTimeout(() => setFormCopiedKey(null), 2000);
  };

  if (loading) return <p className="text-gray-500 text-sm py-8 text-center">Loading news posts…</p>;

  if (groups.size === 0) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-400 text-sm">No news posts pending review.</p>
        <p className="text-gray-600 text-xs mt-1">Run the cron or POST to /api/cron/news-to-social to generate.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-gray-500">
        {groups.size} article{groups.size !== 1 ? 's' : ''} ready
        &nbsp;·&nbsp; FB/Insta: approve to auto-schedule &nbsp;·&nbsp; X/LinkedIn: copy &amp; post manually, then click Posted
      </p>
      {Array.from(groups.entries()).map(([articleId, posts]) => {
        const headline = posts[0]?.content_idea ?? 'Untitled';
        const imageUrl = posts[0]?.image_url;
        const isActing = actionId === articleId;
        const autoPosts = posts.filter((p) => p.status === 'pending_review');
        const manualPosts = posts.filter((p) => p.status === 'manual_ready');
        const scheduledLabel = scheduleLabels[articleId];
        return (
          <div key={articleId} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
            {/* Image + headline */}
            <div className="border-b border-gray-800">
              <div
                className="relative w-full overflow-hidden cursor-pointer bg-gray-800"
                style={{ minHeight: '200px', maxHeight: '280px' }}
                onClick={() => imageUrl && window.open(imageUrl, '_blank')}
                title={imageUrl ? 'Click to view full image' : undefined}
              >
                {imageUrl ? (
                  <>
                    <img
                      src={imageUrl}
                      alt=""
                      className="w-full object-cover"
                      style={{ minHeight: '200px', maxHeight: '280px' }}
                    />
                    <div className="absolute bottom-0 left-0 right-0 h-28 bg-gradient-to-t from-black/70 to-transparent pointer-events-none" />
                    <div className="absolute top-2 right-2 opacity-0 hover:opacity-100 transition-opacity">
                      <span className="bg-black/60 text-white text-xs px-2 py-1 rounded">Open full size ↗</span>
                    </div>
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full" style={{ minHeight: '200px' }}>
                    <span className="text-gray-600 text-sm">Generating image…</span>
                  </div>
                )}
              </div>
              <div className="p-4">
                <p className="text-sm font-medium text-white leading-snug">{headline}</p>
                {scheduledLabel && (
                  <p className="text-xs text-green-400 mt-1">✓ FB/Insta scheduled for {scheduledLabel}</p>
                )}
              </div>
            </div>

            {/* Auto platforms: FB + Instagram */}
            {autoPosts.length > 0 && (
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1">Auto-publish — Facebook & Instagram</p>
                <div className="divide-y divide-gray-800">
                  {autoPosts.map((post) => (
                    <div key={post.id} className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[post.platform] ?? 'bg-gray-700 text-gray-300'}`}>{post.platform}</span>
                      <p className="text-xs text-gray-300 mt-1">{renderCaption(post.caption ?? '')}</p>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <p className="text-xs text-blue-500 mt-1">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual platforms: X + LinkedIn */}
            {manualPosts.length > 0 && (
              <div className="border-t border-gray-800">
                <p className="text-[10px] text-gray-500 uppercase tracking-wider px-4 pt-3 pb-1">Manual post — X & LinkedIn</p>
                <div className="divide-y divide-gray-800">
                  {manualPosts.map((post) => (
                    <div key={post.id} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${PLATFORM_COLORS[post.platform] ?? 'bg-gray-700 text-gray-300'}`}>{post.platform}</span>
                        <button
                          onClick={() => copyToClipboard(post)}
                          className="text-xs px-3 py-1 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
                        >
                          {copiedId === post.id ? '✓ Copied!' : 'Copy text'}
                        </button>
                      </div>
                      <p className="text-xs text-gray-300 mt-1">{renderCaption(post.caption ?? '')}</p>
                      {post.hashtags && post.hashtags.length > 0 && (
                        <p className="text-xs text-blue-500 mt-1">{post.hashtags.map((h) => `#${h}`).join(' ')}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2 p-4 border-t border-gray-800 flex-wrap">
              {autoPosts.length > 0 && (
                <button
                  onClick={() => handleApprove(articleId)}
                  disabled={isActing}
                  className="flex-1 py-2 rounded-lg bg-green-700 hover:bg-green-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {isActing ? 'Scheduling…' : '✓ Approve & Schedule'}
                </button>
              )}
              {manualPosts.length > 0 && (
                <button
                  onClick={() => markManualPosted(articleId)}
                  disabled={isActing}
                  className="flex-1 py-2 rounded-lg bg-blue-700 hover:bg-blue-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {isActing ? 'Saving…' : '✓ Posted'}
                </button>
              )}
              <button
                onClick={() => {
                  if (formattedPosts.has(articleId)) {
                    setFormattedPosts((prev) => { const m = new Map(prev); m.delete(articleId); return m; });
                  } else {
                    generateFormattedPosts(articleId);
                  }
                }}
                disabled={isActing || formattedPosts.get(articleId) === 'loading'}
                className="px-4 py-2 rounded-lg bg-purple-900 hover:bg-purple-800 text-purple-300 text-sm font-medium disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                {formattedPosts.get(articleId) === 'loading' ? (
                  <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                ) : formattedPosts.has(articleId) ? (
                  'Hide Posts'
                ) : (
                  <><Sparkles className="w-3 h-3" /> Format Posts</>
                )}
              </button>
              <button
                onClick={() => rejectGroup(articleId)}
                disabled={isActing}
                className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 transition-colors"
              >
                Reject
              </button>
            </div>

            {/* Formatted Posts Panel */}
            {formattedPosts.has(articleId) && formattedPosts.get(articleId) !== 'loading' && (() => {
              const fp = formattedPosts.get(articleId) as FormattedPosts;
              const platforms: { key: keyof FormattedPosts; label: string; color: string }[] = [
                { key: 'x',         label: 'X',         color: 'bg-gray-700 text-gray-300' },
                { key: 'linkedin',  label: 'LinkedIn',  color: 'bg-blue-900 text-blue-300' },
                { key: 'facebook',  label: 'Facebook',  color: 'bg-indigo-900 text-indigo-300' },
                { key: 'instagram', label: 'Instagram', color: 'bg-pink-900 text-pink-300' },
              ];
              return (
                <div className="border-t border-purple-900/60 bg-[#0d0d14]">
                  <p className="text-[10px] text-purple-400 uppercase tracking-wider px-4 pt-3 pb-1">
                    Formatted Posts — copy-paste ready for all platforms
                  </p>
                  <div className="divide-y divide-gray-800/60">
                    {platforms.map(({ key, label, color }) => {
                      const text = fp[key];
                      const copyKey = `${articleId}-${key}`;
                      return (
                        <div key={key} className="px-4 py-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${color}`}>{label}</span>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyImagePrompt(articleId, text)}
                                className="text-xs px-3 py-1 rounded-lg bg-amber-900/40 hover:bg-amber-800/60 text-amber-300 transition-colors flex items-center gap-1"
                                title="Copy the full image-generation prompt (design system + this post) for ChatGPT / Gemini"
                              >
                                {formCopiedKey === `${articleId}-imageprompt`
                                  ? <><Check className="w-3 h-3 text-green-400" /> Copied!</>
                                  : <><Sparkles className="w-3 h-3" /> Image Prompt</>}
                              </button>
                              <button
                                onClick={() => copyFormattedPost(articleId, key, text)}
                                className="text-xs px-3 py-1 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 transition-colors flex items-center gap-1"
                              >
                                {formCopiedKey === copyKey
                                  ? <><Check className="w-3 h-3 text-green-400" /> Copied!</>
                                  : <><Copy className="w-3 h-3" /> Copy</>}
                              </button>
                            </div>
                          </div>
                          <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed">{text}</pre>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}
          </div>
        );
      })}
    </div>
  );
}

// ── Articles Tab ──────────────────────────────────────────────────────────────

interface SourceArticle {
  id: string;
  headline: string;
  source_name: string;
  scraped_at: string;
}

interface GeneratedArticle {
  id: string;
  slug: string | null;
  city: string;
  micro_market: string;
  seo_headline: string;
  meta_description: string;
  body: string;
  target_persona: string;
  drip_placement: string;
  status: string;
  published_at: string | null;
  created_at: string;
  image_url: string | null;
  source_articles: SourceArticle[] | null;
}

const ARTICLE_CITY_LABELS: Record<string, string> = {
  hyderabad: 'Hyderabad', goa: 'Goa', mumbai: 'Mumbai', delhi_ncr: 'Delhi NCR',
  bengaluru: 'Bengaluru', pune: 'Pune', chennai: 'Chennai', kolkata: 'Kolkata',
  ahmedabad: 'Ahmedabad', kochi: 'Kochi', navi_mumbai_thane: 'Navi Mumbai / Thane',
};

function ArticlesTab() {
  const [articles, setArticles] = useState<GeneratedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'draft' | 'published'>('draft');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/articles?status=${filter}`);
      const data = await res.json();
      setArticles(data.articles ?? []);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function publish(id: string) {
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, { method: 'POST' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setActingId(null);
    }
  }

  async function deleteArticle(id: string) {
    if (!confirm('Delete this article?')) return;
    setActingId(id);
    try {
      const res = await fetch(`/api/admin/articles/${id}/publish`, { method: 'DELETE' });
      if (res.ok) {
        setArticles((prev) => prev.filter((a) => a.id !== id));
      }
    } finally {
      setActingId(null);
    }
  }

  function readTime(body: string) {
    const mins = Math.max(1, Math.round(body.trim().split(/\s+/).length / 200));
    return `${mins} min`;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 bg-gray-900 rounded-lg p-1">
          {(['draft', 'published'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
            >
              {f === 'draft' ? 'Draft' : 'Published'}
            </button>
          ))}
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-gray-800 text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={14} />
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Loader2 className="animate-spin text-gray-500" /></div>
      ) : articles.length === 0 ? (
        <div className="text-center py-16 text-gray-500 text-sm">
          {filter === 'draft' ? 'No draft articles. The daily cron generates 2 articles at 8 AM IST.' : 'No published articles yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {articles.map((article) => {
            const isExpanded = expandedId === article.id;
            const isActing = actingId === article.id;
            return (
              <div key={article.id} className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
                {/* Header */}
                <div className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    {/* Thumbnail */}
                    {article.image_url && (
                      <div className="w-14 h-14 flex-shrink-0 rounded-lg overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={article.image_url} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* City + micro-market badges */}
                      <div className="flex items-center gap-2 flex-wrap mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full">
                          {ARTICLE_CITY_LABELS[article.city] ?? article.city}
                        </span>
                        <span className="text-[10px] text-gray-500">{article.micro_market}</span>
                        <span className="text-[10px] text-gray-600">· {readTime(article.body)}</span>
                        <span className="text-[10px] text-gray-600">· {article.drip_placement}</span>
                      </div>
                      {/* Headline */}
                      <h3 className="text-sm font-semibold text-white leading-snug mb-1">
                        {article.seo_headline}
                      </h3>
                      {/* Description */}
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">
                        {article.meta_description}
                      </p>
                      {/* Persona */}
                      <p className="text-[10px] text-gray-600 mt-1">For: {article.target_persona}</p>
                    </div>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : article.id)}
                      className="p-1.5 rounded-lg bg-gray-800 text-gray-400 hover:text-white flex-shrink-0"
                    >
                      {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>
                  </div>
                </div>

                {/* Expanded body preview + sources */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-gray-800 pt-4 space-y-4">
                    {/* Hero image preview */}
                    {article.image_url && (
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Hero Image</p>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={article.image_url} alt="Hero" className="w-full rounded-lg object-contain" />
                      </div>
                    )}
                    {/* Article body */}
                    <div>
                      <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-1.5">Article Body</p>
                      <pre className="text-xs text-gray-300 whitespace-pre-wrap font-sans leading-relaxed max-h-56 overflow-y-auto bg-gray-950 rounded-lg p-3">
                        {article.body}
                      </pre>
                    </div>
                    {/* Sources */}
                    {article.source_articles && article.source_articles.length > 0 && (
                      <div>
                        <p className="text-[10px] text-gray-600 uppercase tracking-widest mb-2">
                          Sources ({article.source_articles.length} articles)
                        </p>
                        <div className="space-y-1.5">
                          {article.source_articles.map((src) => (
                            <div key={src.id} className="bg-gray-950 rounded-lg px-3 py-2">
                              <p className="text-xs text-gray-300 leading-snug">{src.headline}</p>
                              <p className="text-[10px] text-gray-600 mt-0.5">
                                {src.source_name} · {src.scraped_at ? new Date(src.scraped_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Actions */}
                {filter === 'draft' && (
                  <div className="flex gap-2 p-3 border-t border-gray-800">
                    <button
                      onClick={() => publish(article.id)}
                      disabled={isActing}
                      className="flex-1 py-2 rounded-lg bg-amber-700 hover:bg-amber-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      {isActing ? 'Publishing…' : '↑ Publish to Website'}
                    </button>
                    <button
                      onClick={() => deleteArticle(article.id)}
                      disabled={isActing}
                      className="px-4 py-2 rounded-lg bg-gray-800 hover:bg-red-900 text-gray-400 hover:text-red-300 text-sm font-medium disabled:opacity-50 transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                )}

                {filter === 'published' && article.slug && (
                  <div className="flex gap-2 p-3 border-t border-gray-800">
                    <a
                      href={`/news-articles/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium text-center transition-colors"
                    >
                      View on Website ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = ['Occasions', 'Generate', 'Queue', 'News', 'Articles', 'Manual', 'History'] as const;
type Tab = typeof TABS[number];

export default function SocialMediaDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Occasions');

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Social Media</h1>
          <p className="text-sm text-gray-500">Generate, schedule, and publish content across all platforms</p>
        </div>

        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab ? 'bg-gray-800 text-white' : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'Occasions' && <OccasionsTab />}
        {activeTab === 'Generate' && <GenerateTab />}
        {activeTab === 'Queue' && <QueueTab />}
        {activeTab === 'News' && <NewsTab />}
        {activeTab === 'Articles' && <ArticlesTab />}
        {activeTab === 'Manual' && <ManualTab />}
        {activeTab === 'History' && <HistoryTab />}
      </div>
    </div>
  );
}
