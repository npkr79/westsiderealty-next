import { Building2 } from "lucide-react";
import type { LandownerProject } from "@/lib/supabase/landowner-projects";
import { LandownerProjectCard } from "./LandownerProjectCard";

interface Props {
  projects: LandownerProject[];
}

export function LandownerProjectsGrid({ projects }: Props) {
  if (projects.length === 0) {
    return (
      <section className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium">No projects available at the moment</h3>
            <p className="text-muted-foreground">Check back soon for new listings.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-center">
          Available Landowner & Investor Share Projects
        </h2>
        <p className="text-lg text-muted-foreground text-center mb-12 max-w-3xl mx-auto">
          Explore {projects.length}+ premium projects in Hyderabad with landowner and investor share units available at
          10-15% below market rates.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {projects.map((project) => (
            <LandownerProjectCard key={project.id} project={project} />
          ))}
        </div>
      </div>
    </section>
  );
}

