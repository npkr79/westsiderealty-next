
import { useState, useEffect } from "react";
import FooterSection from "@/components/home/FooterSection";
import { blogService, BlogArticle } from "@/services/blogService";
import { useParams } from "react-router-dom";
import ArticleDetailPage from "./blog/ArticleDetailPage";
import BlogListPage from "./blog/BlogListPage";
import SEO from "@/components/common/SEO";

const Blog = () => {
  const { id: param } = useParams<{ id?: string }>();
  const [articles, setArticles] = useState<BlogArticle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    (async () => {
      try {
        const blogArticles = await blogService.getPublishedArticles();
        setArticles(blogArticles);
      } catch (error) {
        setArticles([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      <SEO
        title="Market Insights Blog | RE/MAX Westside Realty"
        description="Stay updated with real estate trends and articles from Hyderabad, Goa & Dubai. RE/MAX Westside Realty blog: Read expert property analysis and tips."
        canonicalUrl="https://www.westsiderealty.in/blog"
        imageUrl="https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png"
        type="website"
        siteName="RE/MAX Westside Realty"
        keywords="real estate blog, property news hyderabad, goa market insights, dubai trends, read property articles"
      />
      {param ? (
        <ArticleDetailPage
          articleSlug={param}
          articles={articles}
          setArticles={setArticles}
          setIsLoading={setIsLoading}
        />
      ) : (
        <>
          <BlogListPage
            articles={articles}
            isLoading={isLoading}
          />
          <FooterSection />
        </>
      )}
    </div>
  );
};

export default Blog;
