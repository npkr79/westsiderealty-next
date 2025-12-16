 "use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Search, Building2, MapPin, Award } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/Header";
import FooterSection from "@/components/home/FooterSection";
import { developersHubService, DeveloperListItem, DeveloperFilters } from "@/services/developersHubService";

const DevelopersHubPage = () => {
  const [developers, setDevelopers] = useState<DeveloperListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [cityFocus, setCityFocus] = useState<string>("");
  const [cityOptions, setCityOptions] = useState<string[]>([]);

  useEffect(() => {
    const loadData = async () => {
      const [devs, cities] = await Promise.all([
        developersHubService.getDevelopers(),
        developersHubService.getCityFocusOptions()
      ]);
      setDevelopers(devs);
      setCityOptions(cities);
      setLoading(false);
    };
    loadData();
  }, []);

  useEffect(() => {
    const filters: DeveloperFilters = {};
    if (search) filters.search = search;
    if (cityFocus && cityFocus !== "all") filters.cityFocus = cityFocus;

    const fetchFiltered = async () => {
      setLoading(true);
      const devs = await developersHubService.getDevelopers(filters);
      setDevelopers(devs);
      setLoading(false);
    };

    const debounce = setTimeout(fetchFiltered, 300);
    return () => clearTimeout(debounce);
  }, [search, cityFocus]);

  return (
    <>
      <Header />

      <main className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-16">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              India's Leading Real Estate Developers
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl">
              Discover trusted developers with proven track records in luxury residential, commercial, and mixed-use developments.
            </p>
          </div>
        </section>

        {/* Filters */}
        <section className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
          <div className="container mx-auto px-4 py-4">
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
              <Select value={cityFocus} onValueChange={setCityFocus}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Cities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  {cityOptions.map(city => (
                    <SelectItem key={city} value={city}>{city}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        {/* Developers Grid */}
        <section className="container mx-auto px-4 py-12">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="p-6">
                    <div className="h-16 w-16 bg-muted rounded-lg mb-4" />
                    <div className="h-6 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-full mb-4" />
                    <div className="flex gap-4">
                      <div className="h-10 bg-muted rounded w-20" />
                      <div className="h-10 bg-muted rounded w-20" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : developers.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No developers found</h3>
              <p className="text-muted-foreground">Try adjusting your search filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {developers.map((developer) => (
                <Card key={developer.id} className="group hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      {developer.logo_url ? (
                        <img
                          src={developer.logo_url}
                          alt={`${developer.developer_name} logo`}
                          className="h-16 w-16 object-contain rounded-lg bg-white p-2 border"
                        />
                      ) : (
                        <div className="h-16 w-16 bg-primary/10 rounded-lg flex items-center justify-center">
                          <Building2 className="h-8 w-8 text-primary" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg truncate group-hover:text-primary transition-colors">
                          {developer.developer_name}
                        </h3>
                        {developer.tagline && (
                          <p className="text-sm text-muted-foreground line-clamp-2">{developer.tagline}</p>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {developer.primary_city_focus && (
                        <span className="inline-flex items-center gap-1 text-xs bg-secondary px-2 py-1 rounded-full">
                          <MapPin className="h-3 w-3" />
                          {developer.primary_city_focus}
                        </span>
                      )}
                      {developer.specialization && (
                        <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                          <Award className="h-3 w-3" />
                          {developer.specialization}
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center mb-4 py-3 bg-muted/50 rounded-lg">
                      <div>
                        <p className="text-lg font-bold text-primary">{developer.years_in_business || "-"}</p>
                        <p className="text-xs text-muted-foreground">Years</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{developer.total_projects || "-"}</p>
                        <p className="text-xs text-muted-foreground">Projects</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-primary">{developer.total_sft_delivered || "-"}</p>
                        <p className="text-xs text-muted-foreground">Sq.Ft</p>
                      </div>
                    </div>

                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/developers/${developer.url_slug}`}>
                        View Developer Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </main>

      <FooterSection />
    </>
  );
};

export default DevelopersHubPage;
