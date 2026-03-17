'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Copy, Check, Trash2, Send, ImagePlus, Clock,
  Facebook, Instagram, Linkedin, Twitter, MessageCircle, Sparkles,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface GeneratedPost {
  platforms: string[];
  caption_facebook: string;
  caption_instagram: string;
  caption_linkedin: string;
  caption_x: string;
  caption_whatsapp: string;
  image_prompt: string;
  title: string;
  // editable state
  _caption?: string;
  _image_prompt?: string;
  _scheduled_at?: string;
}

interface SavedPost {
  id: string;
  platforms: string[];
  caption_facebook?: string;
  caption_instagram?: string;
  caption_linkedin?: string;
  caption_x?: string;
  caption_whatsapp?: string;
  image_url?: string;
  image_prompt?: string;
  scheduled_at?: string;
  status: 'draft' | 'scheduled' | 'published';
  title?: string;
  created_at: string;
  posted_facebook_at?: string;
  posted_instagram_at?: string;
  posted_linkedin_at?: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const PLATFORMS = ['Facebook', 'Instagram', 'LinkedIn', 'X', 'WhatsApp'];
const POST_COUNTS = [1, 3, 5, 10, 30];

const platformIcon = (p: string) => {
  if (p === 'Facebook') return <Facebook size={12} />;
  if (p === 'Instagram') return <Instagram size={12} />;
  if (p === 'LinkedIn') return <Linkedin size={12} />;
  if (p === 'X') return <Twitter size={12} />;
  if (p === 'WhatsApp') return <MessageCircle size={12} />;
  return null;
};

const platformColor = (p: string): string => {
  const map: Record<string, string> = {
    Facebook: 'bg-blue-600',
    Instagram: 'bg-pink-600',
    LinkedIn: 'bg-sky-700',
    X: 'bg-gray-800',
    WhatsApp: 'bg-green-600',
  };
  return map[p] ?? 'bg-gray-600';
};

function PlatformBadge({ platform }: { platform: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-white text-[10px] font-semibold ${platformColor(platform)}`}>
      {platformIcon(platform)} {platform}
    </span>
  );
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 transition-colors"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

function captionForPlatform(post: SavedPost, platform: string): string {
  if (platform === 'Facebook') return post.caption_facebook ?? '';
  if (platform === 'Instagram') return post.caption_instagram ?? '';
  if (platform === 'LinkedIn') return post.caption_linkedin ?? '';
  if (platform === 'X') return post.caption_x ?? '';
  if (platform === 'WhatsApp') return post.caption_whatsapp ?? '';
  return '';
}

function primaryCaption(post: SavedPost): string {
  return post.caption_facebook ?? post.caption_instagram ?? post.caption_x ?? post.caption_whatsapp ?? '';
}

// ── Tab: Generate ─────────────────────────────────────────────────────────────

function GenerateTab() {
  const [idea, setIdea] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['Facebook', 'Instagram']);
  const [count, setCount] = useState(3);
  const [generating, setGenerating] = useState(false);
  const [posts, setPosts] = useState<GeneratedPost[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [savingIdx, setSavingIdx] = useState<number | null>(null);
  const [savedIndices, setSavedIndices] = useState<Set<number>>(new Set());

  const togglePlatform = (p: string) => {
    setSelectedPlatforms((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]
    );
  };

  const generate = async () => {
    if (!idea.trim() || selectedPlatforms.length === 0) return;
    setGenerating(true);
    setError(null);
    setPosts([]);
    try {
      const res = await fetch('/api/social/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idea, platforms: selectedPlatforms, count }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Generation failed');
      setPosts(
        (data.posts as GeneratedPost[]).map((p) => ({
          ...p,
          _caption: p.caption_facebook || p.caption_instagram || p.caption_x || '',
          _image_prompt: p.image_prompt,
          _scheduled_at: '',
        }))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate');
    } finally {
      setGenerating(false);
    }
  };

  const saveToQueue = async (idx: number) => {
    const post = posts[idx];
    setSavingIdx(idx);
    try {
      const res = await fetch('/api/social/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: post.platforms,
          caption_facebook: post.caption_facebook,
          caption_instagram: post.caption_instagram,
          caption_linkedin: post.caption_linkedin,
          caption_x: post.caption_x,
          caption_whatsapp: post.caption_whatsapp,
          image_prompt: post._image_prompt,
          title: post.title,
          status: post._scheduled_at ? 'scheduled' : 'draft',
          scheduled_at: post._scheduled_at || null,
        }),
      });
      if (!res.ok) throw new Error('Save failed');
      setSavedIndices((prev) => new Set(prev).add(idx));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSavingIdx(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Idea input */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Content idea or topic</label>
        <textarea
          value={idea}
          onChange={(e) => setIdea(e.target.value)}
          rows={3}
          placeholder="e.g. New launch in Kokapet, market update for Q1 2026, Goa villa investment opportunity"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500 resize-none"
        />
      </div>

      {/* Platform pills */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">Platforms</label>
        <div className="flex flex-wrap gap-2">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                selectedPlatforms.includes(p)
                  ? 'border-transparent text-white ' + platformColor(p)
                  : 'border-gray-600 text-gray-400 hover:border-gray-400'
              }`}
            >
              {platformIcon(p)} {p}
            </button>
          ))}
        </div>
      </div>

      {/* Count + Generate */}
      <div className="flex items-center gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2">Number of posts</label>
          <select
            value={count}
            onChange={(e) => setCount(Number(e.target.value))}
            className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
          >
            {POST_COUNTS.map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
        </div>
        <div className="flex-1 flex items-end">
          <button
            onClick={generate}
            disabled={generating || !idea.trim() || selectedPlatforms.length === 0}
            className="flex items-center gap-2 px-5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
          >
            {generating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {generating ? 'Generating…' : 'Generate with AI'}
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {generating && (
        <div className="flex flex-col items-center py-12 text-gray-400 gap-3">
          <Loader2 size={32} className="animate-spin text-indigo-400" />
          <span className="text-sm">AI is creating your content…</span>
        </div>
      )}

      {/* Generated post cards */}
      {posts.map((post, idx) => (
        <div key={idx} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {post.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}
            </div>
            <span className="text-xs text-gray-500">{post.title}</span>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Caption</label>
            <textarea
              value={post._caption}
              onChange={(e) => {
                const updated = [...posts];
                updated[idx]._caption = e.target.value;
                setPosts(updated);
              }}
              rows={4}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Image prompt</label>
            <input
              type="text"
              value={post._image_prompt}
              onChange={(e) => {
                const updated = [...posts];
                updated[idx]._image_prompt = e.target.value;
                setPosts(updated);
              }}
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">Schedule (optional)</label>
            <input
              type="datetime-local"
              value={post._scheduled_at}
              onChange={(e) => {
                const updated = [...posts];
                updated[idx]._scheduled_at = e.target.value;
                setPosts(updated);
              }}
              className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gray-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => saveToQueue(idx)}
              disabled={savingIdx === idx || savedIndices.has(idx)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg disabled:cursor-not-allowed text-white text-sm font-medium transition-colors bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40"
            >
              {savingIdx === idx ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
              {savedIndices.has(idx) ? 'Saved ✓' : 'Save to Queue'}
            </button>
            <button
              onClick={() => setPosts((prev) => prev.filter((_, i) => i !== idx))}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium transition-colors"
            >
              <Trash2 size={14} /> Discard
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Tab: Queue ────────────────────────────────────────────────────────────────

function QueueTab() {
  const [posts, setPosts] = useState<SavedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/social/posts?status=pending');
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

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (posts.length === 0) return <p className="text-gray-500 text-sm py-8 text-center">No posts in queue.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => (
        <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex flex-wrap gap-1">{post.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}</div>
            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${post.status === 'scheduled' ? 'bg-blue-900 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
              {post.status}
            </span>
          </div>

          {post.image_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="Post image" className="w-full max-h-48 object-cover rounded-lg" />
          )}

          <p className="text-sm text-gray-300 leading-relaxed line-clamp-3">
            {primaryCaption(post).slice(0, 100)}{primaryCaption(post).length > 100 ? '…' : ''}
          </p>

          {post.scheduled_at && (
            <p className="flex items-center gap-1 text-xs text-gray-500">
              <Clock size={12} /> {new Date(post.scheduled_at).toLocaleString('en-IN')}
            </p>
          )}

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
              onClick={() => deletePost(post.id)}
              disabled={actionId === post.id}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-900/60 hover:bg-red-800 disabled:opacity-40 text-red-300 text-xs font-medium transition-colors"
            >
              <Trash2 size={12} /> Delete
            </button>
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
    fetch('/api/social/posts?status=pending')
      .then((r) => r.json())
      .then((data) => {
        const filtered = (data.posts ?? []).filter((p: SavedPost) =>
          p.platforms.some((pl) => pl === 'X' || pl === 'WhatsApp')
        );
        setPosts(filtered);
        setLoading(false);
      });
  }, []);

  const markPosted = async (id: string) => {
    setMarkingId(id);
    await fetch('/api/social/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'published' }),
    });
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setMarkingId(null);
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 size={24} className="animate-spin text-gray-400" /></div>;
  if (posts.length === 0) return <p className="text-gray-500 text-sm py-8 text-center">No X or WhatsApp posts in queue.</p>;

  return (
    <div className="space-y-4">
      {posts.map((post) => {
        const manualPlatforms = post.platforms.filter((p) => p === 'X' || p === 'WhatsApp');
        return (
          <div key={post.id} className="bg-gray-800 border border-gray-700 rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap gap-1">{manualPlatforms.map((p) => <PlatformBadge key={p} platform={p} />)}</div>

            {manualPlatforms.map((platform) => {
              const caption = captionForPlatform(post, platform);
              if (!caption) return null;
              return (
                <div key={platform} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">{platform} caption</span>
                    <CopyButton text={caption} />
                  </div>
                  <p className="text-sm text-gray-200 leading-relaxed whitespace-pre-wrap bg-gray-900 rounded-lg p-3">{caption}</p>
                </div>
              );
            })}

            {post.scheduled_at && (
              <p className="flex items-center gap-1 text-xs text-gray-500">
                <Clock size={12} /> {new Date(post.scheduled_at).toLocaleString('en-IN')}
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
        );
      })}
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
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.image_url} alt="" className="w-16 h-16 object-cover rounded-lg flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap gap-1 mb-2">{post.platforms.map((p) => <PlatformBadge key={p} platform={p} />)}</div>
            <p className="text-sm text-gray-400 line-clamp-2">
              {primaryCaption(post).slice(0, 100)}{primaryCaption(post).length > 100 ? '…' : ''}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {new Date(post.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
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

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-1">Social Media</h1>
          <p className="text-sm text-gray-500">Generate, schedule, and publish content across all platforms</p>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 bg-gray-900 rounded-xl p-1 mb-6">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Generate' && <GenerateTab />}
        {activeTab === 'Queue' && <QueueTab />}
        {activeTab === 'Manual' && <ManualTab />}
        {activeTab === 'History' && <HistoryTab />}
      </div>
    </div>
  );
}
