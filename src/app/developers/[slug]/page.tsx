import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Building2, Award, MapPin, Globe, Calendar, TrendingUp, User, Clock, MessageSquare, Star } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import CityHubBacklink from "@/components/seo/CityHubBacklink";
import DeveloperProjectCard from "@/components/developer/DeveloperProjectCard";
import DeveloperContactForm from "@/components/developer/DeveloperContactForm";
import { parseJsonb, asArray } from "@/lib/parse-jsonb";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Helper functions
const stripHtmlTags = (html?: string | null) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
};

const truncateText = (text: string, maxLength = 140) => {
  if (!text) return "";
  return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
};

// Fetch developer data server-side
async function getDeveloper(slug: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('developers')
    .select('*')
    .eq('url_slug', slug)
    .eq('is_published', true)
    .limit(1)
    .maybeSingle();

  // Handle PGRST116 error (no rows or multiple rows) gracefully
  if (error) {
    if (error.code === 'PGRST116') {
      console.warn(`[getDeveloper] No developer found with url_slug: "${slug}"`);
      return null;
    }
    console.error(`[getDeveloper] Error fetching developer with slug "${slug}":`, error);
    return null;
  }

  if (!data) {
    console.warn(`[getDeveloper] No developer data returned for slug: "${slug}"`);
    return null;
  }

  return data;
}

// Fetch projects by developer server-side
async function getDeveloperProjects(developerId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('projects')
    .select(`
      id,
      project_name,
      url_slug,
      hero_image_url,
      meta_description,
      price_range_text,
      city:cities!inner(url_slug, city_name),
      micro_market:micro_markets!projects_micromarket_id_fkey(url_slug, micro_market_name)
    `)
    .eq('developer_id', developerId)
    .or('status.ilike.published,status.ilike.%under construction%')
    .order('display_order', { ascending: true })
    .order('project_name', { ascending: true })
    .limit(20);

  if (error) {
    console.error('[getDeveloperProjects] Error fetching developer projects:', error);
    return [];
  }

  // Normalize project data - handle cases where relations might be arrays or objects
  const normalizedProjects = (data || []).map((project: any) => {
    // Normalize city relation (could be object, array, or null)
    if (project.city) {
      project.city = Array.isArray(project.city) 
        ? project.city[0] 
        : project.city;
    }
    // Normalize micro_market relation (could be object, array, or null)
    if (project.micro_market) {
      project.micro_market = Array.isArray(project.micro_market) 
        ? project.micro_market[0] 
        : project.micro_market;
    }
    return project;
  });

  return normalizedProjects;
}

// Generate dynamic metadata
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const developer = await getDeveloper(slug);

  if (!developer) {
    return {
      title: "Developer Not Found",
    };
  }

  // Fetch top projects for description
  const projects = await getDeveloperProjects(developer.id);
  const projectNames = Array.isArray(projects) && projects.length > 0
    ? projects.slice(0, 3).filter((p: any) => p && p.project_name).map((p: any) => p.project_name).join(', ')
    : '';

  const title = `${developer.developer_name} Hyderabad Projects | Reviews, Price & New Launches`;
  const description = projectNames
    ? `Explore top projects by ${developer.developer_name} in Hyderabad. View floor plans, pricing, and ready-to-move inventory for projects like ${projectNames}.`
    : `Explore top projects by ${developer.developer_name} in Hyderabad. View floor plans, pricing, and ready-to-move inventory.`;

  // OG Image: Use developer logo or top project hero image
  const ogImage = developer.logo_url || 
    (Array.isArray(projects) && projects.length > 0 && projects[0]?.hero_image_url) || 
    undefined;

  const canonicalUrl = `https://www.westsiderealty.in/developers/${developer.url_slug}`;

  return buildMetadata({
    title,
    description,
    canonicalUrl,
    imageUrl: ogImage,
    type: "website",
  });
}

export default async function DeveloperPage({ params }: PageProps) {
  const { slug } = await params;
  const developer = await getDeveloper(slug);

  if (!developer) {
    notFound();
  }

  // Fetch developer projects
  const projects = await getDeveloperProjects(developer.id);

  const specializationText = stripHtmlTags(developer.specialization);
  const specializationSummary = truncateText(specializationText, 120);

  // Normalize location_focus array to prevent crashes
  const operatingLocations = Array.isArray(developer.location_focus) ? developer.location_focus : [];

  // Normalize JSONB fields to handle both proper JSONB and stringified JSON formats
  const historyTimeline = asArray(parseJsonb(developer.history_timeline_json, []));
  const notableProjects = asArray(parseJsonb(developer.notable_projects_json, []));
  const keyAwards = asArray(parseJsonb(developer.key_awards_json, []));
  const testimonials = asArray(parseJsonb(developer.testimonial_json, []));
  const faqs = asArray(parseJsonb(developer.faqs_json, []));

  const canonicalUrl = `https://www.westsiderealty.in/developers/${developer.url_slug}`;

  // RealEstateAgent Schema with makesOffer
  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "RealEstateAgent",
    name: developer.developer_name,
    url: canonicalUrl,
    logo: developer.logo_url || undefined,
    description: developer.long_description_seo || developer.meta_description || developer.tagline || undefined,
    ...(developer.years_in_business && {
      foundingDate: new Date().getFullYear() - developer.years_in_business,
    }),
    address: {
      "@type": "PostalAddress",
      addressLocality: developer.primary_city_focus || "Hyderabad",
      addressCountry: "IN",
    },
    ...(Array.isArray(projects) && projects.length > 0 && {
      makesOffer: projects.slice(0, 10)
        .filter((project: any) => project && project.project_name && project.url_slug)
        .map((project: any) => ({
          "@type": "Offer",
          itemOffered: {
            "@type": "Product",
            name: project.project_name || "",
            description: project.meta_description || `Premium residential project by ${developer.developer_name}`,
            ...(project.hero_image_url && { image: project.hero_image_url }),
            ...(project.city && project.city.city_name && {
              category: project.city.city_name,
            }),
          },
          url: `https://www.westsiderealty.in/${project.city?.url_slug || 'hyderabad'}/projects/${project.url_slug || ''}`,
          ...(project.price_range_text && {
            priceSpecification: {
              "@type": "UnitPriceSpecification",
              price: project.price_range_text,
              priceCurrency: "INR",
            },
          }),
        })),
    }),
  };

  // FAQ Schema
  const faqSchema = faqs && faqs.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs
      .map((faq: any) => {
        const question = faq.question || faq.q || '';
        const answer = faq.answer || faq.a || '';
        if (!question || !answer) return null;
        return {
          "@type": "Question",
          name: question,
          acceptedAnswer: {
            "@type": "Answer",
            text: typeof answer === 'string' ? answer.replace(/<[^>]*>/g, '') : String(answer),
          },
        };
      })
      .filter(Boolean),
  } : null;

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      { "@type": "ListItem", position: 2, name: "Developers", item: "https://www.westsiderealty.in/developers" },
      { "@type": "ListItem", position: 3, name: developer.developer_name, item: canonicalUrl },
    ],
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Developers", href: "/developers" },
    { name: developer.developer_name, href: `/developers/${developer.url_slug}` },
  ];

  const ogImage = developer.banner_image_url || developer.logo_url || undefined;

  return (
    <>
      {/* JSON-LD Structured Data */}
      <JsonLd jsonLd={organizationSchema} />
      {faqSchema && <JsonLd jsonLd={faqSchema} />}
      <JsonLd jsonLd={breadcrumbSchema} />

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <div className="relative h-[400px] bg-gradient-to-br from-heading-blue to-heading-blue-dark">
          {developer.banner_image_url && (
            <Image
              src={developer.banner_image_url}
              alt={developer.developer_name}
              fill
              className="object-cover"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          
          <div className="relative container mx-auto px-4 h-full flex items-center">
            <div className="max-w-4xl">
              {developer.logo_url && (
                <Image
                  src={developer.logo_url}
                  alt={`${developer.developer_name} logo`}
                  width={80}
                  height={80}
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

              {/* Projects Section */}
              {Array.isArray(projects) && projects.length > 0 && (
                <Card>
                  <CardContent className="p-8">
                    <h2 className="text-3xl font-bold text-heading-blue mb-6">
                      Projects by {developer.developer_name}
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {projects.filter((p: any) => p && p.id && p.project_name).map((project: any) => (
                        <div key={project.id} className="border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <h3 className="text-xl font-semibold text-heading-blue mb-2">
                            <Link 
                              href={`/${project.city?.url_slug || 'hyderabad'}/projects/${project.url_slug || ''}`}
                              className="hover:underline"
                            >
                              {project.project_name || 'Project'}
                            </Link>
                          </h3>
                          {project.micro_market?.micro_market_name && (
                            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-1">
                              <MapPin className="w-4 h-4" />
                              {project.micro_market.micro_market_name}
                            </p>
                          )}
                          {project.price_range_text && (
                            <p className="text-base font-semibold text-heading-blue">
                              {project.price_range_text}
                            </p>
                          )}
                          {project.meta_description && (
                            <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                              {project.meta_description}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

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
                            <h3 className="font-semibold text-heading-blue pr-4">{faq.question || faq.q}</h3>
                          </AccordionTrigger>
                          <AccordionContent className="text-foreground pb-4">
                            {faq.answer || faq.a}
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
                    {operatingLocations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-semibold text-muted-foreground mb-2">
                          Operating Locations
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {operatingLocations.map((location: string, index: number) => (
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
                  <Button className="w-full bg-heading-blue hover:bg-heading-blue-dark" asChild>
                    <Link href={`/hyderabad/projects?developer=${developer.url_slug}`}>
                      View All Projects
                    </Link>
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
                      asChild
                    >
                      <a href={`https://wa.me/919866085831?text=Hi, I'm interested in ${encodeURIComponent(developer.developer_name)} projects`} target="_blank" rel="noopener noreferrer">
                        Chat Now
                      </a>
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
                      asChild
                    >
                      <a href="tel:+919866085831">
                        +91 98660 85831
                      </a>
                    </Button>
                  </CardContent>
                </Card>
                
                <Card className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-heading-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe className="w-6 h-6 text-heading-blue" />
                    </div>
                    <h3 className="font-semibold text-heading-blue mb-2">Visit Office</h3>
                    <Button variant="outline" className="w-full" asChild>
                      <Link href="/contact">Get Directions</Link>
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </div>
        
      <CityHubBacklink />
    </>
  );
}
