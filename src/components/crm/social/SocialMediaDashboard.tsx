'use client';

import { useState, useEffect, useCallback } from 'react';
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

function toIST(ts: string): string {
  if (!ts) return '';
  const normalized = ts.includes('Z') || ts.includes('+') ? ts : ts + 'Z';
  const ist = new Date(new Date(normalized).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toLocaleString('en-IN', {
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
  { platform: 'X', content_type: 'tweet', formatLabel: 'TWEET', charLimit: 'Max 240 chars' },
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
          <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap">{post.caption}</p>
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
    await fetch('/api/social/post', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ post_id: id }),
    });
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
    if (!post.image_prompt) return;
    setActionId(post.id);
    await fetch('/api/social/generate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: post.image_prompt, post_id: post.id }),
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
                    <img src={post.image_url} alt="" className="w-full h-40 object-cover rounded-lg" />
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
                    {!post.image_url && post.image_prompt && (
                      <button
                        onClick={() => generateImage(post)}
                        disabled={actionId === post.id}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-700 hover:bg-gray-600 disabled:opacity-40 text-gray-300 text-xs font-medium transition-colors"
                      >
                        <ImagePlus size={12} /> Generate Image
                      </button>
                    )}
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
            <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-900 rounded-lg p-3">
              {post.caption}
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
              <img src={post.image_url} alt="" className="w-full h-full object-cover" />
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

// ── Main Dashboard ────────────────────────────────────────────────────────────

const TABS = ['Generate', 'Queue', 'Manual', 'History'] as const;
type Tab = typeof TABS[number];

export default function SocialMediaDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('Generate');

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

        {activeTab === 'Generate' && <GenerateTab />}
        {activeTab === 'Queue' && <QueueTab />}
        {activeTab === 'Manual' && <ManualTab />}
        {activeTab === 'History' && <HistoryTab />}
      </div>
    </div>
  );
}
