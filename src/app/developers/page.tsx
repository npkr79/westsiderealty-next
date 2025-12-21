import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Building2, Search, CheckCircle2, Award, TrendingUp, ArrowRight } from "lucide-react";
import { DevelopersHubClient } from "@/components/developers/DevelopersHubClient";

export async function generateMetadata(): Promise<Metadata> {
  const supabase = await createClient();
  
  // Fetch published developers to get accurate count
  const { data: allDevelopers } = await supabase
    .from("developers")
    .select("id, developer_name, is_published")
    .limit(100);
  
  // Filter for published developers (same logic as main component)
  const publishedDevelopers = allDevelopers?.filter((dev: any) => {
    return dev.is_published === true || dev.is_published === undefined || dev.is_published === null;
  }) || [];
  
  const developerCount = publishedDevelopers.length;
  const topDeveloperNames = publishedDevelopers
    .slice(0, 3)
    .map((d: any) => d.developer_name)
    .join(", ") || "My Home, Rajapushpa, Prestige";
  
  return buildMetadata({
    title: `Top ${developerCount} Real Estate Developers in Hyderabad | Westside Realty`,
    description: `Browse our curated list of ${developerCount} trusted builders like ${topDeveloperNames}. Verified track records and active projects.`,
    canonicalUrl: "https://www.westsiderealty.in/developers",
  });
}

interface DeveloperWithProjects {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
  banner_image_url?: string | null;
  tagline: string | null;
  specialization: string | null;
  years_in_business: number | null;
  total_projects: number | null;
  total_sft_delivered: string | null;
  primary_city_focus: string | null;
  founding_date?: string | null;
  notable_projects: Array<{
    project_name: string;
    url_slug: string;
    city_slug: string;
    hero_image_url?: string | null;
  }>;
}

export default async function DevelopersHubPage() {
  const supabase = await createClient();

  // Step 1: Fetch ALL developers without filters to rule out data mismatches
  console.log("[DevelopersHub] Starting data fetch...");
  
  const { data: allDevelopersData, error: allDevError } = await supabase
    .from("developers")
    .select("*")
    .order("display_order", { ascending: true })
    .limit(100);

  console.log(`[DevelopersHub] Server fetched developers (no filters): ${allDevelopersData?.length || 0}`);
  
  if (allDevError) {
    console.error("[DevelopersHub] Error fetching all developers:", allDevError);
  }

  // Step 2: Filter for published developers (if we have data)
  let developers: Array<Omit<DeveloperWithProjects, "notable_projects"> & { banner_image_url?: string | null }>;
  
  if (!allDevelopersData || allDevelopersData.length === 0) {
    console.error("[DevelopersHub] CRITICAL: No developers found in database. Check RLS policies and data.");
    developers = [];
  } else {
    // Filter for published developers if is_published field exists
    const publishedDevelopers = allDevelopersData.filter((dev: any) => {
      // If is_published field exists, use it; otherwise include all
      return dev.is_published === true || dev.is_published === undefined || dev.is_published === null;
    });
    
    console.log(`[DevelopersHub] Filtered to ${publishedDevelopers.length} published developers`);
    
    developers = publishedDevelopers.map((dev: any) => ({
      id: dev.id,
      developer_name: dev.developer_name,
      url_slug: dev.url_slug,
      logo_url: dev.logo_url,
      banner_image_url: dev.banner_image_url,
      tagline: dev.tagline,
      specialization: dev.specialization,
      years_in_business: dev.years_in_business,
      total_projects: dev.total_projects,
      total_sft_delivered: dev.total_sft_delivered,
      primary_city_focus: dev.primary_city_focus,
      founding_date: dev.founding_date,
    })) as Array<Omit<DeveloperWithProjects, "notable_projects"> & { banner_image_url?: string | null }>;
  }

  // Fetch top 2-3 projects for each developer
  const developersWithProjects: DeveloperWithProjects[] = await Promise.all(
    developers.map(async (developer) => {
      try {
        const { data: projectsData, error: projectsError } = await supabase
          .from("projects")
          .select(`
            project_name,
            url_slug,
            hero_image_url,
            city:cities!projects_city_id_fkey(url_slug)
          `)
          .eq("developer_id", developer.id)
          .eq("status", "published")
          .order("display_order", { ascending: true })
          .limit(3);

        if (projectsError) {
          console.warn(`[DevelopersHub] Error fetching projects for ${developer.developer_name}:`, projectsError);
        }

        const notableProjects = (projectsData || []).map((p) => ({
          project_name: p.project_name,
          url_slug: p.url_slug,
          city_slug: (p.city as any)?.url_slug || "hyderabad",
          hero_image_url: p.hero_image_url || null,
        }));

        return {
          ...developer,
          notable_projects: notableProjects,
        };
      } catch (error) {
        console.error(`[DevelopersHub] Error processing developer ${developer.developer_name}:`, error);
        return {
          ...developer,
          notable_projects: [],
        };
      }
    })
  );

  console.log(`[DevelopersHub] Processed ${developersWithProjects.length} developers with projects`);
  
  // Final debug log before returning JSX
  console.log(`[DevelopersHub] Server fetched developers: ${developersWithProjects.length}`);

  // Calculate market stats from developersWithProjects
  const totalProjects = developersWithProjects.reduce((sum, dev) => {
    const projects = dev.total_projects;
    // Handle number format (most common)
    if (typeof projects === 'number' && !isNaN(projects)) {
      return sum + projects;
    }
    // Handle string format if present
    if (projects != null) {
      const projectsStr = String(projects);
      const num = parseInt(projectsStr.replace(/,/g, ''), 10);
      if (!isNaN(num)) {
        return sum + num;
      }
    }
    return sum;
  }, 0);

  const totalSftDelivered = developersWithProjects.reduce((sum, dev) => {
    if (!dev.total_sft_delivered) return sum;
    const sftStr = dev.total_sft_delivered.toString();
    
    // Handle various formats: "37 Million SFT", "1,234.56", "1234.56", "1.23M", "10 million sq. ft.", etc.
    // Extract numbers and multipliers
    const lowerStr = sftStr.toLowerCase();
    let multiplier = 1;
    
    if (lowerStr.includes('billion') || lowerStr.includes('b')) {
      multiplier = 1000000000;
    } else if (lowerStr.includes('million') || lowerStr.includes('m')) {
      multiplier = 1000000;
    } else if (lowerStr.includes('lakh') || lowerStr.includes('lac')) {
      multiplier = 100000;
    } else if (lowerStr.includes('thousand') || lowerStr.includes('k')) {
      multiplier = 1000;
    }
    
    // Extract numeric value
    const cleaned = sftStr.replace(/,/g, '').replace(/[^\d.]/g, '');
    const num = parseFloat(cleaned) || 0;
    
    return sum + (num * multiplier);
  }, 0);
  
  console.log(`[DevelopersHub] Stats: ${totalProjects} projects, ${totalSftDelivered} sqft`);
  
  const totalSftFormatted = totalSftDelivered >= 1000000000
    ? `${(totalSftDelivered / 1000000000).toFixed(1)}B`
    : totalSftDelivered >= 1000000
    ? `${(totalSftDelivered / 1000000).toFixed(1)}M`
    : totalSftDelivered >= 1000
    ? `${(totalSftDelivered / 1000).toFixed(1)}K`
    : totalSftDelivered > 0
    ? totalSftDelivered.toLocaleString()
    : "0";

  // Get unique specializations
  const specializations = [
    ...new Set(
      developers
        .map((d) => d.specialization)
        .filter((s): s is string => s !== null && s !== "")
    ),
  ].sort();

  // ItemList Schema for SEO - simplified format to avoid validation errors
  const itemListSchema = developersWithProjects.length > 0 ? {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top ${developersWithProjects.length} Real Estate Developers in Hyderabad 2026`,
    description: `Browse our curated directory of ${developersWithProjects.length} trusted real estate builders in Hyderabad. Compare track records, RERA status, and active projects.`,
    url: "https://www.westsiderealty.in/developers",
    numberOfItems: developersWithProjects.length,
    itemListElement: developersWithProjects.map((developer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      url: `https://www.westsiderealty.in/developers/${developer.url_slug}`,
      name: developer.developer_name,
    })),
  } : null;

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Developers", href: "/developers" },
  ];

  return (
    <>
      {itemListSchema && <JsonLd jsonLd={itemListSchema} />}

      <div className="min-h-screen bg-background">
        {/* Breadcrumbs */}
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        {/* Hero Section */}
        <section className="relative py-20 px-4 bg-gradient-to-b from-slate-50 to-background border-b">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center space-y-6 mb-12">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground">
                Hyderabad's Most Trusted Real Estate Developers
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                Explore profiles of the city's top builders, from ultra-luxury high-rises in Kokapet to expansive villa townships in Mokila.
              </p>
            </div>

            {/* Market Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto">
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {totalProjects}+
                  </div>
                  <div className="text-sm text-muted-foreground">Total Projects Tracked</div>
                </CardContent>
              </Card>
              <Card className="text-center">
                <CardContent className="p-6">
                  <div className="text-3xl md:text-4xl font-bold text-primary mb-2">
                    {totalSftFormatted}
                  </div>
                  <div className="text-sm text-muted-foreground">Total Sq.Ft Delivered</div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Developers Grid with Filters */}
        {developersWithProjects.length === 0 ? (
          <section className="container mx-auto px-4 py-12">
            <Card>
              <CardContent className="p-12 text-center">
                <Building2 className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">No developers found</h2>
                <p className="text-muted-foreground mb-4">
                  Please check Database RLS Policies and ensure developers are published.
                </p>
                <p className="text-sm text-muted-foreground">
                  Server logs show: {developers.length === 0 ? "No developers in database" : `${developers.length} developers found, but none are published`}
                </p>
              </CardContent>
            </Card>
          </section>
        ) : (
          <DevelopersHubClient
            initialDevelopers={developersWithProjects}
            specializations={specializations}
          />
        )}

        {/* How to Choose a Builder Section */}
        <section className="container mx-auto px-4 py-16 bg-slate-50/50">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-8 text-center">
              How to Choose a Builder in Hyderabad
            </h2>
            <Card>
              <CardContent className="p-8 space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <Award className="h-6 w-6 text-primary" />
                    Grade A Developers
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Grade A developers in Hyderabad are established builders with a proven track record of delivering
                    high-quality projects on time. These developers typically have 15+ years of experience, RERA
                    compliance, and a portfolio of successful residential and commercial projects. Examples include My
                    Home Group, Rajapushpa Properties, Prestige Group, and Aparna Constructions. They focus on premium
                    locations like Kokapet, Financial District, and Gachibowli, offering luxury apartments, villas, and
                    integrated townships with world-class amenities.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-primary" />
                    Emerging Builders
                  </h3>
                  <p className="text-muted-foreground leading-relaxed">
                    Emerging builders are newer players in the market (5-10 years) who offer competitive pricing and
                    innovative designs. While they may have fewer completed projects, they often provide better value
                    for money and focus on emerging micro-markets like Tellapur, Kollur, and Mokila. These builders are
                    ideal for budget-conscious buyers seeking modern amenities at affordable prices. However, it's
                    crucial to verify their RERA registration, financial stability, and past project delivery timelines
                    before investing.
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <p className="text-sm text-muted-foreground italic">
                    <strong>Pro Tip:</strong> Always verify RERA registration, check past project reviews, visit
                    completed projects, and consult with a trusted real estate advisor before making your investment
                    decision.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </>
  );
}
