import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/serviceClient";
import { JsonLd } from "@/components/common/SEO";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { BlogShareButtons } from "./BlogShareButtons";
import { BlogAdvisorCTA } from "./BlogAdvisorCTA";

interface PageProps {
  params: Promise<{ slug: string }>;
}

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

// ─── Metadata ─────────────────────────────────────────────────────────────────

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: article } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) return { title: "Article Not Found" };

  const canonicalUrl = `https://www.westsiderealty.in/blog/${slug}`;
  const rawOgImage = article.image_url
    ? article.image_url.startsWith("http")
      ? article.image_url
      : `https://www.westsiderealty.in${article.image_url}`
    : "https://www.westsiderealty.in/placeholder.svg";

  const optimizedOgImage = optimizeSupabaseImage(rawOgImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  const seoTitle = article.seo_title || article.title || "Real Estate Insights";
  const seoDescription = article.seo_description || article.description || "";

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "article",
      locale: "en_IN",
      images: [{ url: optimizedOgImage, width: 1200, height: 630, alt: article.title }],
      publishedTime: article.date ? new Date(article.date).toISOString() : undefined,
      modifiedTime: article.updated_at ? new Date(article.updated_at).toISOString() : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitle,
      description: seoDescription,
      images: [optimizedOgImage],
    },
  };
}

export async function generateStaticParams() {
  const { createBuildClient } = await import("@/lib/supabase/buildClient");
  const supabase = createBuildClient();
  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug")
    .eq("status", "published");
  return articles?.map((a) => ({ slug: a.slug })) || [];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createServiceClient();

  const { data: article, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) console.error("Error fetching article:", error);
  if (!article) notFound();

  // Related articles
  const { data: relatedArticles } = await supabase
    .from("blog_articles")
    .select("id, slug, title, image_url, category, description, seo_description, created_at, content")
    .eq("status", "published")
    .neq("id", article.id)
    .order("created_at", { ascending: false })
    .limit(3);

  const baseUrl = "https://www.westsiderealty.in";
  const canonicalUrl = `${baseUrl}/blog/${slug}`;
  const ogImage = article.image_url
    ? article.image_url.startsWith("http")
      ? article.image_url
      : `${baseUrl}${article.image_url}`
    : `${baseUrl}/placeholder.svg`;

  const datePublished = article.date
    ? new Date(article.date).toISOString()
    : new Date(article.created_at).toISOString();
  const dateModified = article.updated_at
    ? new Date(article.updated_at).toISOString()
    : datePublished;

  const authorName = article.author || "Westside Realty Research";
  const seoTitle = article.seo_title || article.title || "Real Estate Insights";
  const seoDescription = article.seo_description || article.description || "";

  const optimizedOgImage = optimizeSupabaseImage(ogImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  const primaryEntity: Record<string, unknown> = {
    "@type": "Article",
    headline: article.seo_title || article.title,
    description: (article.seo_description || article.description || "").substring(0, 160),
    image: optimizedOgImage,
    datePublished,
    dateModified,
    author: { "@type": "Person", name: authorName, url: `${baseUrl}/about` },
    publisher: {
      "@type": "Organization",
      name: "RE/MAX Westside Realty",
      logo: {
        "@type": "ImageObject",
        url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
      },
    },
  };

  const unifiedSchema = generateUnifiedSchema({
    pageUrl: canonicalUrl,
    title: seoTitle,
    description: seoDescription,
    heroImageUrl: optimizedOgImage,
    primaryEntityType: "Article",
    primaryEntity,
    breadcrumbs: [
      { name: "Home", item: `${baseUrl}/` },
      { name: "Blog", item: `${baseUrl}/blog` },
      { name: article.title, item: canonicalUrl },
    ],
  });

  const readTime = article.read_time
    ? article.read_time
    : `${calcReadTime(article.content)} min read`;
  const displayDate = formatDate(article.date || article.created_at);
  const excerpt = (article.seo_description || article.description || "").slice(0, 160);
  const category = article.category as string | null;

  return (
    <>
      <JsonLd jsonLd={unifiedSchema} />

      <style>{`
        .article-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 28px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 40px 0 16px;
          line-height: 1.3;
        }
        .article-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 22px;
          font-weight: 600;
          color: #1A1A1F;
          margin: 32px 0 12px;
          line-height: 1.3;
        }
        .article-body p {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          color: #1A1A1F;
          line-height: 1.85;
          margin: 0 0 24px;
        }
        .article-body strong {
          font-weight: 600;
          color: #1A1A1F;
        }
        .article-body blockquote {
          border-left: 3px solid #B08D57;
          padding-left: 24px;
          margin: 32px 0;
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-style: italic;
          color: #7A7A7E;
          line-height: 1.7;
        }
        .article-body ul {
          list-style: none;
          padding: 0;
          margin: 0 0 24px;
        }
        .article-body ul li {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          color: #1A1A1F;
          line-height: 1.8;
          padding-left: 24px;
          position: relative;
          margin-bottom: 8px;
        }
        .article-body ul li::before {
          content: '◆';
          position: absolute;
          left: 0;
          color: #B08D57;
          font-size: 10px;
          top: 6px;
        }
        .article-body ol {
          padding-left: 24px;
          margin: 0 0 24px;
        }
        .article-body ol li {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          color: #1A1A1F;
          line-height: 1.8;
          margin-bottom: 8px;
        }
        .article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 0 0 24px;
        }
        .article-body th {
          background: #F5F3EE;
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: #7A7A7E;
          padding: 12px 16px;
          text-align: left;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .article-body td {
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
          color: #1A1A1F;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.07);
        }
        .article-body a {
          color: #B08D57;
          text-decoration: none;
        }
        .article-body a:hover {
          text-decoration: underline;
        }
        .article-body img {
          width: 100%;
          border-radius: 12px;
          margin: 32px 0;
          display: block;
        }
        .rel-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.10);
        }
      `}</style>

      {/* ── Section 1: Article Header ─────────────────────────────────────── */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Gold radial gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 60% at 60% 40%, rgba(176,141,87,0.10) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            maxWidth: 800,
            margin: "0 auto",
            padding: "100px 24px 64px",
            position: "relative",
          }}
        >
          {/* Back link */}
          <Link
            href="/blog"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.4)",
              textDecoration: "none",
              display: "inline-block",
              marginBottom: 24,
            }}
          >
            ← Back to Blog
          </Link>

          {/* Category tag */}
          {category && (
            <div style={{ marginBottom: 16 }}>
              <span
                style={{
                  border: `1px solid ${C.gold}`,
                  color: C.gold,
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 11,
                  textTransform: "uppercase",
                  letterSpacing: "0.12em",
                  borderRadius: 20,
                  padding: "4px 14px",
                  display: "inline-block",
                }}
              >
                {category}
              </span>
            </div>
          )}

          {/* Title */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(32px,5vw,52px)",
              fontWeight: 600,
              color: "#fff",
              lineHeight: 1.2,
              margin: "0 0 16px",
            }}
          >
            {article.title}
          </h1>

          {/* Excerpt */}
          {excerpt && (
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 18,
                color: "rgba(255,255,255,0.6)",
                lineHeight: 1.6,
                margin: "0 0 24px",
              }}
            >
              {excerpt}
            </p>
          )}

          {/* Meta row */}
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 12,
              color: "rgba(255,255,255,0.4)",
              margin: 0,
            }}
          >
            {authorName}
            {displayDate && ` · ${displayDate}`}
            {` · ${readTime}`}
          </p>
        </div>
      </section>

      {/* ── Section 2: Article Body ───────────────────────────────────────── */}
      <section style={{ background: C.bg, padding: "64px 24px" }}>
        <div style={{ maxWidth: 720, margin: "0 auto" }}>
          {article.content ? (
            <div
              className="article-body"
              dangerouslySetInnerHTML={{ __html: article.content }}
            />
          ) : (
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 17,
                color: C.textMuted,
                lineHeight: 1.85,
              }}
            >
              Content coming soon.
            </p>
          )}
        </div>
      </section>

      {/* ── Section 3: Footer / Related ──────────────────────────────────── */}
      <section style={{ background: C.bgWarm, padding: "64px 24px" }}>
        <div style={{ maxWidth: 800, margin: "0 auto" }}>
          {/* Share row */}
          <BlogShareButtons title={article.title} />

          {/* Divider */}
          <div
            style={{
              borderTop: `1px solid ${C.border}`,
              margin: "40px 0",
            }}
          />

          {/* Related articles */}
          {relatedArticles && relatedArticles.length > 0 && (
            <>
              <h2
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 600,
                  color: C.text,
                  margin: "0 0 28px",
                }}
              >
                More Insights
              </h2>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: 20,
                }}
              >
                {relatedArticles.map((rel) => {
                  const relExcerpt = (rel.seo_description || rel.description || "").slice(0, 100);
                  const relDate = formatDate(rel.created_at);
                  const relReadTime = calcReadTime(rel.content);
                  const initials = (rel.title || "A")[0].toUpperCase();

                  return (
                    <Link
                      key={rel.id}
                      href={`/blog/${rel.slug}`}
                      className="rel-card"
                      style={{
                        background: C.bgCard,
                        border: `1px solid ${C.border}`,
                        borderRadius: 16,
                        overflow: "hidden",
                        textDecoration: "none",
                        display: "block",
                        transition: "transform 0.2s, box-shadow 0.2s",
                      }}
                    >
                      {/* Image */}
                      <div
                        style={{
                          aspectRatio: "3/2",
                          background: rel.image_url
                            ? `url(${rel.image_url}) center/cover`
                            : C.bgWarm,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          overflow: "hidden",
                        }}
                      >
                        {!rel.image_url && (
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
                      <div style={{ padding: 16 }}>
                        {rel.category && (
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
                            {rel.category}
                          </p>
                        )}
                        <h3
                          style={{
                            fontFamily: "'Cormorant Garamond', Georgia, serif",
                            fontSize: 18,
                            fontWeight: 600,
                            color: C.text,
                            lineHeight: 1.3,
                            margin: "0 0 8px",
                          }}
                        >
                          {rel.title}
                        </h3>
                        {relExcerpt && (
                          <p
                            style={{
                              fontFamily: "'Outfit', sans-serif",
                              fontSize: 13,
                              color: C.textMuted,
                              lineHeight: 1.6,
                              margin: "0 0 10px",
                            }}
                          >
                            {relExcerpt}
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
                          {relDate}
                          {` · ${relReadTime} min read`}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {/* Responsive grid for related */}
              <style>{`
                @media (max-width: 768px) {
                  .rel-grid { grid-template-columns: 1fr !important; }
                }
                @media (min-width: 769px) and (max-width: 1023px) {
                  .rel-grid { grid-template-columns: repeat(2, 1fr) !important; }
                }
              `}</style>
            </>
          )}
        </div>
      </section>

      {/* ── Section 4: Advisor CTA ────────────────────────────────────────── */}
      <BlogAdvisorCTA articleTitle={article.title} />
    </>
  );
}

export const revalidate = 86400;
