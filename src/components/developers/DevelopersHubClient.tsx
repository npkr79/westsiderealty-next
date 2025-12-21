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
  banner_image_url?: string | null;
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
    hero_image_url?: string | null;
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

  // Debug: Log initial data
  console.log(`[DevelopersHubClient] Received ${initialDevelopers.length} developers`);

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
        const filterSpecialization = specialization.toLowerCase();
        
        // If developer has no specialization, only show in "All" tab
        if (!devSpecialization) {
          return false;
        }
        
        // Match exact or contains the specialization keyword
        return (
          devSpecialization === filterSpecialization ||
          devSpecialization.includes(filterSpecialization) ||
          filterSpecialization.includes(devSpecialization)
        );
      });
    }

    console.log(`[DevelopersHubClient] Filtered to ${filtered.length} developers (specialization: ${specialization}, search: "${search}")`);
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
          {filteredDevelopers.map((developer) => {
            // Get banner image: use developer banner_image_url or first project's hero_image_url
            const bannerImage =
              developer.banner_image_url ||
              developer.notable_projects.find((p) => p.hero_image_url)?.hero_image_url ||
              null;

            return (
              <Card
                key={developer.id}
                className="group overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                {/* Banner Image Header */}
                {bannerImage && (
                  <div className="relative h-40 w-full overflow-hidden">
                    <Image
                      src={bannerImage}
                      alt={`${developer.developer_name} banner`}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                    {/* Logo overlapping banner and body */}
                    {developer.logo_url && (
                      <div className="absolute -bottom-10 left-6 z-10">
                        <div className="relative h-20 w-20 rounded-full bg-white p-2 shadow-lg border-4 border-white">
                          <Image
                            src={developer.logo_url}
                            alt={`${developer.developer_name} logo`}
                            fill
                            className="object-contain rounded-full"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <CardContent className={`p-6 space-y-4 ${bannerImage ? "pt-16" : ""}`}>
                  {/* Header with Name and Verified Badge */}
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-xl text-foreground group-hover:text-primary transition-colors">
                      {developer.developer_name}
                    </h3>
                    <Badge
                      variant="secondary"
                      className="flex items-center gap-1 bg-green-50 text-green-700 border-green-200 flex-shrink-0"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                      Verified
                    </Badge>
                  </div>

                  {/* Tagline */}
                  {developer.tagline && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {developer.tagline}
                    </p>
                  )}

                  {/* Notable Projects */}
                  {developer.notable_projects.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-1 uppercase tracking-wide">
                        Known for:
                      </p>
                      <p className="text-sm text-foreground">
                        {developer.notable_projects
                          .slice(0, 2)
                          .map((p) => p.project_name)
                          .join(", ")}
                      </p>
                    </div>
                  )}

                  {/* Specialization Badge */}
                  {developer.specialization && (
                    <div>
                      <Badge variant="outline" className="text-xs">
                        {developer.specialization}
                      </Badge>
                    </div>
                  )}

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

                  {/* CTA Button */}
                  <Button
                    asChild
                    className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white"
                    size="lg"
                  >
                    <Link href={`/developers/${developer.url_slug}`}>
                      View Profile
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}

