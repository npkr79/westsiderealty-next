"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronDown, MapPin, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";
import { parseSearchQuery } from "@/lib/search/queryParser";

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

type TabType = "residential" | "commercial" | "land";

interface PropertyTypeOption {
  id: string;
  label: string;
  value: string;
}

export default function TabbedSearch() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("residential");
  const [city, setCity] = useState<string>("hyderabad");
  const [type, setType] = useState<string>("resale");
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedPropertyTypes, setSelectedPropertyTypes] = useState<Set<string>>(new Set());
  const [showMoreTypes, setShowMoreTypes] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [locationOptions, setLocationOptions] = useState<LocationOption[]>([]);

  // Property type options by tab
  const propertyTypeOptions: Record<TabType, PropertyTypeOption[]> = {
    residential: [
      { id: "apartment", label: "Apartment/Flat", value: "apartment" },
      { id: "standalone", label: "Standalone Apartment", value: "standalone" },
      { id: "independent-house", label: "Independent House", value: "independent-house" },
      { id: "villa", label: "Villa", value: "villa" },
    ],
    commercial: [
      { id: "office", label: "Office Space", value: "office" },
      { id: "retail", label: "Retail Space", value: "retail" },
      { id: "serviced", label: "Serviced", value: "serviced" },
      { id: "coworking", label: "Co-working", value: "coworking" },
    ],
    land: [
      { id: "residential-plot", label: "Residential Plot", value: "residential-plot" },
      { id: "commercial-plot", label: "Commercial Plot", value: "commercial-plot" },
      { id: "gated-plot", label: "Gated Plots", value: "gated-plot" },
      { id: "agricultural", label: "Agricultural", value: "agricultural" },
    ],
  };

  // Type dropdown options by tab
  const typeOptions: Record<TabType, { value: string; label: string }[]> = {
    residential: [
      { value: "resale", label: "Resale" },
      { value: "new-project", label: "New Projects" },
      { value: "invest", label: "Invest" },
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

  // Load initial locations
  useEffect(() => {
    const loadLocations = async () => {
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
    loadLocations();
  }, []);

  // Reset type and property types when tab changes
  useEffect(() => {
    const defaultType = typeOptions[activeTab][0]?.value || "";
    setType(defaultType);
    setSelectedPropertyTypes(new Set());
    setShowMoreTypes(false);
  }, [activeTab]);

  // Fetch autocomplete suggestions
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

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const togglePropertyType = (typeId: string) => {
    const newSelected = new Set(selectedPropertyTypes);
    if (newSelected.has(typeId)) {
      newSelected.delete(typeId);
    } else {
      newSelected.add(typeId);
    }
    setSelectedPropertyTypes(newSelected);
  };

  const handleSearch = async () => {
    const params = new URLSearchParams();
    
    // 1. Add UI-selected filters (these are explicit user choices)
    params.set("city", city);
    params.set("category", activeTab);
    
    // Map type to projectType (resale vs new-project)
    if (type) {
      if (type === "new-project") {
        params.set("projectType", "new");
      } else if (type === "resale") {
        params.set("projectType", "resale");
      } else {
        // For other types like "invest", "office", etc., pass as-is
        params.set("projectType", type);
      }
    }
    
    // Add checkbox-selected property types
    if (selectedPropertyTypes.size > 0) {
      params.set("propertyTypes", Array.from(selectedPropertyTypes).join(","));
    }
    
    // 2. Parse text input for additional entities
    if (searchQuery.trim()) {
      try {
        // For client-side, we'll call the API route to parse the query
        // This avoids type issues with client vs server Supabase clients
        const parseResponse = await fetch(`/api/search/parse?q=${encodeURIComponent(searchQuery.trim())}`);
        if (parseResponse.ok) {
          const { parsed } = await parseResponse.json();
          
          if (parsed) {
            // Add parsed micro-market (only if not already filtered by UI)
            if (parsed.microMarket) {
              params.set("microMarket", parsed.microMarket);
            }
            
            // Add parsed BHK configuration
            if (parsed.bhkConfig) {
              params.set("bhk", parsed.bhkConfig);
            }
            
            // Add parsed developer
            if (parsed.developer) {
              params.set("developer", parsed.developer);
            }
            
            // Handle completion status from text
            if (parsed.completionStatus) {
              // Specific status like "New Launch"
              params.set("completionStatus", parsed.completionStatus);
            } else if (parsed.isNewProject) {
              // Generic "new projects" indicator
              params.set("isNewProject", "true");
            }
            
            // IMPORTANT: If text mentions property type, it OVERRIDES checkbox selection
            // Only if no checkboxes are selected
            if (parsed.propertyType && selectedPropertyTypes.size === 0) {
              params.set("propertyTypes", parsed.propertyType);
            }
            // If both checkbox and parsed propertyType exist, checkbox takes precedence
            // (checkbox value is already added above at line 284)
            
            // Keep remaining unparsed text for full-text search
            // Only add if there's meaningful content (more than just common words)
            if (parsed.remainingQuery && parsed.remainingQuery.trim()) {
              const meaningfulWords = parsed.remainingQuery.trim().split(/\s+/).filter(
                word => word.length > 2 && !['in', 'at', 'near', 'the', 'a', 'an', 'of', 'for', 'with'].includes(word.toLowerCase())
              );
              if (meaningfulWords.length > 0) {
                params.set("q", meaningfulWords.join(' '));
              }
              // If only common words remain, don't add q param
            }
          } else {
            // If parsing returned null, use original query
            params.set("q", searchQuery.trim());
          }
        } else {
          // If parsing failed, use original query
          params.set("q", searchQuery.trim());
        }
      } catch (error) {
        console.error("[TabbedSearch] Error parsing query:", error);
        // Fallback: just use the raw query
        params.set("q", searchQuery.trim());
      }
    }
    
    // Route to search page with all merged filters
    router.push(`/search?${params.toString()}`);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    router.push(suggestion.url);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
    }
  };


  const visibleTypes = propertyTypeOptions[activeTab].slice(0, 4);
  const moreTypes = propertyTypeOptions[activeTab].slice(4);

  return (
    <div ref={searchRef} className="w-full max-w-4xl mx-auto mt-8 relative">
      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("residential")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "residential"
              ? "text-blue-700 border-blue-700"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Residential
        </button>
        <button
          onClick={() => setActiveTab("commercial")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "commercial"
              ? "text-blue-700 border-blue-700"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Commercial
        </button>
        <button
          onClick={() => setActiveTab("land")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "land"
              ? "text-blue-700 border-blue-700"
              : "text-gray-600 border-transparent hover:text-gray-900"
          }`}
        >
          Open Plots/Lands
        </button>
      </div>

      {/* Search Container - Lightweight */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-5 relative">
        {/* Dropdowns Row - No Labels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* City Dropdown */}
          <Select value={city} onValueChange={setCity}>
            <SelectTrigger className="h-11 w-full">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder="Hyderabad" />
              </div>
            </SelectTrigger>
            <SelectContent>
              {locationOptions
                .filter(opt => opt.type === "city")
                .map((option) => (
                  <SelectItem key={option.id} value={option.slug}>
                    {option.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          {/* Type Dropdown */}
          <Select value={type} onValueChange={setType}>
            <SelectTrigger className="h-11 w-full">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gray-500" />
                <SelectValue placeholder={typeOptions[activeTab][0]?.label || "Select"} />
              </div>
            </SelectTrigger>
            <SelectContent>
              {typeOptions[activeTab].map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Search Input */}
        <div className="relative mb-2">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 md:w-5 md:h-5 z-10" />
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
            className="w-full h-11 md:h-12 pl-10 md:pl-12 pr-4 bg-gray-50 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-sm md:text-base border border-gray-200"
          />
          {searchQuery && (
            <button
              onClick={() => {
                setSearchQuery("");
                setShowSuggestions(false);
                inputRef.current?.focus();
              }}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Example Text - Left Aligned */}
        <p className="text-xs text-gray-500 mb-3 text-left">
          Ex: 3BHK in Kokapet by Godrej...
        </p>

        {/* Property Type Checkboxes - Desktop: 4 cols, Mobile: 2x2 grid */}
        <div className="mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
            {visibleTypes.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-xs md:text-sm"
              >
                <input
                  type="checkbox"
                  checked={selectedPropertyTypes.has(option.id)}
                  onChange={() => togglePropertyType(option.id)}
                  className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                />
                <span className="text-gray-700 truncate">{option.label}</span>
              </label>
            ))}
          </div>
          {moreTypes.length > 0 && (
            <div className="mt-2">
              {showMoreTypes && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
                  {moreTypes.map((option) => (
                    <label
                      key={option.id}
                      className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors text-xs md:text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPropertyTypes.has(option.id)}
                        onChange={() => togglePropertyType(option.id)}
                        className="w-3.5 h-3.5 md:w-4 md:h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                      />
                      <span className="text-gray-700 truncate">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}
              <button
                onClick={() => setShowMoreTypes(!showMoreTypes)}
                className="mt-2 px-3 py-1.5 text-xs md:text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                {showMoreTypes ? "Less" : "More"}
              </button>
            </div>
          )}
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full h-11 md:h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm md:text-base rounded-lg"
        >
          Search Properties
        </Button>

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
    </div>
  );
}
