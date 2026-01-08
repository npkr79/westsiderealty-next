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
          .or("status.ilike.published,status.ilike.%under construction%")
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
          // Skip projects without url_slug to avoid broken links
          if (!p.url_slug) return;
          
          const citySlug = Array.isArray(p.city) ? p.city[0]?.url_slug : p.city?.url_slug;
          // Skip if citySlug or url_slug is missing
          if (!citySlug || !p.url_slug) return;
          
          // Use canonical URL format: /citySlug/projects/projectSlug
          const url = `/${citySlug}/projects/${p.url_slug}`;

          suggestionsList.push({
            id: p.id,
            name: p.project_name,
            type: "project",
            url,
          });
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
    const raw = searchQuery.trim();
    const hasSearchText = raw.length > 0;
    
    // PRIORITY 1: Text Input Parsing (if search text exists)
    if (hasSearchText) {
      try {
        // Parse the search query to extract entities
        const parseResponse = await fetch(`/api/search/parse?q=${encodeURIComponent(raw)}`);
        if (parseResponse.ok) {
          const { parsed } = await parseResponse.json();
          if (parsed) {
            // IMPORTANT: ONLY use parsed entities, IGNORE ALL dropdown selections
            // Only add parameters that have actual parsed values (explicitly stated)
            
            // Property Type from text (only if explicitly mentioned)
            if (parsed.propertyType) {
              params.set("propertyTypes", parsed.propertyType);
            }
            
            // Project Name from text (only if explicitly mentioned)
            if (parsed.projectName) {
              params.set("projectName", parsed.projectName);
            }
            
            // Micro Market from text (only if explicitly mentioned)
            if (parsed.microMarket) {
              params.set("microMarket", parsed.microMarket);
            }
            
            // BHK configuration from text (only if explicitly mentioned)
            if (parsed.bhkConfig) {
              params.set("bhk", parsed.bhkConfig);
            }
            
            // Developer from text (only if explicitly mentioned)
            if (parsed.developer) {
              params.set("developer", parsed.developer);
            }
            
            // Completion status from text (ONLY if explicitly mentioned)
            // Do not infer or assume any completion status - ONLY add if parser found it
            // CRITICAL: Only add if parsed.completionStatus is truthy and not empty
            if (parsed.completionStatus && parsed.completionStatus.trim().length > 0) {
              params.set("completionStatus", parsed.completionStatus);
            }
            // DO NOT add isNewProject or any other inferred status
            
            // Check if we have any structured params
            const hasStructured = Array.from(params.keys()).length > 0;
            
            if (hasStructured) {
              // Route to search page with ONLY text-derived structured params (no 'q')
              router.push(`/search?${params.toString()}`);
            } else {
              // Fallback: use raw query if no structured params were extracted
              router.push(`/search?q=${encodeURIComponent(raw)}`);
            }
            return;
          }
        }
        
        // If parsing failed, still don't add dropdown params
        // Just navigate with empty params or raw query as fallback
        if (raw.length > 0) {
          params.set("q", raw);
        }
        router.push(`/search?${params.toString()}`);
        return;
      } catch (error) {
        console.error("[TabbedSearch] Error parsing query:", error);
        // Fallback: use raw query only
        params.set("q", raw);
        router.push(`/search?${params.toString()}`);
        return;
      }
    }
    
    // PRIORITY 2: Dropdown Selections (when no search text)
    // Only include params that user explicitly selected (not defaults)
    params.set("city", city);
    params.set("category", activeTab);
    
    // Map type to projectType
    if (type) {
      if (type === "new-project") {
        params.set("projectType", "new");
      } else if (type === "resale") {
        params.set("projectType", "resale");
      } else {
        params.set("projectType", type);
      }
    }
    
    // Checkbox-selected property types
    if (selectedPropertyTypes.size > 0) {
      params.set("propertyTypes", Array.from(selectedPropertyTypes).join(","));
    }
    
    // Route to search page
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
    <div ref={searchRef} className="w-full max-w-4xl mx-auto mt-0 sm:mt-8 relative">
      {/* Tabs - Lightweight with underline */}
      <div className="flex gap-6 border-b border-gray-100 mb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setActiveTab("residential")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "residential"
              ? "text-blue-600 border-blue-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Residential
        </button>
        <button
          onClick={() => setActiveTab("commercial")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "commercial"
              ? "text-blue-600 border-blue-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Commercial
        </button>
        <button
          onClick={() => setActiveTab("land")}
          className={`pb-3 px-2 text-sm font-medium whitespace-nowrap transition-colors border-b-2 ${
            activeTab === "land"
              ? "text-blue-600 border-blue-600"
              : "text-gray-500 border-transparent hover:text-gray-700"
          }`}
        >
          Open Plots/Lands
        </button>
      </div>

      {/* Search Container - Lightweight modern design */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 md:p-5 relative shadow-sm">
        {/* Dropdowns Row - Side by side on mobile, no Labels */}
        <div className="grid grid-cols-2 md:grid-cols-2 gap-3 mb-3">
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
            className="w-full h-11 md:h-12 pl-10 md:pl-12 pr-4 bg-white rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm md:text-base border border-gray-200 transition-all"
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
          className="w-full h-11 md:h-12 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm md:text-base rounded-lg shadow-sm"
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
