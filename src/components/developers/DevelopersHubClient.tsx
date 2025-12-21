"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Building2, Search, CheckCircle2, ArrowRight } from "lucide-react";

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
  notable_projects: Array<{
    project_name: string;
    url_slug: string;
    city_slug: string;
  }>;
}

interface DevelopersHubClientProps {
  initialDevelopers: DeveloperWithProjects[];
  specializations: string[];
}

export function DevelopersHubClient({
  initialDevelopers,
  specializations,
}: DevelopersHubClientProps) {
  const [search, setSearch] = useState("");
  const [specialization, setSpecialization] = useState<string>("all");

  // Filter developers
  const filteredDevelopers = useMemo(() => {
    let filtered = initialDevelopers;

    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(
        (dev) =>
          dev.developer_name.toLowerCase().includes(searchLower) ||
          dev.tagline?.toLowerCase().includes(searchLower) ||
          dev.specialization?.toLowerCase().includes(searchLower)
      );
    }

    // Specialization filter
    if (specialization !== "all") {
      filtered = filtered.filter((dev) => {
        const devSpecialization = dev.specialization?.toLowerCase() || "";
        // Match exact or contains the specialization keyword
        return (
          devSpecialization === specialization.toLowerCase() ||
          devSpecialization.includes(specialization.toLowerCase()) ||
          specialization.toLowerCase().includes(devSpecialization)
        );
      });
    }

    return filtered;
  }, [initialDevelopers, search, specialization]);

  // Format SFT delivered
  const formatSft = (sft: string | null): string => {
    if (!sft) return "-";
    const num = parseFloat(sft.replace(/,/g, ""));
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(1)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return sft;
  };

  return (
    <section className="container mx-auto px-4 py-12">
      {/* Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search developers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {/* Specialization Filter */}
        <Tabs value={specialization} onValueChange={setSpecialization} className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-5">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high-rise">High-Rise</TabsTrigger>
            <TabsTrigger value="villas">Villas</TabsTrigger>
            <TabsTrigger value="commercial">Commercial</TabsTrigger>
            <TabsTrigger value="integrated townships">Integrated Townships</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Developers Grid */}
      {filteredDevelopers.length === 0 ? (
        <div className="text-center py-12">
          <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium">No developers found</h3>
          <p className="text-muted-foreground">Try adjusting your search filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDevelopers.map((developer) => (
            <Card
              key={developer.id}
              className="group overflow-hidden hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50"
            >
              {/* Header with Logo and Verified Badge */}
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start gap-4">
                  {developer.logo_url ? (
                    <div className="relative h-20 w-20 flex-shrink-0">
                      <Image
                        src={developer.logo_url}
                        alt={`${developer.developer_name} logo`}
                        fill
                        className="object-contain rounded-lg bg-white p-2 border"
                      />
                    </div>
                  ) : (
                    <div className="h-20 w-20 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-10 w-10 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
                        {developer.developer_name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                        Verified
                      </Badge>
                    </div>
                    {developer.tagline && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {developer.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Key Stats Grid */}
                <div className="grid grid-cols-3 gap-3 pt-4 border-t">
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {developer.years_in_business || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Years</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {developer.total_projects || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground">Projects</p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-lg">
                    <p className="text-lg font-bold text-primary">
                      {formatSft(developer.total_sft_delivered)}
                    </p>
                    <p className="text-xs text-muted-foreground">Sq.Ft</p>
                  </div>
                </div>

                {/* Notable Projects */}
                {developer.notable_projects.length > 0 && (
                  <div className="pt-4 border-t">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                      Notable Projects
                    </p>
                    <ul className="space-y-1">
                      {developer.notable_projects.slice(0, 3).map((project, idx) => (
                        <li key={idx} className="text-sm text-foreground">
                          • {project.project_name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* CTA Button */}
                <Button
                  asChild
                  className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white"
                  size="lg"
                >
                  <Link href={`/developers/${developer.url_slug}`}>
                    View Developer Profile
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </section>
  );
}

