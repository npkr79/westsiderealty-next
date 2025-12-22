import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { optimizeSupabaseImage } from "@/utils/imageOptimization";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Phone, Printer } from "lucide-react";
import ArticleHero from "@/components/blog/ArticleHero";
import ArticleAuthorCard from "@/components/blog/ArticleAuthorCard";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import PrintButton from "@/components/blog/PrintButton";
import BlogShareSection from "@/components/blog/BlogShareSection";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  
  const { data: article } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (!article) {
    return {
      title: "Article Not Found",
    };
  }

  const canonicalUrl = `https://www.westsiderealty.in/blog/${slug}`;
  const rawOgImage = article.image_url 
    ? (article.image_url.startsWith("http") 
        ? article.image_url 
        : `https://www.westsiderealty.in${article.image_url}`)
    : "https://www.westsiderealty.in/placeholder.svg";
  
  // Optimize OG image
  const optimizedOgImage = optimizeSupabaseImage(rawOgImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  // Standardized title format: "{Article Title} | Real Estate Insights"
  const seoTitle = article.seo_title || article.title || "Real Estate Insights";
  const seoDescription = article.seo_description || article.description || "";

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      url: canonicalUrl,
      siteName: "RE/MAX Westside Realty",
      type: "article",
      locale: "en_IN",
      images: [
        {
          url: optimizedOgImage,
          width: 1200,
          height: 630,
          alt: article.title,
        },
      ],
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
  const supabase = await createClient();
  const { data: articles } = await supabase
    .from("blog_articles")
    .select("slug")
    .eq("status", "published");

  return articles?.map((article) => ({ slug: article.slug })) || [];
}

export default async function BlogArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Fetch the article
  const { data: article, error } = await supabase
    .from("blog_articles")
    .select("*")
    .eq("slug", slug)
    .eq("status", "published")
    .maybeSingle();

  if (error) {
    console.error("Error fetching article:", error);
  }

  if (!article) {
    notFound();
  }

  // Fetch related articles
  const { data: relatedArticles } = await supabase
    .from("blog_articles")
    .select("id, slug, title, image_url, category, seo_description, description")
    .eq("status", "published")
    .eq("category", article.category)
    .neq("id", article.id)
    .limit(2);

  // Fetch all articles for topic cluster links
  const { data: allArticles } = await supabase
    .from("blog_articles")
    .select("id, slug, title, category, topic_cluster, is_pillar_article")
    .eq("status", "published");

  const baseUrl = "https://www.westsiderealty.in";
  const canonicalUrl = `${baseUrl}/blog/${slug}`;
  const ogImage = article.image_url 
    ? (article.image_url.startsWith("http") 
        ? article.image_url 
        : `${baseUrl}${article.image_url}`)
    : `${baseUrl}/placeholder.svg`;

  // Format dates to ISO 8601
  const datePublished = article.date ? new Date(article.date).toISOString() : new Date(article.created_at).toISOString();
  const dateModified = article.updated_at ? new Date(article.updated_at).toISOString() : datePublished;

  // Determine author type for E-E-A-T
  const authorName = article.author || "RE/MAX Westside Realty Team";
  const isTeamAuthor = authorName.toLowerCase().includes("team") || 
                       authorName.toLowerCase().includes("westside realty team") ||
                       authorName === "RE/MAX Westside Realty Team";

  // Derive SEO title/description to mirror generateMetadata
  const seoTitle = article.seo_title || article.title || "Real Estate Insights";
  const seoDescription = article.seo_description || article.description || "";

  // Optimize OG image for schema usage
  const optimizedOgImage = optimizeSupabaseImage(ogImage, {
    width: 1200,
    height: 630,
    quality: 80,
    format: "webp",
  });

  // Build primary entity (Article)
  const primaryEntity: Record<string, any> = {
    "@type": "Article",
    headline: article.seo_title || article.title,
    description: article.seo_description || article.description.substring(0, 160),
    image: optimizedOgImage,
    datePublished: datePublished,
    dateModified: dateModified,
    author: isTeamAuthor
      ? {
          "@type": "Organization",
          name: "RE/MAX Westside Realty",
          url: `${baseUrl}/about`,
        }
      : {
          "@type": "Person",
          name: authorName,
          url: `${baseUrl}/about`,
        },
    publisher: {
      "@type": "Organization",
      name: "RE/MAX Westside Realty",
      logo: {
        "@type": "ImageObject",
        url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
      },
    },
  };

  // Generate unified schema
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

  return (
    <>
      <JsonLd jsonLd={unifiedSchema} />
      <ReadingProgressBar />
      <ArticleHero
        title={article.title}
        image={article.image_url}
        category={article.category || "Market Insight"}
        excerpt={article.seo_description || article.description}
        date={article.date || article.created_at}
      />

      <div className="container mx-auto max-w-3xl px-4" id="article-content-root">
        <ArticleAuthorCard
          author={article.author || "Westside Realty Team"}
          date={article.date || article.created_at}
          readTime={article.read_time || ""}
        />

        {/* Social Share Section */}
        <BlogShareSection
          url={canonicalUrl}
          title={article.title}
          description={article.seo_description || article.description}
          hashtags={["RealEstate", article.category?.replace(/\s/g, "") || "Property"]}
          date={article.date || article.created_at}
        />

        {/* Article Content */}
        <article className="article-content prose prose-lg max-w-none bg-white rounded-xl shadow-md p-6 lg:p-10 mb-12 border border-gray-100">
          <div
            dangerouslySetInnerHTML={{
              __html: article.content,
            }}
          />
        </article>

        {/* Topic Cluster Internal Links */}
        {article.is_pillar_article && article.related_article_ids && article.related_article_ids.length > 0 && (
          <Card className="mb-8 border-remax-red/20">
            <CardHeader>
              <CardTitle className="text-xl">📚 Deep Dive into {article.topic_cluster}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Explore our comprehensive guides on {article.topic_cluster?.toLowerCase()}:
              </p>
              <ul className="space-y-3">
                {allArticles
                  ?.filter((a) => article.related_article_ids?.includes(a.id))
                  .map((relatedArticle) => (
                    <li key={relatedArticle.id}>
                      <Link 
                        href={`/blog/${relatedArticle.slug}`}
                        className="text-remax-red hover:underline font-semibold flex items-center"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {relatedArticle.title}
                      </Link>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Pillar Article Link (for Cluster Articles) */}
        {!article.is_pillar_article && article.topic_cluster && (
          <div className="mb-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              📖 Part of our {article.topic_cluster} series
            </p>
            {allArticles?.find((a) => a.topic_cluster === article.topic_cluster && a.is_pillar_article) && (
              <Link 
                href={`/blog/${allArticles.find((a) => a.topic_cluster === article.topic_cluster && a.is_pillar_article)?.slug}`}
                className="text-remax-red hover:underline font-semibold inline-flex items-center"
              >
                Read the Complete Guide to {article.topic_cluster}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            )}
          </div>
        )}

        {/* Related Articles - Using semantic <aside> tag */}
        {relatedArticles && relatedArticles.length > 0 && (
          <aside className="mb-16">
            <h2 className="font-bold text-xl mb-6 text-gray-800">Related Articles</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {relatedArticles.map((relatedArticle) => (
                <Card key={relatedArticle.id} className="hover:shadow-lg transition-shadow">
                  <div className="relative">
                    {relatedArticle.image_url && (
                      <Image
                        src={relatedArticle.image_url}
                        alt={relatedArticle.title}
                        width={400}
                        height={200}
                        className="w-full h-32 object-cover rounded-t-lg"
                      />
                    )}
                    <div className="absolute top-3 left-3">
                      <Badge variant="secondary" className="bg-white">
                        {relatedArticle.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base line-clamp-2">
                      {relatedArticle.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-2 line-clamp-2">
                      {relatedArticle.seo_description || relatedArticle.description}
                    </p>
                    <Link href={`/blog/${relatedArticle.slug}`}>
                      <Button
                        variant="outline"
                        size="sm"
                        className="border-remax-red text-remax-red hover:bg-remax-red/10"
                      >
                        Read More <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </aside>
        )}

        {/* CTA Section */}
        <section className="bg-remax-red/90 rounded-xl p-8 mb-20 text-white shadow">
          <h3 className="text-2xl font-bold mb-3">Need Expert Advice?</h3>
          <p className="mb-5 text-white/90">
            Get personalized insights and recommendations for your real estate needs in Hyderabad, Goa, or Dubai.
          </p>
          <Button
            className="bg-white text-remax-red font-semibold hover:bg-gray-100"
            asChild
          >
            <Link href="/contact">
              <Phone className="h-4 w-4 mr-2" />
              Talk to Our Experts
            </Link>
          </Button>
        </section>
      </div>
    </>
  );
}
