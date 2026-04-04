import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const metadata: Metadata = {
  title: "Insights & Research | Westside Realty",
  description:
    "Market analysis, investment guides, and property intelligence from the Westside Realty team.",
};

export const revalidate = 0;

// ─── Design constants ─────────────────────────────────────────────────────────

const C = {
  bg: "#FAFAF7",
  bgWarm: "#F5F3EE",
  bgCard: "#FFFFFF",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });
}

function calcReadTime(content: string | null | undefined): number {
  if (!content) return 5;
  return Math.ceil(content.split(/\s+/).length / 200);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogPage() {
  const supabase = createServiceClient();

  const { data: articles } = await supabase
    .from("blog_articles")
    .select("id, title, description, slug, date, read_time, category, image_url, author, content, created_at")
    .eq("status", "published")
    .order("date", { ascending: false });

  const featured = articles?.[0] ?? null;
  const rest = articles?.slice(1) ?? [];

  return (
    <>
      <style>{`
        .blog-feat-card:hover {
          box-shadow: 0 16px 48px rgba(0,0,0,0.10);
        }
        .blog-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
        }
        @media (max-width: 768px) {
          .blog-feat-inner { flex-direction: column !important; }
          .blog-feat-img { width: 100% !important; }
          .blog-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) and (max-width: 1023px) {
          .blog-grid { grid-template-columns: repeat(2, 1fr) !important; }
        }
      `}</style>

      {/* ── Section 1: Hero ───────────────────────────────────────────────── */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 60% 70% at 30% 50%, rgba(176,141,87,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 900,
            margin: "0 auto",
            padding: "100px 24px 72px",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(40px,6vw,72px)",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.1,
              margin: "0 0 20px",
            }}
          >
            Insights &amp; Research
          </h1>
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 18,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.6,
              maxWidth: 580,
              margin: 0,
            }}
          >
            Market intelligence, investment analysis, and real estate research
            for the discerning buyer.
          </p>
        </div>
      </section>

      {/* ── Section 2: Featured Article ───────────────────────────────────── */}
      {featured && (
        <section style={{ background: C.bg, padding: "64px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <Link
              href={`/blog/${featured.slug}`}
              className="blog-feat-card"
              style={{
                display: "block",
                borderRadius: 16,
                overflow: "hidden",
                background: C.bgCard,
                border: `1px solid ${C.border}`,
                textDecoration: "none",
                transition: "box-shadow 0.25s",
              }}
            >
              <div
                className="blog-feat-inner"
                style={{ display: "flex", alignItems: "stretch" }}
              >
                {/* Image / placeholder */}
                <div
                  className="blog-feat-img"
                  style={{
                    width: "55%",
                    flexShrink: 0,
                    aspectRatio: "16/9",
                    background: featured.image_url
                      ? `url(${featured.image_url}) center/cover`
                      : C.bgWarm,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                  }}
                >
                  {!featured.image_url && (
                    <span
                      style={{
                        fontFamily: "'Cormorant Garamond', Georgia, serif",
                        fontSize: 72,
                        color: "rgba(122,122,126,0.2)",
                      }}
                    >
                      {(featured.title || "A")[0].toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div
                  style={{
                    padding: "36px 40px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    flex: 1,
                  }}
                >
                  {featured.category && (
                    <span
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: "0.12em",
                        color: C.gold,
                        display: "block",
                        marginBottom: 12,
                      }}
                    >
                      {featured.category}
                    </span>
                  )}
                  <h2
                    style={{
                      fontFamily: "'Cormorant Garamond', Georgia, serif",
                      fontSize: 28,
                      fontWeight: 600,
                      color: C.text,
                      lineHeight: 1.25,
                      margin: "0 0 14px",
                    }}
                  >
                    {featured.title}
                  </h2>
                  {featured.description && (
                    <p
                      style={{
                        fontFamily: "'Outfit', sans-serif",
                        fontSize: 15,
                        color: C.textMuted,
                        lineHeight: 1.65,
                        margin: "0 0 20px",
                      }}
                    >
                      {featured.description.slice(0, 160)}
                    </p>
                  )}
                  <p
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 12,
                      color: C.textMuted,
                      margin: "0 0 20px",
                    }}
                  >
                    {formatDate(featured.date || featured.created_at)}
                    {` · ${featured.read_time || `${calcReadTime(featured.content)} min read`}`}
                  </p>
                  <span
                    style={{
                      fontFamily: "'Outfit', sans-serif",
                      fontSize: 13,
                      fontWeight: 500,
                      color: C.gold,
                    }}
                  >
                    Read article →
                  </span>
                </div>
              </div>
            </Link>
          </div>
        </section>
      )}

      {/* ── Section 3: All Articles Grid ─────────────────────────────────── */}
      {rest.length > 0 && (
        <section style={{ background: C.bgWarm, padding: "64px 24px" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Section heading */}
            <div style={{ marginBottom: 40 }}>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.16em",
                  color: C.gold,
                  margin: "0 0 8px",
                }}
              >
                All Articles
              </p>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 32,
                  fontWeight: 600,
                  color: C.text,
                  margin: 0,
                }}
              >
                Research &amp; Market Intelligence
              </h2>
            </div>

            <div
              className="blog-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 24,
              }}
            >
              {rest.map((article) => {
                const excerpt = (article.description || "").slice(0, 100);
                const dateStr = formatDate(article.date || article.created_at);
                const readTime =
                  article.read_time ||
                  `${calcReadTime(article.content)} min read`;
                const initials = (article.title || "A")[0].toUpperCase();

                return (
                  <Link
                    key={article.id}
                    href={`/blog/${article.slug}`}
                    className="blog-card"
                    style={{
                      display: "block",
                      background: C.bgCard,
                      border: `1px solid ${C.border}`,
                      borderRadius: 16,
                      overflow: "hidden",
                      textDecoration: "none",
                      transition: "transform 0.2s, box-shadow 0.2s",
                    }}
                  >
                    {/* Image */}
                    <div
                      style={{
                        aspectRatio: "3/2",
                        background: article.image_url
                          ? `url(${article.image_url}) center/cover`
                          : C.bgWarm,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        overflow: "hidden",
                      }}
                    >
                      {!article.image_url && (
                        <span
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 48,
                            color: "rgba(122,122,126,0.3)",
                          }}
                        >
                          {initials}
                        </span>
                      )}
                    </div>

                    {/* Body */}
                    <div style={{ padding: 20 }}>
                      {article.category && (
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 11,
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                            color: C.gold,
                            margin: "0 0 6px",
                          }}
                        >
                          {article.category}
                        </p>
                      )}
                      <h3
                        style={{
                          fontFamily: "'Cormorant Garamond', Georgia, serif",
                          fontSize: 20,
                          fontWeight: 600,
                          color: C.text,
                          lineHeight: 1.3,
                          margin: "0 0 8px",
                        }}
                      >
                        {article.title}
                      </h3>
                      {excerpt && (
                        <p
                          style={{
                            fontFamily: "'Outfit', sans-serif",
                            fontSize: 13,
                            color: C.textMuted,
                            lineHeight: 1.6,
                            margin: "0 0 10px",
                          }}
                        >
                          {excerpt}
                        </p>
                      )}
                      <p
                        style={{
                          fontFamily: "'Outfit', sans-serif",
                          fontSize: 11,
                          color: C.textMuted,
                          margin: 0,
                        }}
                      >
                        {dateStr}
                        {dateStr && ` · `}
                        {readTime}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {(!articles || articles.length === 0) && (
        <section style={{ background: C.bg, padding: "80px 24px", textAlign: "center" }}>
          <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: 15, color: C.textMuted }}>
            No articles published yet.
          </p>
        </section>
      )}
    </>
  );
}
