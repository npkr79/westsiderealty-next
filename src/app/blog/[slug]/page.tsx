
 "use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Phone, Printer } from "lucide-react";
import { blogService, BlogArticle } from "@/services/blogService";
import ArticleHero from "@/components/blog/ArticleHero";
import ArticleAuthorCard from "@/components/blog/ArticleAuthorCard";
import ReadingProgressBar from "@/components/blog/ReadingProgressBar";
import SocialShareButtons from "@/components/common/SocialShareButtons";
import Link from "next/link";
import Head from "next/head";

// RelatedArticles subcomponent
const RelatedArticles = ({
  articles,
  selectedArticle,
}: {
  articles: BlogArticle[];
  selectedArticle: BlogArticle;
}) => (
  <div className="mb-16">
    <h3 className="font-bold text-xl mb-6 text-gray-800">Related Articles</h3>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      {articles
        .filter(
          (a) => a.id !== selectedArticle.id && a.category === selectedArticle.category
        )
        .slice(0, 2)
        .map((article) => (
          <Card key={article.id} className="hover:shadow-lg transition-shadow">
            <div className="relative">
              <img
                src={article.image_url ?? ""}
                alt={article.title}
                className="w-full h-32 object-cover rounded-t-lg"
              />
              <div className="absolute top-3 left-3">
                <Badge variant="secondary" className="bg-white">
                  {article.category}
                </Badge>
              </div>
            </div>
            <CardHeader>
              <CardTitle className="text-base line-clamp-2">
                {article.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 mb-2 line-clamp-2">
                {article.seo_description || article.description}
              </p>
              <Link to={`/blog/${article.slug}`}>
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
  </div>
);

// CtaSection subcomponent
const CtaSection = () => {
  const router = useRouter();
  const handleContactClick = () => {
    router.push("/contact");
  };
  return (
    <section className="bg-remax-red/90 rounded-xl p-8 mb-20 text-white shadow">
      <h3 className="text-2xl font-bold mb-3">Need Expert Advice?</h3>
      <p className="mb-5 text-white/90">
        Get personalized insights and recommendations for your real estate needs in Hyderabad, Goa, or Dubai.
      </p>
      <Button
        className="bg-white text-remax-red font-semibold hover:bg-gray-100"
        onClick={handleContactClick}
      >
        <Phone className="h-4 w-4 mr-2" />
        Talk to Our Experts
      </Button>
    </section>
  );
};

export interface ArticleDetailPageProps {
  articleSlug: string;
  articles: BlogArticle[];
  setArticles: React.Dispatch<React.SetStateAction<BlogArticle[]>>;
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>;
}

const ArticleDetailPage = ({
  articleSlug: param,
  articles,
  setArticles,
  setIsLoading,
}: ArticleDetailPageProps) => {
  const router = useRouter();
  const [selectedArticle, setSelectedArticle] = useState<BlogArticle | null>(null);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        // param is slug or id
        // Try by slug
        let article = await blogService.getArticleBySlug(param);
        if (article) {
          setSelectedArticle(article);
        } else {
          // Fallback: try by ID in articles
          article = articles.find((a) => String(a.id) === String(param));
          if (article) {
            router.replace(`/blog/${article.slug}`);
          } else {
            setSelectedArticle(null);
          }
        }
      } catch (error) {
        setSelectedArticle(null);
      } finally {
        setIsLoading(false);
      }
    })();
    // eslint-disable-next-line
  }, [param, articles, navigate]);

  // Helper to ensure absolute image URLs for OG tags
  const getAbsoluteImageUrl = (imageUrl: string | null | undefined): string => {
    if (!imageUrl) return 'https://www.westsiderealty.in/placeholder.svg';
    if (imageUrl.startsWith('http')) return imageUrl;
    if (imageUrl.startsWith('/')) return `https://www.westsiderealty.in${imageUrl}`;
    return `https://www.westsiderealty.in/${imageUrl}`;
  };

  if (!selectedArticle) return null;
  
  const canonicalUrl = `https://www.westsiderealty.in/blog/${selectedArticle.slug}`;
  const ogImage = getAbsoluteImageUrl(selectedArticle.image_url);
  
  // Article structured data
  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": selectedArticle.seo_title || selectedArticle.title,
    "description": selectedArticle.seo_description || selectedArticle.description.substring(0, 160),
    "image": ogImage,
    "datePublished": selectedArticle.date,
    "dateModified": selectedArticle.updated_at || selectedArticle.date,
    "author": {
      "@type": "Person",
      "name": selectedArticle.author || "RE/MAX Westside Realty Team"
    },
    "publisher": {
      "@type": "Organization",
      "name": "RE/MAX Westside Realty",
      "logo": {
        "@type": "ImageObject",
        "url": "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": canonicalUrl
    }
  };
  
  return (
    <>
      <Helmet>
        <title>{selectedArticle.seo_title || selectedArticle.title} | RE/MAX Westside Realty Blog</title>
        <meta name="description" content={selectedArticle.seo_description || selectedArticle.description.substring(0, 160)} />
        <meta name="keywords" content={`real estate blog, ${selectedArticle.category}, property insights`} />
        
        {/* Open Graph */}
        <meta property="og:title" content={selectedArticle.title} />
        <meta property="og:description" content={selectedArticle.seo_description || selectedArticle.description.substring(0, 160)} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="article" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        <meta property="article:published_time" content={selectedArticle.date} />
        <meta property="article:author" content={selectedArticle.author || "RE/MAX Westside Realty Team"} />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={selectedArticle.title} />
        <meta name="twitter:description" content={selectedArticle.seo_description || selectedArticle.description.substring(0, 160)} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* Canonical */}
        <link rel="canonical" href={canonicalUrl} />
        
        {/* JSON-LD Structured Data */}
        <script type="application/ld+json">
          {JSON.stringify(articleSchema)}
        </script>
      </Helmet>
      
      <ReadingProgressBar />
      <ArticleHero
        title={selectedArticle.title}
        image={selectedArticle.image_url}
        category={selectedArticle.category || "Market Insight"}
        excerpt={selectedArticle.seo_description || selectedArticle.description}
        date={selectedArticle.date}
      />

      <div className="container mx-auto max-w-3xl px-4" id="article-content-root">
        <ArticleAuthorCard
          author={selectedArticle.author || "Westside Realty Team"}
          date={selectedArticle.date}
          readTime={selectedArticle.read_time ?? ""}
        />

        {/* Social Share Section */}
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-foreground">Share this article</h4>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <SocialShareButtons
              url={canonicalUrl}
              title={selectedArticle.title}
              description={selectedArticle.seo_description || selectedArticle.description}
              hashtags={['RealEstate', selectedArticle.category?.replace(/\s/g, '') || 'Property']}
            />
            
            <div className="flex gap-3 items-center">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => window.print()}
                className="border-muted text-muted-foreground hover:bg-muted"
              >
                <Printer className="h-4 w-4 mr-2" />
                Print
              </Button>
              <span className="text-xs text-muted-foreground hidden md:inline">
                {new Date(selectedArticle.date).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Article Content */}
        <article className="article-content prose prose-lg max-w-none bg-white rounded-xl shadow-md p-6 lg:p-10 mb-12 border border-gray-100">
          <div
            dangerouslySetInnerHTML={{
              __html: selectedArticle.content,
            }}
          />
        </article>

        {/* Topic Cluster Internal Links */}
        {selectedArticle.is_pillar_article && selectedArticle.related_article_ids && selectedArticle.related_article_ids.length > 0 && (
          <Card className="mb-8 border-remax-red/20">
            <CardHeader>
              <CardTitle className="text-xl">📚 Deep Dive into {selectedArticle.topic_cluster}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Explore our comprehensive guides on {selectedArticle.topic_cluster?.toLowerCase()}:
              </p>
              <ul className="space-y-3">
                {articles
                  .filter(a => selectedArticle.related_article_ids?.includes(a.id))
                  .map(relatedArticle => (
                    <li key={relatedArticle.id}>
                      <Link 
                        to={`/blog/${relatedArticle.slug}`}
                        className="text-remax-red hover:underline font-semibold flex items-center"
                      >
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {relatedArticle.title}
                      </Link>
                    </li>
                  ))
                }
              </ul>
            </CardContent>
          </Card>
        )}

        {/* Pillar Article Link (for Cluster Articles) */}
        {!selectedArticle.is_pillar_article && selectedArticle.topic_cluster && (
          <div className="mb-8 p-6 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">
              📖 Part of our {selectedArticle.topic_cluster} series
            </p>
            {articles.find(a => a.topic_cluster === selectedArticle.topic_cluster && a.is_pillar_article) && (
              <Link 
                to={`/blog/${articles.find(a => a.topic_cluster === selectedArticle.topic_cluster && a.is_pillar_article)?.slug}`}
                className="text-remax-red hover:underline font-semibold inline-flex items-center"
              >
                Read the Complete Guide to {selectedArticle.topic_cluster}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Link>
            )}
          </div>
        )}

        <RelatedArticles articles={articles} selectedArticle={selectedArticle} />
        <CtaSection />
      </div>
    </>
  );
};

export default ArticleDetailPage;
