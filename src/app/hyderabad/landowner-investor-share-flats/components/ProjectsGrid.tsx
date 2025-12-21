import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building2, MapPin, IndianRupee, Home, ArrowRight } from "lucide-react";

interface LandownerProject {
  id: string;
  project_name: string;
  developer_name: string | null;
  micro_market: string | null;
  share_type: string;
  available_units: number | null;
  price_range_text: string | null;
  discount_percentage: number | null;
  bhk_configurations: string[] | null;
  hero_image_url: string | null;
}

interface ProjectsGridProps {
  projects: LandownerProject[];
}

export function ProjectsGrid({ projects }: ProjectsGridProps) {
  const getShareTypeLabel = (shareType: string) => {
    if (shareType === "landowner") return "Landowner Share";
    if (shareType === "investor") return "Investor Share";
    if (shareType === "both") return "Both Available";
    return "Share Units";
  };

  const getShareTypeColor = (shareType: string) => {
    if (shareType === "landowner") return "bg-green-500";
    if (shareType === "investor") return "bg-blue-500";
    return "bg-purple-500";
  };

  if (projects.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No projects available at the moment</h3>
          <p className="text-muted-foreground">Check back soon for new listings.</p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
          Landowner & Investor Share Projects in Hyderabad
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12">
          Explore {projects.length}+ verified projects with available units
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="group overflow-hidden hover:shadow-xl transition-all duration-300">
              {/* Image */}
              {project.hero_image_url ? (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={project.hero_image_url}
                    alt={`${project.project_name} - ${getShareTypeLabel(project.share_type)}`}
                    fill
                    className="object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getShareTypeColor(project.share_type)} text-white`}>
                      {getShareTypeLabel(project.share_type)}
                    </Badge>
                  </div>
                  {project.discount_percentage && (
                    <div className="absolute top-4 right-4">
                      <Badge className="bg-amber-500 text-white">
                        {project.discount_percentage}% Below Market
                      </Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
                  <Building2 className="h-16 w-16 text-primary/50" />
                  <div className="absolute top-4 left-4">
                    <Badge className={`${getShareTypeColor(project.share_type)} text-white`}>
                      {getShareTypeLabel(project.share_type)}
                    </Badge>
                  </div>
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                  {project.project_name}
                </h3>

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {project.developer_name && `by ${project.developer_name}`}
                    {project.developer_name && project.micro_market && " • "}
                    {project.micro_market}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  {project.price_range_text && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <IndianRupee className="h-3 w-3" />
                        <span>Price Range</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">{project.price_range_text}</p>
                    </div>
                  )}

                  {project.bhk_configurations && project.bhk_configurations.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                        <Home className="h-3 w-3" />
                        <span>Configurations</span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {project.bhk_configurations.join(", ")}
                      </p>
                    </div>
                  )}
                </div>

                {project.available_units && (
                  <div className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{project.available_units}</span> units available
                  </div>
                )}

                <Button asChild className="w-full" variant="default">
                  <Link href={`/hyderabad/projects/${project.project_name.toLowerCase().replace(/\s+/g, "-")}`}>
                    View Details <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

