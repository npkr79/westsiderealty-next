import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Flame } from "lucide-react";

interface LandingPage {
  id: string;
  uri: string;
  title: string;
  headline: string | null;
  location_info: string | null;
  hero_image_url: string | null;
  template_type: string | null;
}

export default async function FeaturedProjects() {
  const supabase = await createClient();

  const { data: landingPages, error } = await supabase
    .from("landing_pages")
    .select("id, uri, title, headline, location_info, hero_image_url, template_type")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error("Error fetching featured projects:", error);
  }

  const projects = (landingPages || []) as LandingPage[];

  if (projects.length === 0) {
    return null; // Don't render section if no projects
  }

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-background to-primary/5">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Flame className="h-6 w-6 text-primary" />
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Featured New Launches
            </h2>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the latest premium projects and exclusive launches in prime locations
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => {
            const isUltraLuxury = project.template_type === "ultra_luxury_duplex";
            const imageUrl = project.hero_image_url || "/placeholder.svg";
            const displayTitle = project.headline || project.title;
            const location = project.location_info || "Premium Location";

            return (
              <Link key={project.id} href={`/landing/${project.uri}`}>
                <Card className="h-full overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group">
                  <div className="relative h-48 w-full overflow-hidden">
                    <Image
                      src={imageUrl}
                      alt={displayTitle}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    {isUltraLuxury && (
                      <Badge className="absolute top-3 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 shadow-lg">
                        <Flame className="h-3 w-3 mr-1" />
                        Trending
                      </Badge>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </div>
                  <CardContent className="p-5">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                      {displayTitle}
                    </h3>
                    <p className="text-sm text-muted-foreground flex items-center gap-1 mb-4">
                      <span className="text-primary">📍</span>
                      {location}
                    </p>
                    <div className="flex items-center justify-between pt-3 border-t border-border">
                      <span className="text-sm font-medium text-primary">
                        View Details →
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

