"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ProjectsFiltersProps {
  microMarketOptions: Array<{ micro_market_name: string; url_slug: string }>;
  citySlug: string;
}

export default function ProjectsFilters({ microMarketOptions, citySlug }: ProjectsFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [microMarketFilter, setMicroMarketFilter] = useState(searchParams.get("microMarket") || "");
  const [statusFilter, setStatusFilter] = useState(searchParams.get("status") || "");

  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (microMarketFilter && microMarketFilter !== "all") params.set("microMarket", microMarketFilter);
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);

    const queryString = params.toString();
    const newUrl = queryString ? `/${citySlug}/projects?${queryString}` : `/${citySlug}/projects`;
    
    // Use replace to avoid adding to history
    router.replace(newUrl);
  }, [search, microMarketFilter, statusFilter, citySlug, router]);

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
      <Select value={microMarketFilter} onValueChange={setMicroMarketFilter}>
        <SelectTrigger className="w-full md:w-48">
          <SelectValue placeholder="All Areas" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Areas</SelectItem>
          {microMarketOptions.map((mm) => (
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
          <SelectItem value="under construction">Under Construction</SelectItem>
          <SelectItem value="ready to move">Ready to Move</SelectItem>
          <SelectItem value="pre-launch">Pre-Launch</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

