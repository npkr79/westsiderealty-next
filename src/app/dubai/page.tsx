import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { buildMetadata } from "@/components/common/SEO";
import { JsonLd } from "@/components/common/SEO";
import { PageHeader } from "@/components/common/PageHeader";
import ProjectCard from "@/components/properties/ProjectCard";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Building2, TrendingUp, Shield } from "lucide-react";
import { projectService } from "@/services/projectService";
import { UnifiedPropertyService } from "@/services/unifiedPropertyService";

export const metadata: Metadata = buildMetadata({
  title: "Dubai Real Estate | RE/MAX Westside Realty",
  description: "Explore premium properties, luxury apartments, and investment opportunities in Dubai with RE/MAX Westside Realty.",
  canonicalUrl: "https://www.westsiderealty.in/dubai",
});

export default async function DubaiPage() {
  const supabase = await createClient();
  
  // Get Dubai city entry
  const { data: city } = await supabase
    .from("cities")
    .select("*")
    .eq("url_slug", "dubai")
    .maybeSingle();
  
  // If city doesn't exist, still show the page but with limited data
  let projects: any[] = [];
  let properties: any[] = [];
  
  if (city) {
    // Fetch projects for Dubai
    projects = await projectService.getProjectsByCity(city.id, true);
    projects = projects.slice(0, 6);
    
    // Fetch Dubai properties if table exists
    try {
      properties = await UnifiedPropertyService.getProperties('dubai');
      properties = properties.slice(0, 12);
    } catch (error) {
      console.log('Dubai properties not available:', error);
    }
  }

  const breadcrumbItems = [
    { label: "Home", href: "/" },
    { label: "Dubai", href: "/dubai" },
  ];

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: "Dubai Real Estate",
    description: "Premium properties and investment opportunities in Dubai",
    url: "https://www.westsiderealty.in/dubai",
  };

  return (
    <>
      <JsonLd jsonLd={jsonLd} />
      
      {/* Page Header with Breadcrumbs */}
      <PageHeader
        title="Dubai Real Estate"
        subtitle="Discover luxury properties and investment opportunities in the world's most dynamic real estate market."
        breadcrumbs={breadcrumbItems}
      />

      {/* Market Overview */}
      <section className="py-16 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-8 text-center">Why Invest in Dubai?</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="bg-white p-6 shadow-lg">
              <CardContent className="pt-6">
                <Shield className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-center">Tax-Free Returns</h3>
                <p className="text-slate-600 text-center">Zero property tax and no capital gains tax on real estate investments.</p>
              </CardContent>
            </Card>
            <Card className="bg-white p-6 shadow-lg">
              <CardContent className="pt-6">
                <TrendingUp className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-center">High Rental Yields</h3>
                <p className="text-slate-600 text-center">Average rental yields of 5-8% annually, among the highest globally.</p>
              </CardContent>
            </Card>
            <Card className="bg-white p-6 shadow-lg">
              <CardContent className="pt-6">
                <Building2 className="h-10 w-10 mx-auto mb-4 text-primary" />
                <h3 className="font-semibold text-lg mb-2 text-center">Golden Visa Eligibility</h3>
                <p className="text-slate-600 text-center">Property investments can qualify you for UAE residency.</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Featured Projects */}
      {projects.length > 0 && (
        <section className="py-16 bg-secondary/10">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-[hsl(var(--heading-blue))] mb-8 text-center">
              New Projects in Dubai
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {projects.map((project) => (
                <ProjectCard key={project.id} project={project} citySlug="dubai" />
              ))}
            </div>
            <div className="flex justify-center mt-8">
              <Button asChild>
                <Link href="/dubai/projects">View All Projects</Link>
              </Button>
            </div>
          </div>
        </section>
      )}

      {/* Featured Properties */}
      {properties.length > 0 && (
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold mb-8 text-center">Featured Properties in Dubai</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {properties.map((property) => (
                <Card key={property.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold mb-2">{property.title || property.name}</h3>
                    {property.price && (
                      <p className="text-primary font-bold text-xl mb-2">{property.price}</p>
                    )}
                    {property.location && (
                      <p className="text-sm text-muted-foreground">{property.location}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CTA Section */}
      <section className="py-16 bg-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Interested in Dubai Properties?</h2>
          <p className="text-lg text-muted-foreground mb-6 max-w-2xl mx-auto">
            Our Dubai experts are here to help you find the perfect investment.
          </p>
          <Button size="lg" asChild>
            <Link href="/contact">Contact Us</Link>
          </Button>
        </div>
      </section>
    </>
  );
}

