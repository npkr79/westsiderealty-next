import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Insights & Research | Westside Realty",
  description:
    "Market analysis, investment guides, and property intelligence from the Westside Realty team.",
};

export const revalidate = 3600;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function BlogPage() {
  const supabase = await createClient();

  const { data: articles } = await supabase
    .from("blog_articles")
    .select("id, title, description, slug, date, read_time, category, image_url, author")
    .eq("status", "published")
    .order("date", { ascending: false });

  return (
    <main style={{ background: "#080808", minHeight: "100vh" }}>
      <section
        className="pt-20 pb-16 px-4"
        style={{ background: "linear-gradient(to bottom, #0d0d0d, #080808)" }}
      >
        <div className="container mx-auto max-w-6xl">

          {/* Back link */}
          <Link
            href="/insights"
            className="inline-flex items-center gap-1 text-sm mb-8 transition-colors hover:opacity-80"
            style={{ color: "#c8a96e" }}
          >
            ← Back to Insights
          </Link>

          {/* Heading */}
          <p
            className="text-xs font-bold uppercase tracking-[0.2em] mb-3"
            style={{ color: "#c8a96e" }}
          >
            Market Intelligence
          </p>
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            Insights &amp; Research
          </h1>
          <p className="text-slate-400 text-lg mb-12 max-w-xl">
            Market analysis, investment guides, and property intelligence from the Westside Realty team.
          </p>

          {/* Grid */}
          {!articles || articles.length === 0 ? (
            <p className="text-slate-500 text-sm">No articles published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articles.map((article) => (
                <Link
                  key={article.id}
                  href={`/blog/${article.slug}`}
                  className="group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:border-white/20 hover:bg-white/[0.04]"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    borderColor: "rgba(255,255,255,0.08)",
                  }}
                >
                  {/* Image */}
                  <div
                    className="relative w-full flex-shrink-0"
                    style={{ aspectRatio: "16/9", background: "#111" }}
                  >
                    {article.image_url ? (
                      <Image
                        src={article.image_url}
                        alt={article.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      />
                    ) : (
                      <div
                        className="absolute inset-0 flex items-center justify-center"
                        style={{ background: "rgba(200,169,110,0.06)" }}
                      >
                        <span
                          className="text-xs font-bold uppercase tracking-widest"
                          style={{ color: "rgba(200,169,110,0.4)" }}
                        >
                          {article.category || "Insight"}
                        </span>
                      </div>
                    )}

                    {/* Category badge */}
                    {article.category && (
                      <div className="absolute top-3 left-3">
                        <span
                          className="rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                          style={{
                            background: "rgba(200,169,110,0.15)",
                            color: "#c8a96e",
                            borderColor: "rgba(200,169,110,0.3)",
                          }}
                        >
                          {article.category}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    <h2
                      className="text-white font-semibold text-base leading-snug mb-2 group-hover:text-slate-200 transition-colors"
                      style={{
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      } as React.CSSProperties}
                    >
                      {article.title}
                    </h2>

                    {article.description && (
                      <p
                        className="text-slate-500 text-sm leading-relaxed mb-4"
                        style={{
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        } as React.CSSProperties}
                      >
                        {article.description}
                      </p>
                    )}

                    {/* Meta row */}
                    <div className="mt-auto flex flex-wrap items-center gap-2 text-xs text-slate-600">
                      {article.date && <span>{formatDate(article.date)}</span>}
                      {article.read_time && (
                        <>
                          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                          <span>{article.read_time}</span>
                        </>
                      )}
                      {article.author && (
                        <>
                          <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
                          <span>{article.author}</span>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
