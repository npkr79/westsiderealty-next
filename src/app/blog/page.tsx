"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, ArrowRight, Phone } from "lucide-react";
import Link from "next/link";
import { blogService, BlogArticle } from "@/services/blogService";

// Newsletter Cta
const NewsletterCtaSection = () => {
  const handleWhatsAppContact = () => {
    window.open('https://wa.me/919866085831', '_blank');
  };
  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Get the latest market insights and investment opportunities delivered directly to you.
        </p>
        <Button 
          size="lg" 
          className="bg-remax-red hover:bg-remax-red/90"
          onClick={handleWhatsAppContact}
        >
          <Phone className="h-5 w-5 mr-2" />
          Contact Us for Updates
        </Button>
      </div>
    </section>
  );
};

const BlogListPage = ({
  articles,
  isLoading,
}: {
  articles: BlogArticle[];
  isLoading: boolean;
}) => (
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
        {isLoading ? (
          <div className="text-center py-12">Loading...</div>
        ) : articles.length === 0 ? (
          <div className="text-center py-12">
            <h3 className="text-xl font-semibold text-gray-700 mb-4">
              Coming Soon
            </h3>
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
                  <CardTitle className="text-lg line-clamp-2">
                    {article.title}
                  </CardTitle>
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
);

export default BlogListPage;
