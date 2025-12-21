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
  return buildMetadata({
    title: "Top Real Estate Developers in Hyderabad 2026 | Reviews & Projects",
    description: "Compare Hyderabad's best real estate builders like My Home, Rajapushpa, Prestige, and Aparna. View track records, RERA status, and latest launches.",
    canonicalUrl: "https://www.westsiderealty.in/developers",
  });
}

interface DeveloperWithProjects {
  id: string;
  developer_name: string;
  url_slug: string;
  logo_url: string | null;
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
  }>;
}

export default async function DevelopersHubPage() {
  const supabase = await createClient();

  // Fetch all published developers
  const { data: developersData, error: devError } = await supabase
    .from("developers")
    .select(`
      id,
      developer_name,
      url_slug,
      logo_url,
      tagline,
      specialization,
      years_in_business,
      total_projects,
      total_sft_delivered,
      primary_city_focus,
      founding_date
    `)
    .eq("is_published", true)
    .order("display_order", { ascending: true });

  if (devError) {
    console.error("Error fetching developers:", devError);
  }

  const developers = (developersData || []) as Array<Omit<DeveloperWithProjects, "notable_projects">>;

  // Fetch top 2-3 projects for each developer
  const developersWithProjects: DeveloperWithProjects[] = await Promise.all(
    developers.map(async (developer) => {
      const { data: projectsData } = await supabase
        .from("projects")
        .select(`
          project_name,
          url_slug,
          city:cities!projects_city_id_fkey(url_slug)
        `)
        .eq("developer_id", developer.id)
        .eq("status", "published")
        .order("display_order", { ascending: true })
        .limit(3);

      const notableProjects = (projectsData || []).map((p) => ({
        project_name: p.project_name,
        url_slug: p.url_slug,
        city_slug: (p.city as any)?.url_slug || "hyderabad",
      }));

      return {
        ...developer,
        notable_projects: notableProjects,
      };
    })
  );

  // Calculate market stats
  const totalProjects = developers.reduce((sum, dev) => sum + (dev.total_projects || 0), 0);
  const totalSftDelivered = developers.reduce((sum, dev) => {
    const sft = dev.total_sft_delivered ? parseFloat(dev.total_sft_delivered.replace(/,/g, "")) : 0;
    return sum + sft;
  }, 0);
  const totalSftFormatted = totalSftDelivered >= 1000000000
    ? `${(totalSftDelivered / 1000000000).toFixed(1)}B`
    : totalSftDelivered >= 1000000
    ? `${(totalSftDelivered / 1000000).toFixed(1)}M`
    : totalSftDelivered >= 1000
    ? `${(totalSftDelivered / 1000).toFixed(1)}K`
    : totalSftDelivered.toString();

  // Get unique specializations
  const specializations = [
    ...new Set(
      developers
        .map((d) => d.specialization)
        .filter((s): s is string => s !== null && s !== "")
    ),
  ].sort();

  // ItemList Schema for SEO
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Top Real Estate Developers in Hyderabad 2026",
    description: "Compare Hyderabad's best real estate builders with track records, RERA status, and latest launches",
    url: "https://www.westsiderealty.in/developers",
    numberOfItems: developersWithProjects.length,
    itemListElement: developersWithProjects.map((developer, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateAgent",
        "@id": `https://www.westsiderealty.in/developers/${developer.url_slug}`,
        name: developer.developer_name,
        url: `https://www.westsiderealty.in/developers/${developer.url_slug}`,
        ...(developer.logo_url && { logo: developer.logo_url }),
        ...(developer.tagline && { description: developer.tagline }),
        ...(developer.founding_date && {
          foundingDate: developer.founding_date,
        }),
        ...(developer.years_in_business && {
          // Calculate founding date from years_in_business if founding_date not available
          ...(!developer.founding_date && {
            foundingDate: new Date().getFullYear() - developer.years_in_business,
          }),
        }),
        ...(developer.notable_projects.length > 0 && {
          makesOffer: developer.notable_projects.slice(0, 3).map((project) => ({
            "@type": "Offer",
            name: project.project_name,
            url: `https://www.westsiderealty.in/${project.city_slug}/projects/${project.url_slug}`,
          })),
        }),
      },
    })),
  };

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Developers", href: "/developers" },
  ];

  return (
    <>
      <JsonLd jsonLd={itemListSchema} />

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
        <DevelopersHubClient
          initialDevelopers={developersWithProjects}
          specializations={specializations}
        />

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
