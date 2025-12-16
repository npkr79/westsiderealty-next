 "use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Helmet } from "react-helmet";
import { developerService, Developer } from "@/services/developerService";
import { Building2, Award, MapPin, Globe, Calendar, TrendingUp, User, Clock, MessageSquare, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Layout from "@/components/layout/Layout";
import FooterSection from "@/components/home/FooterSection";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import DeveloperProjectCard from "@/components/developer/DeveloperProjectCard";
import DeveloperContactForm from "@/components/developer/DeveloperContactForm";

const stripHtmlTags = (html?: string | null) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const truncateText = (text: string, maxLength = 140) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

const DeveloperPage = () => {
  const { slug, citySlug } = useParams<{ slug: string; citySlug?: string }>();
  const [developer, setDeveloper] = useState<Developer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDeveloper = async () => {
      if (!slug) return;
      
      setLoading(true);
      const data = await developerService.getDeveloperBySlug(slug);
      setDeveloper(data);
      setLoading(false);
    };

    fetchDeveloper();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!developer) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Developer Not Found</h1>
          <Link to="/" className="text-heading-blue hover:underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  const specializationText = stripHtmlTags(developer.specialization);
  const specializationSummary = truncateText(specializationText, 120);

  const historyTimeline = Array.isArray(developer.history_timeline_json)
    ? developer.history_timeline_json
    : [];

  const notableProjects = Array.isArray(developer.notable_projects_json)
    ? developer.notable_projects_json
    : [];

  const keyAwards = Array.isArray(developer.key_awards_json)
    ? developer.key_awards_json
    : [];

  const testimonials = Array.isArray(developer.testimonial_json)
    ? developer.testimonial_json
    : [];

  const faqs = Array.isArray(developer.faqs_json)
    ? developer.faqs_json
    : [];

  // SEO Structured Data - Use custom schema if provided, otherwise generate default
  const organizationSchema = developer.schema_markup_json && Object.keys(developer.schema_markup_json).length > 0
    ? developer.schema_markup_json
    : {
        "@context": "https://schema.org",
        "@type": "RealEstateAgent",
        "name": developer.developer_name,
        "description": developer.long_description_seo,
        "url": developer.website_url || `https://yoursite.com/developers/${developer.url_slug}`,
        "logo": developer.logo_url,
        "foundingDate": developer.years_in_business ? new Date().getFullYear() - developer.years_in_business : undefined,
        "address": {
          "@type": "PostalAddress",
          "addressLocality": developer.primary_city_focus || developer.location_focus?.[0] || "",
          "addressCountry": "IN"
        },
        "aggregateRating": developer.key_awards_json?.length > 0 ? {
          "@type": "AggregateRating",
          "ratingValue": "4.8",
          "reviewCount": developer.testimonial_json?.length || 0,
        } : undefined,
      };

  // FAQ Schema
  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq: any) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  } : null;

  // Generate canonical URL with www version
  const canonicalUrl = citySlug 
    ? `https://www.westsiderealty.in/${citySlug}/developers/${developer.url_slug}`
    : `https://www.westsiderealty.in/developers/${developer.url_slug}`;

  const ogImage = developer.banner_image_url || developer.logo_url || "https://www.westsiderealty.in/placeholder.svg";

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://www.westsiderealty.in" },
      ...(citySlug ? [{ "@type": "ListItem", "position": 2, "name": citySlug.charAt(0).toUpperCase() + citySlug.slice(1), "item": `https://www.westsiderealty.in/${citySlug}` }] : []),
      { "@type": "ListItem", "position": citySlug ? 3 : 2, "name": developer.developer_name, "item": canonicalUrl }
    ]
  };

  return (
    <>
      <Helmet>
        <title>{developer.seo_title}</title>
        <meta name="description" content={developer.meta_description} />
        <link rel="canonical" href={canonicalUrl} />
        
        {/* Open Graph */}
        <meta property="og:title" content={developer.seo_title} />
        <meta property="og:description" content={developer.meta_description} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="RE/MAX Westside Realty" />
        
        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={developer.seo_title} />
        <meta name="twitter:description" content={developer.meta_description} />
        <meta name="twitter:image" content={ogImage} />
        
        {/* JSON-LD Schemas */}
        <script type="application/ld+json">
          {JSON.stringify(organizationSchema)}
        </script>
        <script type="application/ld+json">
          {JSON.stringify(breadcrumbSchema)}
        </script>
        {faqSchema && (
          <script type="application/ld+json">
            {JSON.stringify(faqSchema)}
          </script>
        )}
      </Helmet>

      <Layout>
        <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <div className="relative h-[400px] bg-gradient-to-br from-heading-blue to-heading-blue-dark">
          {developer.banner_image_url && (
            <img
              src={developer.banner_image_url}
              alt={developer.developer_name}
              className="absolute inset-0 w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-4xl">
              {developer.logo_url && (
                <img
                  src={developer.logo_url}
                  alt={`${developer.developer_name} logo`}
                  className="h-20 w-auto mb-6 bg-white p-3 rounded-lg shadow-lg"
                />
              )}
              <h1 className="text-5xl font-bold text-white mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.8), 0 0 20px rgba(0,0,0,0.5)' }}>
                {developer.developer_name}
              </h1>
              {developer.tagline && (
                <p className="text-xl text-white mb-6" style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)' }}>{developer.tagline}</p>
              )}
              {developer.hero_description && (
                <div 
                  className="text-lg text-white max-w-2xl prose prose-invert" 
                  style={{ textShadow: '1px 1px 6px rgba(0,0,0,0.8), 0 0 15px rgba(0,0,0,0.5)' }}
                  dangerouslySetInnerHTML={{ __html: developer.hero_description }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Key Stats */}
        <div className="container mx-auto px-4 -mt-8 md:-mt-10 relative z-10 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {developer.years_in_business && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Calendar className="w-8 h-8 mx-auto mb-3 text-heading-blue" />
                  <div className="text-3xl font-bold text-heading-blue mb-1">
                    {developer.years_in_business}+
                  </div>
                  <div className="text-sm text-muted-foreground">Years in Business</div>
                </CardContent>
              </Card>
            )}
            
            {developer.total_projects && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Building2 className="w-8 h-8 mx-auto mb-3 text-heading-blue" />
                  <div className="text-3xl font-bold text-heading-blue mb-1">
                    {developer.total_projects}+
                  </div>
                  <div className="text-sm text-muted-foreground">Projects Delivered</div>
                </CardContent>
              </Card>
            )}
            
            {developer.total_sft_delivered && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <TrendingUp className="w-8 h-8 mx-auto mb-3 text-heading-blue" />
                  <div className="text-3xl font-bold text-heading-blue mb-1">
                    {developer.total_sft_delivered}
                  </div>
                  <div className="text-sm text-muted-foreground">Sq.Ft Delivered</div>
                </CardContent>
              </Card>
            )}
            
            {specializationSummary && (
              <Card className="bg-white shadow-lg">
                <CardContent className="p-6 text-center">
                  <Award className="w-8 h-8 mx-auto mb-3 text-heading-blue" />
                  <div className="text-lg font-semibold text-heading-blue mb-1">
                    {specializationSummary}
                  </div>
                  <div className="text-sm text-muted-foreground">Specialization</div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About Section */}
              <Card>
                <CardContent className="p-8">
                  <h2 className="text-3xl font-bold text-heading-blue mb-6">
                    About {developer.developer_name}
                  </h2>
                  <div 
                    className="prose prose-lg max-w-none text-foreground"
                    dangerouslySetInnerHTML={{ __html: developer.long_description_seo }}
                  />
                </CardContent>
              </Card>

              {/* Founder & History Section */}
              {(developer.founder_bio_summary || (historyTimeline && historyTimeline.length > 0)) && (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">Our Story & Leadership</h2>
                    
                    {developer.founder_bio_summary && (
                      <div className="mb-8 bg-muted/30 p-6 rounded-lg border-l-4 border-luxury-gold">
                        <div className="flex items-start gap-3 mb-3">
                          <User className="w-6 h-6 text-luxury-gold flex-shrink-0 mt-1" />
                          <h3 className="text-xl font-semibold text-heading-blue">Leadership & Vision</h3>
                        </div>
                        <div
                          className="text-foreground leading-relaxed prose max-w-none"
                          dangerouslySetInnerHTML={{ __html: developer.founder_bio_summary }}
                        />
                      </div>
                    )}

                    {historyTimeline && historyTimeline.length > 0 && (
                      <div>
                        <h3 className="text-xl font-semibold text-heading-blue mb-6 flex items-center gap-2">
                          <Clock className="w-5 h-5 text-luxury-gold" />
                          Company Milestones
                        </h3>
                        <div className="space-y-6 relative before:absolute before:left-[15px] before:top-2 before:bottom-2 before:w-0.5 before:bg-luxury-gold/30">
                          {historyTimeline.map((milestone: any, index: number) => (
                            <div key={index} className="relative pl-12">
                              <div className="absolute left-0 top-1 w-8 h-8 rounded-full bg-luxury-gold flex items-center justify-center text-white font-bold text-sm shadow-lg">
                                {milestone.year?.toString().slice(-2) || index + 1}
                              </div>
                              <div className="bg-background p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
                                <div className="flex items-center gap-3 mb-2">
                                  <span className="text-luxury-gold font-bold text-lg">{milestone.year}</span>
                                  {milestone.title && <h4 className="font-semibold text-heading-blue">{milestone.title}</h4>}
                                </div>
                                {milestone.description && <p className="text-muted-foreground text-sm leading-relaxed">{milestone.description}</p>}
                                {milestone.milestone && <p className="text-foreground leading-relaxed">{milestone.milestone}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Notable Projects */}
              {notableProjects && notableProjects.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Notable Projects
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {notableProjects.map((project: any, index: number) => (
                        <DeveloperProjectCard key={index} project={project} />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Key Awards */}
              {keyAwards && keyAwards.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Awards & Recognition
                      {developer.awards_summary_text && (
                        <span className="block text-base font-normal text-muted-foreground mt-2">
                          {developer.awards_summary_text}
                        </span>
                      )}
                    </h2>
                    <div className="space-y-4">
                      {keyAwards.map((award: any, index: number) => (
                        <div key={index} className="flex items-start gap-4 p-4 bg-muted/50 rounded-lg">
                          <Award className="w-6 h-6 text-luxury-gold mt-1 flex-shrink-0" />
                          <div>
                            <h4 className="font-semibold text-heading-blue mb-1">
                              {award.award_name || award.title || award.name}
                            </h4>
                            {award.year && (
                              <p className="text-sm text-muted-foreground mb-2">{award.year}</p>
                            )}
                            {(award.awarding_body || award.category) && (
                              <p className="text-sm text-foreground">
                                {award.awarding_body || award.category}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* Testimonials */}
              {testimonials && testimonials.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Client Testimonials
                    </h2>
                    <div className="space-y-6">
                      {testimonials.map((testimonial: any, index: number) => {
                        const reviewText = testimonial.feedback || testimonial.review_text || testimonial.text || testimonial.content || "";
                        const customerName = testimonial.name || testimonial.customer_name || testimonial.author || "Anonymous";
                        const projectName = testimonial.project || testimonial.project_name || testimonial.designation || "";
                        const rating = testimonial.rating || 5;
                        
                        return (
                          <div key={index} className="border-l-4 border-luxury-gold pl-6 py-4 bg-muted/30 rounded-r-lg">
                            <div className="flex items-center gap-2 mb-3">
                              <MessageSquare className="w-6 h-6 text-luxury-gold" />
                              <div className="flex">
                                {[...Array(5)].map((_, i) => (
                                  <Star 
                                    key={i} 
                                    className={`w-4 h-4 ${i < rating ? 'fill-luxury-gold text-luxury-gold' : 'text-gray-300'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-foreground italic mb-4 leading-relaxed">"{reviewText}"</p>
                            <div className="text-sm">
                              <span className="font-semibold text-heading-blue">{customerName}</span>
                              {projectName && <span className="text-muted-foreground"> • {projectName}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* FAQ Section */}
              {faqs && faqs.length > 0 ? (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">Frequently Asked Questions</h2>
                    <Accordion type="single" collapsible className="space-y-4">
                      {faqs.map((faq: any, index: number) => (
                        <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg px-4">
                          <AccordionTrigger className="text-left hover:no-underline py-4">
                            <h3 className="font-semibold text-heading-blue pr-4">{faq.question}</h3>
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground pb-4">
                            {faq.answer}
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ) : null}
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-heading-blue mb-4">Quick Info</h3>
                  
                  {developer.primary_city_focus && (
                    <div className="mb-4 pb-4 border-b border-border">
                      <div className="inline-flex items-center gap-2 bg-luxury-gold/10 text-luxury-gold px-3 py-1.5 rounded-full text-sm font-semibold">
                        <MapPin className="w-4 h-4" />
                        Primary Market: {developer.primary_city_focus}
                      </div>
                    </div>
                  )}
                  
                  <div className="space-y-4">
                    {developer.years_in_business && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Years in Business</span>
                        <span className="font-semibold text-heading-blue">{developer.years_in_business}+</span>
                      </div>
                    )}
                    
                    {developer.total_projects && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Projects Delivered</span>
                        <span className="font-semibold text-heading-blue">{developer.total_projects}+</span>
                      </div>
                    )}
                    
                    {specializationSummary && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Specialization</span>
                        <span className="font-semibold text-heading-blue text-right text-sm">
                          {specializationSummary}
                        </span>
                      </div>
                    )}
                    {developer.location_focus && developer.location_focus.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Operating Locations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {developer.location_focus.map((location, index) => (
                            <Badge key={index} variant="secondary">
                              {location}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {developer.website_url && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Website
                        </h4>
                        <a
                          href={developer.website_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center text-heading-blue hover:underline"
                        >
                          <Globe className="w-4 h-4 mr-2" />
                          Visit Website
                        </a>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* USP */}
              {developer.usp && (
                <Card className="bg-gradient-to-br from-heading-blue to-heading-blue-dark text-white">
                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold mb-3">What Sets Us Apart</h3>
                    <div
                      className="text-white/90 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: developer.usp }}
                    />
                  </CardContent>
                </Card>
              )}

              {/* Sticky Contact Form */}
              <DeveloperContactForm 
                developerId={developer.id}
                developerName={developer.developer_name}
                primaryCity={developer.primary_city_focus}
              />

              {/* CTA */}
              <Card className="bg-muted/50">
                <CardContent className="p-6 text-center">
                  <h3 className="text-xl font-bold text-heading-blue mb-3">
                    Interested in Our Projects?
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Explore properties developed by {developer.developer_name}
                  </p>
                  <Button className="w-full bg-heading-blue hover:bg-heading-blue-dark">
                    View All Projects
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        
        {/* Contact Section Above Footer */}
        <div className="bg-gradient-to-br from-heading-blue/5 to-luxury-gold/5 py-16">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-4xl font-bold text-heading-blue mb-4">
                Ready to Invest with {developer.developer_name}?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Get in touch with our expert team to explore exclusive investment opportunities
              </p>
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <MessageSquare className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">WhatsApp</h3>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.open('https://wa.me/919866085831?text=Hi, I\'m interested in ' + developer.developer_name + ' projects', '_blank')}
                    >
                      Chat Now
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Clock className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">Call Us</h3>
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => window.location.href = 'tel:+919866085831'}
                    >
                      +91 98660 85831
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">Visit Office</h3>
                    <Button variant="outline" className="w-full">
                      Get Directions
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <CityHubBacklink />
      <FooterSection />
    </Layout>
    </>
  );
};

export default DeveloperPage;
