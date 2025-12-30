"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, MapPin, Building2, Layers, ChevronDown } from "lucide-react";
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
  type: "city" | "micro_market" | "developer";
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
    ],
    land: [
      { value: "residential-plot", label: "Residential Plot" },
      { value: "commercial-plot", label: "Commercial Plot" },
    ],
  };

  // Load initial locations on mount
  useEffect(() => {
    const loadInitialLocations = async () => {
      const supabase = createClient();
      const [citiesResult, microMarketsResult, developersResult] = await Promise.all([
        supabase
          .from("cities")
          .select("id, city_name, url_slug")
          .in("url_slug", ["hyderabad", "goa"])
          .eq("page_status", "published")
          .limit(5),
        supabase
          .from("micro_markets")
          .select("id, micro_market_name, url_slug, city:cities(url_slug)")
          .eq("status", "published")
          .in("city:cities(url_slug)", ["hyderabad"])
          .limit(10),
        supabase
          .from("developers")
          .select("id, developer_name, url_slug")
          .eq("is_published", true)
          .limit(5),
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
      if (developersResult.data) {
        developersResult.data.forEach((dev: any) => {
          options.push({
            id: dev.id,
            name: dev.developer_name,
            type: "developer",
            slug: dev.url_slug,
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
      return;
    }

    const fetchLocations = async () => {
      const supabase = createClient();
      const query = locationSearch.toLowerCase();

      const [citiesResult, microMarketsResult, developersResult] = await Promise.all([
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
        supabase
          .from("developers")
          .select("id, developer_name, url_slug")
          .ilike("developer_name", `%${query}%`)
          .eq("is_published", true)
          .limit(5),
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
      if (developersResult.data) {
        developersResult.data.forEach((dev: any) => {
          options.push({
            id: dev.id,
            name: dev.developer_name,
            type: "developer",
            slug: dev.url_slug,
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
    
    if (purpose === "rent") {
      params.set("transaction", "rent");
    } else if (purpose === "invest") {
      params.set("transaction", "invest");
    }
    
    if (category === "residential") {
      params.set("type", "residential");
    } else if (category === "commercial") {
      params.set("type", "commercial");
    } else if (category === "land") {
      params.set("type", "land");
    }
    
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
    
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    const selectedLoc = locationOptions.find(opt => opt.slug === location);
    const citySlug = selectedLoc?.type === "micro_market" 
      ? selectedLoc.citySlug || "hyderabad"
      : selectedLoc?.type === "developer"
      ? "hyderabad"
      : location || "hyderabad";
    
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

  const getLocationDisplayName = () => {
    const selected = locationOptions.find(opt => opt.slug === location);
    if (selected) return selected.name;
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

        {/* 99ACRES-STYLE: ONE GIANT SEARCH BAR */}
        <div ref={searchRef} className="w-[95%] max-w-4xl mt-8 relative">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6">
            {/* Search Input - Full Width */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search projects, developers, micro markets..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className="w-full h-12 md:h-14 pl-12 pr-4 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-base border border-gray-200"
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
            </div>

            {/* Dropdowns Row - INSIDE the bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {/* Location Dropdown */}
              <div ref={locationRef} className="relative">
                <button
                  onClick={() => setShowLocationDropdown(!showLocationDropdown)}
                  className="w-full h-12 px-4 flex items-center gap-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <MapPin className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  <span className="text-gray-900 font-medium truncate text-left flex-1">
                    {getLocationDisplayName()}
                  </span>
                  <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                </button>
                {showLocationDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-64 overflow-y-auto">
                    <div className="p-2">
                      <input
                        type="text"
                        placeholder="Search location..."
                        value={locationSearch}
                        onChange={(e) => setLocationSearch(e.target.value)}
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
                            <p className="font-medium text-gray-900 text-sm">{option.name}</p>
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

              {/* Category Dropdown */}
              <div>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger className="h-12 border border-gray-200 focus:ring-2 focus:ring-blue-500">
                    <div className="flex items-center gap-2 w-full">
                      <Building2 className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <SelectValue placeholder="Residential" className="text-sm" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Open Plots</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Context Dropdown */}
              <div>
                <Select value={context} onValueChange={setContext}>
                  <SelectTrigger className="h-12 border border-gray-200 focus:ring-2 focus:ring-blue-500">
                    <div className="flex items-center gap-2 w-full">
                      <Layers className="w-4 h-4 text-gray-500 flex-shrink-0" />
                      <SelectValue 
                        placeholder={
                          category === "residential" ? "Resale" : 
                          category === "commercial" ? "Office" : 
                          "Residential Plot"
                        }
                        className="text-sm"
                      />
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

              {/* Search Button - Right Side */}
              <Button
                onClick={handleSearch}
                className="h-12 w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base rounded-lg"
              >
                Search
              </Button>
            </div>

            {/* Autocomplete Suggestions */}
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

          {/* Bottom Chips: Buy | Rent/Lease | Invest */}
          <div className="flex gap-4 justify-center mt-4">
            <button
              onClick={() => setPurpose("buy")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                purpose === "buy"
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Buy
            </button>
            <button
              onClick={() => setPurpose("rent")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                purpose === "rent"
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Rent / Lease
            </button>
            <button
              onClick={() => setPurpose("invest")}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all ${
                purpose === "invest"
                  ? "bg-blue-700 text-white shadow-md"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200"
              }`}
            >
              Invest
            </button>
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
