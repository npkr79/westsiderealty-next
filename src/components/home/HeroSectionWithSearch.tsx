"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Building2, Tag, Layers, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface HeroSectionWithSearchProps {
  onContactClick?: () => void;
}

interface SearchSuggestion {
  id: string;
  name: string;
  type: "project" | "developer" | "micro_market";
  url: string;
}

interface LocationOption {
  id: string;
  name: string;
  type: "city" | "micro_market";
  slug: string;
  citySlug?: string;
}

export default function HeroSectionWithSearch({ onContactClick }: HeroSectionWithSearchProps = {}) {
  const router = useRouter();
  const [purpose, setPurpose] = useState<"buy" | "rent" | "invest">("buy");
  const [location, setLocation] = useState<string>("hyderabad");
  const [locationSearch, setLocationSearch] = useState("");
  const [showLocationDropdown, setShowLocationDropdown] = useState(false);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);
  const [category, setCategory] = useState<string>("residential");
  const [context, setContext] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Context options based on category
  const contextOptions = {
    residential: [
      { value: "resale", label: "Resale" },
      { value: "new-project", label: "New Projects" },
    ],
    commercial: [
      { value: "office", label: "Office" },
      { value: "retail", label: "Retail" },
      { value: "coworking", label: "Co-working" },
      { value: "warehouse", label: "Warehouse" },
    ],
    land: [
      { value: "residential-plot", label: "Residential Plot" },
      { value: "commercial-plot", label: "Commercial Plot" },
      { value: "agricultural", label: "Agricultural" },
    ],
  };

  // Load initial locations on mount
  useEffect(() => {
    const loadInitialLocations = async () => {
      const supabase = createClient();
      const [citiesResult, microMarketsResult] = await Promise.all([
        supabase
          .from("cities")
          .select("id, city_name, url_slug")
          .in("url_slug", ["hyderabad", "goa", "dubai"])
          .eq("page_status", "published")
          .limit(5),
        supabase
          .from("micro_markets")
          .select("id, micro_market_name, url_slug, city:cities(url_slug)")
          .eq("status", "published")
          .in("city:cities(url_slug)", ["hyderabad"])
          .limit(10),
      ]);

      const options: LocationOption[] = [];
      if (citiesResult.data) {
        citiesResult.data.forEach((city: any) => {
          options.push({
            id: city.id,
            name: city.city_name,
            type: "city",
            slug: city.url_slug,
          });
        });
      }
      if (microMarketsResult.data) {
        microMarketsResult.data.forEach((mm: any) => {
          const citySlug = Array.isArray(mm.city) ? mm.city[0]?.url_slug : mm.city?.url_slug;
          options.push({
            id: mm.id,
            name: mm.micro_market_name,
            type: "micro_market",
            slug: mm.url_slug,
            citySlug: citySlug,
          });
        });
      }
      setLocationOptions(options);
    };
    loadInitialLocations();
  }, []);

  // Fetch cities and micro-markets for location dropdown (when searching)
  useEffect(() => {
    if (locationSearch.length < 1) {
      // Don't fetch if no search query - use initial locations
      return;
    }

    const fetchLocations = async () => {
      const supabase = createClient();
      const query = locationSearch.toLowerCase();

      const [citiesResult, microMarketsResult] = await Promise.all([
        supabase
          .from("cities")
          .select("id, city_name, url_slug")
          .ilike("city_name", `%${query}%`)
          .eq("page_status", "published")
          .limit(5),
        supabase
          .from("micro_markets")
          .select("id, micro_market_name, url_slug, city:cities(url_slug)")
          .ilike("micro_market_name", `%${query}%`)
          .eq("status", "published")
          .limit(10),
      ]);

      const options: LocationOption[] = [];
      if (citiesResult.data) {
        citiesResult.data.forEach((city: any) => {
          options.push({
            id: city.id,
            name: city.city_name,
            type: "city",
            slug: city.url_slug,
          });
        });
      }
      if (microMarketsResult.data) {
        microMarketsResult.data.forEach((mm: any) => {
          const citySlug = Array.isArray(mm.city) ? mm.city[0]?.url_slug : mm.city?.url_slug;
          options.push({
            id: mm.id,
            name: mm.micro_market_name,
            type: "micro_market",
            slug: mm.url_slug,
            citySlug: citySlug,
          });
        });
      }
      setLocationOptions(options);
    };

    const debounceTimer = setTimeout(fetchLocations, 200);
    return () => clearTimeout(debounceTimer);
  }, [locationSearch]);

  // Fetch autocomplete suggestions for search input
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const supabase = createClient();
      const query = searchQuery.toLowerCase();

      const [projectsResult, developersResult, microMarketsResult] = await Promise.all([
        supabase
          .from("projects")
          .select("id, project_name, url_slug, city:cities(url_slug), micro_market:micro_markets!projects_micromarket_id_fkey(url_slug)")
          .ilike("project_name", `%${query}%`)
          .eq("is_published", true)
          .limit(5),
        supabase
          .from("developers")
          .select("id, developer_name, url_slug")
          .ilike("developer_name", `%${query}%`)
          .eq("is_published", true)
          .limit(3),
        supabase
          .from("micro_markets")
          .select("id, micro_market_name, url_slug, city:cities(url_slug)")
          .ilike("micro_market_name", `%${query}%`)
          .eq("status", "published")
          .limit(3),
      ]);

      const suggestionsList: SearchSuggestion[] = [];

      if (projectsResult.data) {
        projectsResult.data.forEach((p: any) => {
          const citySlug = Array.isArray(p.city) ? p.city[0]?.url_slug : p.city?.url_slug;
          const microMarketSlug = Array.isArray(p.micro_market) 
            ? p.micro_market[0]?.url_slug 
            : p.micro_market?.url_slug;
          
          const url = microMarketSlug && citySlug
            ? `/${citySlug}/${microMarketSlug}/projects/${p.url_slug}`
            : citySlug
            ? `/${citySlug}/projects/${p.url_slug}`
            : null;

          if (url) {
            suggestionsList.push({
              id: p.id,
              name: p.project_name,
              type: "project",
              url,
            });
          }
        });
      }

      if (developersResult.data) {
        developersResult.data.forEach((d: any) => {
          suggestionsList.push({
            id: d.id,
            name: d.developer_name,
            type: "developer",
            url: `/developers/${d.url_slug}`,
          });
        });
      }

      if (microMarketsResult.data) {
        microMarketsResult.data.forEach((mm: any) => {
          const citySlug = Array.isArray(mm.city) ? mm.city[0]?.url_slug : mm.city?.url_slug;
          if (citySlug) {
            suggestionsList.push({
              id: mm.id,
              name: mm.micro_market_name,
              type: "micro_market",
              url: `/${citySlug}/${mm.url_slug}`,
            });
          }
        });
      }

      setSuggestions(suggestionsList);
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Reset context when category changes
  useEffect(() => {
    setContext("");
  }, [category]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
      if (locationRef.current && !locationRef.current.contains(event.target as Node)) {
        setShowLocationDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocationSelect = (option: LocationOption) => {
    setLocation(option.slug);
    setLocationSearch(option.name);
    setShowLocationDropdown(false);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Map purpose to transaction type
    if (purpose === "rent") {
      params.set("transaction", "rent");
    } else if (purpose === "invest") {
      params.set("transaction", "invest");
    }
    
    // Map category to property type
    if (category === "residential") {
      params.set("type", "residential");
    } else if (category === "commercial") {
      params.set("type", "commercial");
    } else if (category === "land") {
      params.set("type", "land");
    }
    
    // Map context
    if (context) {
      if (category === "residential") {
        if (context === "resale") {
          params.set("isResale", "true");
        } else if (context === "new-project") {
          params.set("listing_type", "new");
        }
      } else if (category === "commercial") {
        params.set("propertyType", context);
      }
    }
    
    // Add search query
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    // Determine city from location
    const selectedLoc = locationOptions.find(opt => opt.slug === location);
    const citySlug = selectedLoc?.type === "micro_market" 
      ? selectedLoc.citySlug || "hyderabad"
      : location || "hyderabad";
    
    // Route to city buy page with params
    router.push(`/${citySlug}/buy?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(suggestion.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setShowLocationDropdown(false);
    }
  };

  // Get selected location display name
  const getLocationDisplayName = () => {
    const selected = locationOptions.find(opt => opt.slug === location);
    if (selected) return selected.name;
    // Default to Hyderabad if not found
    if (location === "hyderabad" || !location) return "Hyderabad";
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  return (
    <section className="relative overflow-hidden bg-gradient-to-r from-pink-100/50 via-blue-50 to-blue-100/50 py-20">
      <div className="container mx-auto px-4 flex flex-col items-center text-center space-y-6">
        <h1 className="text-4xl md:text-5xl font-bold leading-tight max-w-3xl text-gray-900">
          Premium Real Estate Advisory in{" "}
          <span className="text-blue-700 font-bold">Hyderabad, Goa & Dubai</span>
        </h1>
        <p className="max-w-2xl text-lg text-gray-600">
          Discover premium resale homes, luxury villas, and investment properties with trusted experts by your side.
        </p>

        {/* Purpose Tabs */}
        <div className="flex gap-6 text-sm font-light uppercase tracking-wider">
          <button
            onClick={() => setPurpose("buy")}
            className={`pb-2 transition-colors ${
              purpose === "buy"
                ? "text-blue-700 border-b-2 border-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Buy
          </button>
          <button
            onClick={() => setPurpose("rent")}
            className={`pb-2 transition-colors ${
              purpose === "rent"
                ? "text-blue-700 border-b-2 border-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Rent / Lease
          </button>
          <button
            onClick={() => setPurpose("invest")}
            className={`pb-2 transition-colors ${
              purpose === "invest"
                ? "text-blue-700 border-b-2 border-blue-700 font-medium"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Invest
          </button>
        </div>

        {/* Main Search Bar - Single Pill */}
        <div ref={searchRef} className="w-full max-w-5xl mt-4 relative">
          <div className="bg-white rounded-full shadow-2xl border border-gray-200 overflow-hidden">
            {/* Desktop: Single Row Layout */}
            <div className="hidden md:flex items-stretch h-14">
              {/* Segment 1: Location */}
              <div ref={locationRef} className="relative flex-shrink-0 border-r border-gray-200">
                  <button
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="h-full px-6 flex items-center gap-2 hover:bg-gray-50 transition-colors min-w-[180px]"
                  >
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900">
                      {getLocationDisplayName()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400 ml-auto" />
                  </button>
                {showLocationDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search location..."
                        value={locationSearch}
                        onChange={(e) => {
                          setLocationSearch(e.target.value);
                          setShowLocationDropdown(true);
                        }}
                        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        autoFocus
                      />
                    </div>
                    {locationOptions.map((option) => (
                      <button
                        key={`${option.type}-${option.id}`}
                        onClick={() => handleLocationSelect(option)}
                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{option.name}</p>
                            <p className="text-xs text-gray-500 capitalize">
                              {option.type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Segment 2: Category */}
              <div className="flex-shrink-0 border-r border-gray-200">
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-14 rounded-none border-0 focus:ring-0 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-gray-500" />
                      <SelectValue placeholder="Residential" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Open Plots/Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Segment 3: Context */}
              <div className="flex-shrink-0 border-r border-gray-200">
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger className="h-14 rounded-none border-0 focus:ring-0 min-w-[160px]">
                    <div className="flex items-center gap-2">
                      <Layers className="w-4 h-4 text-gray-500" />
                      <SelectValue placeholder={category === "residential" ? "Resale" : category === "commercial" ? "Office" : "Residential Plot"} />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {contextOptions[category as keyof typeof contextOptions]?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Segment 4: Free Text Search */}
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder="Search by project, developer, micro market..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onKeyDown={handleKeyDown}
                  className="w-full h-14 pl-12 pr-4 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSuggestions(false);
                      inputRef.current?.focus();
                    }}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute z-50 left-0 right-0 mt-1 bg-white rounded-lg shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
                    {suggestions.map((suggestion) => (
                      <button
                        key={`${suggestion.type}-${suggestion.id}`}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-6 py-4 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <Search className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="font-medium text-gray-900">{suggestion.name}</p>
                            <p className="text-sm text-gray-500 capitalize">
                              {suggestion.type.replace("_", " ")}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="h-14 px-8 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-semibold text-base min-w-[120px]"
              >
                Search
              </Button>
            </div>

            {/* Mobile: Two-Row Stacked Layout */}
            <div className="md:hidden p-3 space-y-3">
              {/* Row 1: Location + Category */}
              <div className="flex gap-2">
                <div ref={locationRef} className="flex-1 relative">
                  <button
                    onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                    className="w-full h-12 px-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                  >
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <span className="text-sm font-medium text-gray-900 flex-1 text-left">
                      {getLocationDisplayName()}
                    </span>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>
                  {showLocationDropdown && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
                      <div className="p-2">
                        <input
                          type="text"
                          placeholder="Search location..."
                          value={locationSearch}
                          onChange={(e) => setLocationSearch(e.target.value)}
                          className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md mb-2"
                        />
                      </div>
                      {locationOptions.map((option) => (
                        <button
                          key={`${option.type}-${option.id}`}
                          onClick={() => handleLocationSelect(option)}
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100"
                        >
                          {option.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder="Residential" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Open Plots/Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Context + Search Input + Button */}
              <div className="flex gap-2">
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder="Resale" />
                  </SelectTrigger>
                  <SelectContent>
                    {contextOptions[category as keyof typeof contextOptions]?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onKeyDown={handleKeyDown}
                    className="w-full h-12 pl-10 pr-4 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm border border-gray-200 rounded-lg"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  className="h-12 px-6 bg-blue-700 hover:bg-blue-800 text-white font-semibold"
                >
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Contact Button */}
        <div className="flex flex-wrap gap-4 justify-center mt-4">
          <Button
            size="lg"
            className="bg-blue-700 hover:bg-blue-800 text-white rounded-full px-8 py-6 text-lg"
            onClick={onContactClick}
          >
            Talk to an Expert
          </Button>
        </div>
      </div>
    </section>
  );
}
