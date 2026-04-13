import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/serviceClient";

export const revalidate = 60;

const C = {
  bg: "#FAFAF7",
  bgCard: "#FFFFFF",
  bgWarm: "#F5F3EE",
  bgDark: "#1A1A1F",
  gold: "#B08D57",
  goldLight: "#C9A96E",
  text: "#1A1A1F",
  textMuted: "#7A7A7E",
  border: "rgba(0,0,0,0.07)",
} as const;

const CITY_LABELS: Record<string, string> = {
  hyderabad: "Hyderabad",
  goa: "Goa",
  mumbai: "Mumbai",
  delhi_ncr: "Delhi NCR",
  bengaluru: "Bengaluru",
  pune: "Pune",
  chennai: "Chennai",
  kolkata: "Kolkata",
  ahmedabad: "Ahmedabad",
  kochi: "Kochi",
  navi_mumbai_thane: "Navi Mumbai / Thane",
};

interface Article {
  id: string;
  slug: string;
  city: string;
  micro_market: string;
  seo_headline: string;
  meta_description: string;
  body: string;
  target_persona: string;
  drip_placement: string;
  published_at: string;
}

async function getArticle(slug: string): Promise<Article | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("generated_articles")
    .select(
      "id, slug, city, micro_market, seo_headline, meta_description, body, target_persona, drip_placement, published_at"
    )
    .eq("slug", slug)
    .eq("status", "published")
    .single();
  return data as Article | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) return { title: "Article Not Found | Westside Realty" };
  return {
    title: `${article.seo_headline} | Westside Realty`,
    description: article.meta_description,
    alternates: {
      canonical: `https://www.westsiderealty.in/news-articles/${slug}`,
    },
    openGraph: {
      title: article.seo_headline,
      description: article.meta_description,
      type: "article",
      publishedTime: article.published_at,
    },
  };
}

function estimateReadTime(body: string): string {
  const words = body.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} min read`;
}

// Convert markdown to styled HTML
function markdownToHtml(md: string): string {
  let html = md
    // Headers
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold + italic
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Blockquote
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    // Horizontal rule
    .replace(/^---+$/gm, "<hr />")
    // Unordered list items
    .replace(/^[-*] (.+)$/gm, "<li>$1</li>")
    // Ordered list items
    .replace(/^\d+\. (.+)$/gm, "<li class=\"ordered\">$1</li>")
    // Inline code
    .replace(/`([^`]+)`/g, "<code>$1</code>");

  // Wrap consecutive <li> in <ul> or <ol>
  html = html
    .replace(/(<li>[\s\S]+?<\/li>)(\n(?!<li))/g, (match, group) => {
      const items = group.match(/<li>[\s\S]*?<\/li>/g) ?? [];
      return "<ul>" + items.join("") + "</ul>\n";
    })
    .replace(/(<li class="ordered">[\s\S]+?<\/li>)(\n(?!<li))/g, (match, group) => {
      const items = group.match(/<li[^>]*>[\s\S]*?<\/li>/g) ?? [];
      return "<ol>" + items.join("") + "</ol>\n";
    });

  // Paragraphs — wrap lines not already inside block elements
  const lines = html.split("\n");
  const result: string[] = [];
  let inBlock = false;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      inBlock = false;
      continue;
    }
    if (
      trimmed.startsWith("<h") ||
      trimmed.startsWith("<ul") ||
      trimmed.startsWith("<ol") ||
      trimmed.startsWith("<li") ||
      trimmed.startsWith("<blockquote") ||
      trimmed.startsWith("<hr") ||
      trimmed.startsWith("</")
    ) {
      result.push(trimmed);
      inBlock = true;
    } else if (!inBlock) {
      result.push(`<p>${trimmed}</p>`);
    } else {
      result.push(trimmed);
    }
  }

  return result.join("\n");
}

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = await getArticle(slug);
  if (!article) notFound();

  const readTime = estimateReadTime(article.body);
  const cityLabel = CITY_LABELS[article.city] ?? article.city;
  const publishDate = article.published_at
    ? new Date(article.published_at).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "";

  const htmlBody = markdownToHtml(article.body);

  return (
    <>
      <style>{`
        .article-body h1 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 32px;
          font-weight: 600;
          color: ${C.text};
          margin: 40px 0 16px;
          line-height: 1.25;
        }
        .article-body h2 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 26px;
          font-weight: 600;
          color: ${C.text};
          margin: 44px 0 16px;
          line-height: 1.3;
          border-bottom: 1px solid ${C.border};
          padding-bottom: 10px;
        }
        .article-body h3 {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 21px;
          font-weight: 600;
          color: ${C.text};
          margin: 36px 0 12px;
          line-height: 1.3;
        }
        .article-body p {
          font-family: 'Outfit', sans-serif;
          font-size: 17px;
          line-height: 1.85;
          color: ${C.text};
          margin: 0 0 24px;
        }
        .article-body p:first-child {
          font-size: 19px;
          line-height: 1.75;
          color: #2a2a2f;
        }
        .article-body strong {
          font-weight: 700;
          color: ${C.text};
        }
        .article-body em {
          font-style: italic;
          color: ${C.textMuted};
        }
        .article-body ul {
          list-style: none;
          padding: 0 0 0 0;
          margin: 0 0 24px;
        }
        .article-body ul li {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          line-height: 1.7;
          color: ${C.text};
          padding: 6px 0 6px 28px;
          position: relative;
        }
        .article-body ul li::before {
          content: '◆';
          position: absolute;
          left: 0;
          color: ${C.gold};
          font-size: 10px;
          top: 10px;
        }
        .article-body ol {
          padding: 0 0 0 24px;
          margin: 0 0 24px;
        }
        .article-body ol li {
          font-family: 'Outfit', sans-serif;
          font-size: 16px;
          line-height: 1.7;
          color: ${C.text};
          padding: 4px 0;
        }
        .article-body blockquote {
          border-left: 3px solid ${C.gold};
          margin: 32px 0;
          padding: 16px 24px;
          background: ${C.bgWarm};
          border-radius: 0 8px 8px 0;
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 20px;
          font-style: italic;
          color: ${C.text};
          line-height: 1.6;
        }
        .article-body hr {
          border: none;
          border-top: 1px solid ${C.border};
          margin: 40px 0;
        }
        .article-body code {
          font-family: 'Courier New', monospace;
          font-size: 14px;
          background: #F0EEE9;
          padding: 2px 6px;
          border-radius: 4px;
          color: #4A4A4F;
        }
        .article-body table {
          width: 100%;
          border-collapse: collapse;
          margin: 24px 0;
          font-family: 'Outfit', sans-serif;
          font-size: 14px;
        }
        .article-body th {
          text-align: left;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: ${C.textMuted};
          padding: 10px 12px;
          background: ${C.bgWarm};
          border-bottom: 1px solid ${C.border};
        }
        .article-body td {
          padding: 10px 12px;
          border-bottom: 1px solid ${C.border};
          color: ${C.text};
          line-height: 1.5;
        }
        .article-body a {
          color: ${C.gold};
          text-decoration: underline;
          text-decoration-color: rgba(176,141,87,0.4);
        }
        .article-body a:hover {
          text-decoration-color: ${C.gold};
        }
      `}</style>

      {/* Hero header */}
      <section
        style={{
          background: C.bgDark,
          position: "relative",
          overflow: "hidden",
          padding: "80px 24px 56px",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse 70% 80% at 20% 50%, rgba(176,141,87,0.07) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />
        <div style={{ maxWidth: 800, margin: "0 auto", position: "relative" }}>
          {/* Back link */}
          <Link
            href="/news-articles"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "'Outfit', sans-serif",
              fontSize: 13,
              color: "rgba(255,255,255,0.5)",
              textDecoration: "none",
              marginBottom: 28,
              transition: "color 0.15s",
            }}
          >
            ← Back to News &amp; Analysis
          </Link>

          {/* City + micro-market */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 20,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.18em",
                color: C.gold,
                fontWeight: 600,
                border: `1px solid rgba(176,141,87,0.4)`,
                padding: "4px 12px",
                borderRadius: 20,
              }}
            >
              {cityLabel}
            </span>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              {article.micro_market}
            </span>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              · {readTime}
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontFamily: "'Cormorant Garamond', Georgia, serif",
              fontSize: "clamp(28px,4.5vw,48px)",
              fontWeight: 600,
              color: "#FFFFFF",
              lineHeight: 1.2,
              margin: "0 0 20px",
              maxWidth: 720,
            }}
          >
            {article.seo_headline}
          </h1>

          {/* Subtitle / meta description */}
          <p
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontSize: 17,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.65,
              margin: "0 0 28px",
              maxWidth: 640,
            }}
          >
            {article.meta_description}
          </p>

          {/* Author & date */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              borderTop: "1px solid rgba(255,255,255,0.1)",
              paddingTop: 20,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: "50%",
                background: `linear-gradient(135deg, ${C.gold}, ${C.goldLight})`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: "'Cormorant Garamond', Georgia, serif",
                  fontSize: 16,
                  fontWeight: 700,
                  color: "#1A1A1F",
                }}
              >
                W
              </span>
            </div>
            <div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.75)",
                  margin: 0,
                  fontWeight: 500,
                }}
              >
                Westside Realty Intelligence
              </p>
              {publishDate && (
                <p
                  style={{
                    fontFamily: "'Outfit', sans-serif",
                    fontSize: 12,
                    color: "rgba(255,255,255,0.35)",
                    margin: 0,
                  }}
                >
                  {publishDate}
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Article body */}
      <section style={{ background: C.bg, padding: "56px 24px 96px" }}>
        <div style={{ maxWidth: 760, margin: "0 auto" }}>
          {/* Target persona pill */}
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: C.bgWarm,
              border: `1px solid ${C.border}`,
              borderRadius: 100,
              padding: "6px 16px",
              marginBottom: 40,
            }}
          >
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: "0.14em",
                color: C.textMuted,
              }}
            >
              Written for
            </span>
            <span
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 12,
                fontWeight: 600,
                color: C.gold,
              }}
            >
              {article.target_persona}
            </span>
          </div>

          {/* Article content */}
          <article
            className="article-body"
            dangerouslySetInnerHTML={{ __html: htmlBody }}
          />

          {/* Bottom CTA */}
          <div
            style={{
              marginTop: 64,
              padding: 40,
              background: C.bgDark,
              borderRadius: 20,
              textAlign: "center",
            }}
          >
            <p
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 26,
                fontWeight: 600,
                color: "#FFFFFF",
                margin: "0 0 12px",
              }}
            >
              Want personalised advice for this market?
            </p>
            <p
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 15,
                color: "rgba(255,255,255,0.55)",
                margin: "0 0 24px",
              }}
            >
              Talk to our {cityLabel} specialist — no obligation.
            </p>
            <Link
              href="/#advisor"
              style={{
                display: "inline-block",
                background: C.gold,
                color: "#1A1A1F",
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                fontWeight: 600,
                padding: "12px 32px",
                borderRadius: 100,
                textDecoration: "none",
                letterSpacing: "0.04em",
              }}
            >
              Talk to an Advisor →
            </Link>
          </div>

          {/* Back link */}
          <div style={{ textAlign: "center", marginTop: 40 }}>
            <Link
              href="/news-articles"
              style={{
                fontFamily: "'Outfit', sans-serif",
                fontSize: 14,
                color: C.textMuted,
                textDecoration: "none",
              }}
            >
              ← All Articles
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
