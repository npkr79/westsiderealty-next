"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectsFiltersRootProps {
  cities: Array<{ city_name: string; url_slug: string }>;
  microMarkets: Array<{ micro_market_name: string; url_slug: string; city_slug: string }>;
  initialSearch?: string;
  initialCity?: string;
  initialMicroMarket?: string;
  initialStatus?: string;
}

export default function ProjectsFiltersRoot({
  cities,
  microMarkets,
  initialSearch,
  initialCity,
  initialMicroMarket,
  initialStatus,
}: ProjectsFiltersRootProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch || searchParams.get("search") || "");
  // Initialize filters - use "all" as default, not empty string
  const [cityFilter, setCityFilter] = useState(initialCity || searchParams.get("city") || "all");
  const [microMarketFilter, setMicroMarketFilter] = useState(initialMicroMarket || searchParams.get("microMarket") || "all");
  const [statusFilter, setStatusFilter] = useState(initialStatus || searchParams.get("status") || "all");

  // Filter micro markets based on selected city
  const filteredMicroMarkets = cityFilter
    ? microMarkets.filter((mm) => mm.city_slug === cityFilter)
    : microMarkets;

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (cityFilter && cityFilter !== "all") params.set("city", cityFilter);
    if (microMarketFilter && microMarketFilter !== "all") params.set("microMarket", microMarketFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `/projects?${queryString}` : `/projects`;
    
    router.replace(newUrl);
  }, [search, cityFilter, microMarketFilter, statusFilter, router]);

  return (
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search projects..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      <Select value={cityFilter} onValueChange={setCityFilter}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="All Cities" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Cities</SelectItem>
          {cities.map((city) => (
            <SelectItem key={city.url_slug} value={city.url_slug}>
              {city.city_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={microMarketFilter} onValueChange={setMicroMarketFilter}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {filteredMicroMarkets.map((mm) => (
            <SelectItem key={mm.url_slug} value={mm.url_slug}>
              {mm.micro_market_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Select value={statusFilter} onValueChange={setStatusFilter}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="All Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="under-construction">Under Construction</SelectItem>
          <SelectItem value="ready">Ready to Move</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

