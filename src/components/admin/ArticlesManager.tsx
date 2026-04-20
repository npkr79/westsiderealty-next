"use client";
import { useState, useEffect, useCallback } from "react";
import { PlusCircle, Trash2, CheckCircle, X, ChevronDown, ChevronUp, Eye } from "lucide-react";

const CITIES = [
  "hyderabad", "bengaluru", "chennai", "goa", "mumbai",
  "pune", "ahmedabad", "delhi_ncr", "gurugram", "noida",
  "jaipur", "kolkata", "kochi",
];

const DRIP_OPTIONS = ["Day-7", "Day-14", "Day-30", "Day-45"];

interface Article {
  id: string;
  slug: string;
  city: string;
  micro_market: string | null;
  seo_headline: string;
  meta_description: string | null;
  body: string;
  target_persona: string | null;
  drip_placement: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  image_url: string | null;
}

const emptyForm = {
  city: "hyderabad",
  micro_market: "",
  seo_headline: "",
  meta_description: "",
  article_body: "",
  whatsapp_summary: "",
  target_persona: "",
  drip_placement: "Day-7",
};

export default function ArticlesManager() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [statusFilter, setStatusFilter] = useState<"draft" | "published">("draft");
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadArticles = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/admin/articles?status=${statusFilter}`);
    const data = await res.json();
    setArticles(data.articles ?? []);
    setLoading(false);
  }, [statusFilter]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    const res = await fetch("/api/admin/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setSubmitting(false);
    if (!res.ok) { setError(data.error ?? "Failed to save"); return; }
    setForm(emptyForm);
    setShowForm(false);
    loadArticles();
  }

  async function handlePublish(id: string) {
    await fetch(`/api/admin/articles/${id}/publish`, { method: "POST" });
    loadArticles();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this article?")) return;
    await fetch(`/api/admin/articles/${id}/publish`, { method: "DELETE" });
    loadArticles();
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex gap-1 bg-slate-100 p-1 rounded-lg">
          {(["draft", "published"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md capitalize transition-colors ${
                statusFilter === s ? "bg-white shadow text-slate-900" : "text-slate-500 hover:text-slate-700"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 transition-colors"
        >
          <PlusCircle size={15} />
          Add Article
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-900">New Article</h2>
            <button type="button" onClick={() => setShowForm(false)}>
              <X size={16} className="text-slate-400 hover:text-slate-700" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">City *</label>
              <select
                value={form.city}
                onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                required
              >
                {CITIES.map((c) => (
                  <option key={c} value={c}>{c.replace(/_/g, " ")}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Micro Market</label>
              <input
                value={form.micro_market}
                onChange={(e) => setForm({ ...form, micro_market: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. Kokapet"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              SEO Headline * <span className="text-slate-400">({form.seo_headline.length}/60)</span>
            </label>
            <input
              value={form.seo_headline}
              onChange={(e) => setForm({ ...form, seo_headline: e.target.value.slice(0, 60) })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Max 60 chars"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Meta Description <span className="text-slate-400">({form.meta_description.length}/155)</span>
            </label>
            <input
              value={form.meta_description}
              onChange={(e) => setForm({ ...form, meta_description: e.target.value.slice(0, 155) })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Max 155 chars"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Article Body (Markdown) *</label>
            <textarea
              value={form.article_body}
              onChange={(e) => setForm({ ...form, article_body: e.target.value })}
              rows={12}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-400 resize-y"
              placeholder="Write your article in Markdown..."
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              WhatsApp Summary <span className="text-slate-400">({form.whatsapp_summary.length}/160)</span>
            </label>
            <input
              value={form.whatsapp_summary}
              onChange={(e) => setForm({ ...form, whatsapp_summary: e.target.value.slice(0, 160) })}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              placeholder="Short summary for WhatsApp drip"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Target Persona</label>
              <input
                value={form.target_persona}
                onChange={(e) => setForm({ ...form, target_persona: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                placeholder="e.g. IT professional 28–38"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Drip Placement</label>
              <select
                value={form.drip_placement}
                onChange={(e) => setForm({ ...form, drip_placement: e.target.value })}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
              >
                {DRIP_OPTIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors"
            >
              {submitting ? "Saving…" : "Save as Draft"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-5 py-2 border border-slate-200 text-slate-600 text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Articles list */}
      {loading ? (
        <div className="py-12 text-center text-sm text-slate-400">Loading…</div>
      ) : articles.length === 0 ? (
        <div className="py-12 text-center text-sm text-slate-400">No {statusFilter} articles.</div>
      ) : (
        <div className="space-y-2">
          {articles.map((a) => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden">
              <div className="flex items-start gap-3 p-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-medium text-slate-400 uppercase">{a.city.replace(/_/g, " ")}</span>
                    {a.micro_market && <span className="text-xs text-slate-400">· {a.micro_market}</span>}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      a.status === "published" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>{a.status}</span>
                  </div>
                  <p className="mt-1 text-sm font-semibold text-slate-900 leading-snug">{a.seo_headline}</p>
                  <p className="mt-0.5 text-xs text-slate-500">
                    {new Date(a.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    {a.drip_placement && <> · {a.drip_placement}</>}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => setExpandedId(expandedId === a.id ? null : a.id)}
                    title="Preview"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                  >
                    {expandedId === a.id ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                  {a.slug && (
                    <a
                      href={`/insights/articles/${a.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="View live"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <Eye size={15} />
                    </a>
                  )}
                  {a.status === "draft" && (
                    <button
                      onClick={() => handlePublish(a.id)}
                      title="Publish"
                      className="p-1.5 rounded-lg text-slate-400 hover:bg-green-50 hover:text-green-700 transition-colors"
                    >
                      <CheckCircle size={15} />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(a.id)}
                    title="Delete"
                    className="p-1.5 rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
              {expandedId === a.id && (
                <div className="border-t border-slate-100 px-4 py-3 bg-slate-50">
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                    {a.body}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
