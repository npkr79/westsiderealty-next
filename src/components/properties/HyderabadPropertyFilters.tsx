"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { UnifiedPropertyFilters } from "@/types/unifiedProperty";

interface HyderabadPropertyFiltersProps {
  filters: UnifiedPropertyFilters;
  onFiltersChange: (filters: UnifiedPropertyFilters) => void;
  onReset: () => void;
  minPrice?: number;
  maxPrice?: number;
  properties?: any[]; // For counting properties per filter
}

interface Area {
  name: string;
  id?: string;
}

interface Project {
  name: string;
  id?: string;
  count?: number;
}

const PROPERTY_TYPES = ["Apartment", "Villa", "Plot", "Independent House"];
const BHK_OPTIONS = [1, 2, 3, 4, 5];
const COMMON_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Parking",
  "Security",
  "Clubhouse",
  "Garden",
  "Power Backup",
  "Lift",
];

export default function HyderabadPropertyFilters({
  filters,
  onFiltersChange,
  onReset,
  minPrice = 0,
  maxPrice = 500000000,
  properties = [],
}: HyderabadPropertyFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [localFilters, setLocalFilters] = useState<UnifiedPropertyFilters>(filters);
  const [areas, setAreas] = useState<Area[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [showMoreAreas, setShowMoreAreas] = useState(false);
  const [showMoreProjects, setShowMoreProjects] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize price range from filters or use defaults
  const [priceRange, setPriceRange] = useState<[number, number]>([
    filters.priceMin || minPrice,
    filters.priceMax || maxPrice,
  ]);

  useEffect(() => {
    setLocalFilters(filters);
    setPriceRange([filters.priceMin || minPrice, filters.priceMax || maxPrice]);
  }, [filters, minPrice, maxPrice]);

  // Fetch areas and projects from Supabase
  useEffect(() => {
    const fetchFilterData = async () => {
      const supabase = createClient();
      setLoading(true);

      try {
        // Fetch areas from hyderabad_areas table
        const { data: areasData, error: areasError } = await supabase
          .from("hyderabad_areas")
          .select("name, id")
          .eq("is_active", true)
          .order("name");

        if (!areasError && areasData) {
          setAreas(areasData);
        }

        // Fetch projects from hyderabad_project_names table
        const { data: projectsData, error: projectsError } = await supabase
          .from("hyderabad_project_names")
          .select("name, id")
          .eq("is_active", true)
          .order("name");

        if (!projectsError && projectsData) {
          // Calculate property counts for each project
          const projectsWithCounts: Project[] = projectsData.map((project: { name: string; id?: string }) => ({
            ...project,
            count: properties.filter(
              (p: any) => p.project_name?.toLowerCase() === project.name.toLowerCase()
            ).length,
          }));
          setProjects(projectsWithCounts);
        }
      } catch (error) {
        console.error("Error fetching filter data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, [properties]);

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    
    if (localFilters.searchQuery) params.set("search", localFilters.searchQuery);
    if (Array.isArray(localFilters.propertyType) && localFilters.propertyType.length > 0) {
      params.set("propertyType", localFilters.propertyType.join(","));
    } else if (typeof localFilters.propertyType === "string") {
      params.set("propertyType", localFilters.propertyType);
    }
    if (Array.isArray(localFilters.bedrooms) && localFilters.bedrooms.length > 0) {
      params.set("bedrooms", localFilters.bedrooms.join(","));
    } else if (localFilters.bedrooms) {
      params.set("bedrooms", localFilters.bedrooms.toString());
    }
    if (localFilters.microMarkets && localFilters.microMarkets.length > 0) {
      params.set("microMarkets", localFilters.microMarkets.join(","));
    }
    if (localFilters.communities && localFilters.communities.length > 0) {
      params.set("communities", localFilters.communities.join(","));
    }
    if (localFilters.possessionStatus) {
      params.set("possessionStatus", localFilters.possessionStatus);
    }
    if (localFilters.priceMin && localFilters.priceMin > minPrice) {
      params.set("priceMin", localFilters.priceMin.toString());
    }
    if (localFilters.priceMax && localFilters.priceMax < maxPrice) {
      params.set("priceMax", localFilters.priceMax.toString());
    }
    if (localFilters.landownerShare) params.set("landownerShare", "true");
    if (localFilters.investorShare) params.set("investorShare", "true");
    if (localFilters.isResale) params.set("isResale", "true");
    if (localFilters.amenities && localFilters.amenities.length > 0) {
      params.set("amenities", localFilters.amenities.join(","));
    }
    if (localFilters.sortBy) params.set("sortBy", localFilters.sortBy);

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [localFilters, router, minPrice, maxPrice]);

  const updateFilter = (key: keyof UnifiedPropertyFilters, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const toggleArrayFilter = (key: "propertyType" | "bedrooms" | "microMarkets" | "communities" | "amenities", value: string | number) => {
    const current = localFilters[key];
    let array: (string | number)[];
    
    if (key === "propertyType") {
      array = Array.isArray(current) ? current : current ? [current] : [];
    } else if (key === "bedrooms") {
      array = Array.isArray(current) ? current : current ? [current] : [];
    } else {
      array = Array.isArray(current) ? current : [];
    }

    if (array.includes(value)) {
      array = array.filter((item) => item !== value);
    } else {
      array = [...array, value];
    }

    updateFilter(key, array.length > 0 ? array : undefined);
  };

  // Count active filters
  const activeFilterCount: number = [
    localFilters.searchQuery ? 1 : 0,
    Array.isArray(localFilters.propertyType) ? localFilters.propertyType.length : localFilters.propertyType ? 1 : 0,
    Array.isArray(localFilters.bedrooms) ? localFilters.bedrooms.length : localFilters.bedrooms ? 1 : 0,
    localFilters.microMarkets?.length || 0,
    localFilters.communities?.length || 0,
    localFilters.possessionStatus ? 1 : 0,
    localFilters.priceMin && localFilters.priceMin > minPrice ? 1 : 0,
    localFilters.priceMax && localFilters.priceMax < maxPrice ? 1 : 0,
    localFilters.landownerShare ? 1 : 0,
    localFilters.investorShare ? 1 : 0,
    localFilters.isResale ? 1 : 0,
    localFilters.amenities?.length || 0,
    localFilters.sortBy && localFilters.sortBy !== "default" ? 1 : 0,
  ].reduce((sum: number, count: number) => sum + count, 0);

  const formatPrice = (price: number): string => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else {
      return `₹${(price / 100000).toFixed(0)} L`;
    }
  };

  const displayedAreas = showMoreAreas ? areas : areas.slice(0, 8);
  const displayedProjects = showMoreProjects ? projects : projects.slice(0, 8);

  return (
    <Card className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto">
      <CardHeader className="sticky top-0 bg-background z-10 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle>Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="bg-primary text-primary-foreground">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button variant="ghost" size="sm" onClick={onReset}>
              Reset All
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search Properties</Label>
          <Input
            id="search"
            placeholder="Search by name, location..."
            value={localFilters.searchQuery || ""}
            onChange={(e) => updateFilter("searchQuery", e.target.value || undefined)}
            className="mt-2"
          />
        </div>

        {/* Property Type - Checkboxes */}
        <div>
          <Label>Property Type</Label>
          <div className="space-y-2 mt-2">
            {PROPERTY_TYPES.map((type) => {
              const isChecked = Array.isArray(localFilters.propertyType)
                ? localFilters.propertyType.includes(type)
                : localFilters.propertyType === type;
              return (
                <div key={type} className="flex items-center space-x-2">
                  <Checkbox
                    id={`property-type-${type}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleArrayFilter("propertyType", type)}
                  />
                  <Label
                    htmlFor={`property-type-${type}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {type}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* BHK Configuration - Buttons */}
        <div>
          <Label>BHK Configuration</Label>
          <div className="flex flex-wrap gap-2 mt-2">
            {BHK_OPTIONS.map((bhk) => {
              const isSelected = Array.isArray(localFilters.bedrooms)
                ? localFilters.bedrooms.includes(bhk)
                : localFilters.bedrooms === bhk;
              return (
                <Button
                  key={bhk}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  size="sm"
                  onClick={() => toggleArrayFilter("bedrooms", bhk)}
                  className={isSelected ? "" : "bg-background"}
                >
                  {bhk === 5 ? "5+ BHK" : `${bhk} BHK`}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Micro Market/Area - Checkboxes with Show More */}
        {!loading && areas.length > 0 && (
          <div>
            <Label>Micro Market / Area</Label>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {displayedAreas.map((area) => {
                const isChecked = localFilters.microMarkets?.includes(area.name) || false;
                return (
                  <div key={area.id || area.name} className="flex items-center space-x-2">
                    <Checkbox
                      id={`area-${area.name}`}
                      checked={isChecked}
                      onCheckedChange={() => toggleArrayFilter("microMarkets", area.name)}
                    />
                    <Label
                      htmlFor={`area-${area.name}`}
                      className="font-normal cursor-pointer text-sm flex-1"
                    >
                      {area.name}
                    </Label>
                  </div>
                );
              })}
            </div>
            {areas.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreAreas(!showMoreAreas)}
                className="w-full mt-2"
              >
                {showMoreAreas ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show More ({areas.length - 8} more)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Possession Status - Dropdown */}
        <div>
          <Label>Possession Status</Label>
          <Select
            value={localFilters.possessionStatus || "all"}
            onValueChange={(value) =>
              updateFilter("possessionStatus", value === "all" ? undefined : value)
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="Ready to Move">Ready to Move</SelectItem>
              <SelectItem value="Under Construction">Under Construction</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Price Range - Slider */}
        <div>
          <Label>
            Price Range: {formatPrice(priceRange[0])} - {formatPrice(priceRange[1])}
          </Label>
          <div className="mt-4 space-y-2">
            <Slider
              value={priceRange}
              onValueChange={(value) => {
                setPriceRange(value as [number, number]);
                updateFilter("priceMin", value[0]);
                updateFilter("priceMax", value[1]);
              }}
              min={minPrice}
              max={maxPrice}
              step={100000}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatPrice(minPrice)}</span>
              <span>{formatPrice(maxPrice)}</span>
            </div>
          </div>
        </div>

        {/* Share Type - Checkboxes */}
        <div>
          <Label>Share Type</Label>
          <div className="space-y-2 mt-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="landowner-share"
                checked={localFilters.landownerShare || false}
                onCheckedChange={(checked) =>
                  updateFilter("landownerShare", checked || undefined)
                }
              />
              <Label htmlFor="landowner-share" className="font-normal cursor-pointer text-sm">
                Landowner Share
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="investor-share"
                checked={localFilters.investorShare || false}
                onCheckedChange={(checked) =>
                  updateFilter("investorShare", checked || undefined)
                }
              />
              <Label htmlFor="investor-share" className="font-normal cursor-pointer text-sm">
                Investor Share
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="resale"
                checked={localFilters.isResale || false}
                onCheckedChange={(checked) =>
                  updateFilter("isResale", checked || undefined)
                }
              />
              <Label htmlFor="resale" className="font-normal cursor-pointer text-sm">
                Resale
              </Label>
            </div>
          </div>
        </div>

        {/* Community/Project - Checkboxes with counts */}
        {!loading && projects.length > 0 && (
          <div>
            <Label>Community / Project</Label>
            <div className="space-y-2 mt-2 max-h-64 overflow-y-auto">
              {displayedProjects.map((project) => {
                const isChecked = localFilters.communities?.includes(project.name) || false;
                return (
                  <div
                    key={project.id || project.name}
                    className="flex items-center justify-between space-x-2"
                  >
                    <div className="flex items-center space-x-2 flex-1">
                      <Checkbox
                        id={`project-${project.name}`}
                        checked={isChecked}
                        onCheckedChange={() => toggleArrayFilter("communities", project.name)}
                      />
                      <Label
                        htmlFor={`project-${project.name}`}
                        className="font-normal cursor-pointer text-sm flex-1"
                      >
                        {project.name}
                      </Label>
                    </div>
                    {project.count !== undefined && (
                      <Badge variant="secondary" className="text-xs">
                        {project.count}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            {projects.length > 8 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowMoreProjects(!showMoreProjects)}
                className="w-full mt-2"
              >
                {showMoreProjects ? (
                  <>
                    <ChevronUp className="h-4 w-4 mr-1" />
                    Show Less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-4 w-4 mr-1" />
                    Show More ({projects.length - 8} more)
                  </>
                )}
              </Button>
            )}
          </div>
        )}

        {/* Amenities - Checkboxes */}
        <div>
          <Label>Amenities</Label>
          <div className="space-y-2 mt-2 max-h-48 overflow-y-auto">
            {COMMON_AMENITIES.map((amenity) => {
              const isChecked = localFilters.amenities?.includes(amenity) || false;
              return (
                <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                    id={`amenity-${amenity}`}
                    checked={isChecked}
                    onCheckedChange={() => toggleArrayFilter("amenities", amenity)}
                  />
                  <Label
                    htmlFor={`amenity-${amenity}`}
                    className="font-normal cursor-pointer text-sm"
                  >
                    {amenity}
                  </Label>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sort By - Dropdown */}
        <div>
          <Label>Sort By</Label>
          <Select
            value={localFilters.sortBy || "default"}
            onValueChange={(value) =>
              updateFilter("sortBy", value === "default" ? undefined : value)
            }
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Featured</SelectItem>
              <SelectItem value="price_asc">Price: Low to High</SelectItem>
              <SelectItem value="price_desc">Price: High to Low</SelectItem>
              <SelectItem value="newest">Newest First</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

