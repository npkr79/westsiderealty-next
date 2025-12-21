import Image from "next/image";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MapPin, Building2, Maximize, IndianRupee, ArrowRight } from "lucide-react";
import type { LandownerProject } from "@/lib/supabase/landowner-projects";

interface Props {
  project: LandownerProject;
}

export function LandownerProjectCard({ project }: Props) {
  const citySlug = project.city?.url_slug || "hyderabad";
  
  // Construct project URL - use standard project route
  const projectUrl = `/${citySlug}/projects/${project.url_slug}`;

  return (
    <Card className="group overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* Image */}
      {project.hero_image_url ? (
        <div className="relative h-48 w-full overflow-hidden">
          <Image
            src={project.hero_image_url}
            alt={project.project_name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          
          {/* Badge */}
          <div className="absolute top-4 left-4">
            <Badge className="bg-amber-500 text-white font-semibold">
              Landowner/Investor Share
            </Badge>
          </div>
          
          {project.completion_status && (
            <div className="absolute top-4 right-4">
              <Badge variant="secondary" className="bg-white/90 text-foreground">
                {project.completion_status}
              </Badge>
            </div>
          )}
        </div>
      ) : (
        <div className="relative h-48 w-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
          <Building2 className="h-16 w-16 text-primary/50" />
          <div className="absolute top-4 left-4">
            <Badge className="bg-amber-500 text-white font-semibold">
              Landowner/Investor Share
            </Badge>
          </div>
        </div>
      )}

      {/* Content */}
      <CardContent className="p-6 space-y-4">
        <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
          {project.project_name}
        </h3>

        {/* Location */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {project.micro_market?.micro_market_name || "Hyderabad"}
          </span>
        </div>

        {/* Developer */}
        {project.developer && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span>{project.developer.developer_name}</span>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          {project.price_range_text && (
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <IndianRupee className="h-3 w-3" />
                <span>Price Range</span>
              </div>
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {project.price_range_text}
              </p>
            </div>
          )}
          {project.unit_size_range && (
            <div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                <Maximize className="h-3 w-3" />
                <span>Unit Size</span>
              </div>
              <p className="text-sm font-semibold text-foreground line-clamp-1">
                {project.unit_size_range}
              </p>
            </div>
          )}
        </div>

        {/* Property Types */}
        {project.property_types && (
          <div className="text-xs text-muted-foreground">
            <span className="font-semibold">Type:</span> {project.property_types}
          </div>
        )}

        {/* CTA */}
        <Button asChild className="w-full" variant="default">
          <Link href={projectUrl}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}

