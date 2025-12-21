import { Metadata } from "next";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import { blogService, BlogArticle } from "@/services/blogService";
import NewsletterCtaSection from "@/components/blog/NewsletterCtaSection";
import { JsonLd } from "@/components/common/SEO";
import { buildMetadata } from "@/components/common/SEO";

// Generate Blog schema markup
function generateBlogSchema(articles: BlogArticle[]) {
  const baseUrl = "https://www.westsiderealty.in";
  
  const blogPosts = articles.map((article) => {
    // Format date to ISO 8601
    const datePublished = new Date(article.date).toISOString();
    
    // Get full URL for the article
    const articleUrl = `${baseUrl}/blog/${article.slug}`;
    
    // Get image URL (ensure it's absolute)
    let imageUrl = article.image_url || "";
    if (imageUrl && !imageUrl.startsWith("http")) {
      imageUrl = imageUrl.startsWith("/") 
        ? `${baseUrl}${imageUrl}` 
        : `${baseUrl}/${imageUrl}`;
    }
    if (!imageUrl) {
      imageUrl = `${baseUrl}/placeholder.svg`;
    }
    
    return {
      "@type": "BlogPosting",
      headline: article.title,
      description: article.seo_description || article.description || "",
      image: imageUrl,
      datePublished: datePublished,
      url: articleUrl,
      author: {
        "@type": "Organization",
        name: article.author || "RE/MAX Westside Realty",
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
  });

  return {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Real Estate Market Insights & Investment Guide | RE/MAX Westside",
    description: "Expert analysis and insights on real estate markets in Hyderabad, Goa, and Dubai. Stay informed with the latest trends and investment opportunities.",
    url: `${baseUrl}/blog`,
    blogPost: blogPosts,
    publisher: {
      "@type": "Organization",
      name: "RE/MAX Westside Realty",
      logo: {
        "@type": "ImageObject",
        url: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
      },
    },
  };
}

export const metadata: Metadata = buildMetadata({
  title: "Real Estate Market Insights & Investment Guide | RE/MAX Westside",
  description:
    "Expert analysis and insights on real estate markets in Hyderabad, Goa, and Dubai. Stay informed with the latest trends, investment opportunities, and market analysis from RE/MAX Westside Realty.",
  canonicalUrl: "https://www.westsiderealty.in/blog",
  keywords:
    "hyderabad real estate insights, goa property market analysis, dubai investment guide, real estate trends, property market insights, investment opportunities",
});

const BlogListPage = ({
  articles = [],
}: {
  articles: BlogArticle[];
}) => {
  const blogSchema = generateBlogSchema(articles);

  return (
    <>
      <JsonLd jsonLd={blogSchema} />
      <div>
        {/* Hero Section */}
        <section className="py-20 px-4 bg-gradient-to-r from-remax-blue/10 to-remax-red/10">
          <div className="container mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Market Insights
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Expert analysis and insights on real estate markets in Hyderabad, Goa, and Dubai. 
              Stay informed with the latest trends and investment opportunities.
            </p>
          </div>
        </section>

        {/* Articles Grid */}
        <section className="py-16 px-4">
          <div className="container mx-auto">
            {articles.length === 0 ? (
              <div className="text-center py-12">
                <h2 className="text-xl font-semibold text-gray-700 mb-4">
                  Coming Soon
                </h2>
                <p className="text-gray-600">
                  We're working on bringing you the latest market insights and expert analysis.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {articles.map((article) => (
                  <Card key={article.id} className="hover:shadow-lg transition-shadow">
                    <div className="relative">
                      <img 
                        src={article.image_url ?? ""}
                        alt={article.title}
                        className="w-full h-48 object-cover rounded-t-lg"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge variant="secondary" className="bg-white/90">
                          {article.category || "Market Insight"}
                        </Badge>
                      </div>
                    </div>
                    
                    <CardHeader>
                      <div className="flex items-center text-sm text-gray-500 mb-2">
                        <Calendar className="h-4 w-4 mr-2" />
                        {new Date(article.date).toLocaleDateString()}
                      </div>
                      <h2 className="text-lg font-semibold line-clamp-2">
                        {article.title}
                      </h2>
                    </CardHeader>
                    
                    <CardContent>
                      <p className="text-gray-600 mb-4 line-clamp-3">
                        {article.seo_description || article.description}
                      </p>
                      <Link href={`/blog/${article.slug}`}>
                        <Button variant="outline" className="w-full border-remax-red text-remax-red hover:bg-remax-red/10">
                          Read More
                          <ArrowRight className="h-4 w-4 ml-2" />
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </section>

        <NewsletterCtaSection />
      </div>
    </>
  );
};

export default async function BlogPage() {
  let articles: BlogArticle[] = [];
  try {
    articles = await blogService.getPublishedArticles();
  } catch (error) {
    console.error("Error fetching blog articles:", error);
  }

  return <BlogListPage articles={articles} />;
}
