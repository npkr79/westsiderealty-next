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
      { id: "villa", label: "Villa", value: "villa" },
      { id: "standalone", label: "Standalone Apartment", value: "standalone" },
      { id: "independent-house", label: "Independent House", value: "independent-house" },
    ],
    commercial: [
      { id: "office", label: "Office Space", value: "office" },
      { id: "retail", label: "Retail Space", value: "retail" },
      { id: "serviced", label: "Serviced", value: "serviced" },
      { id: "coworking", label: "Co-working", value: "coworking" },
    ],
    land: [
      { id: "open-plot", label: "Open Plots", value: "open-plot" },
      { id: "gated-plot", label: "Gated Plots", value: "gated-plot" },
      { id: "agricultural", label: "Agricultural", value: "agricultural" },
      { id: "residential-plot", label: "Residential Plot", value: "residential-plot" },
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

  const handleSearch = () => {
    const params = new URLSearchParams();
    
    // Map tab to category
    if (activeTab === "residential") {
      params.set("type", "residential");
    } else if (activeTab === "commercial") {
      params.set("type", "commercial");
    } else if (activeTab === "land") {
      params.set("type", "land");
    }
    
    // Map type
    if (type) {
      if (activeTab === "residential") {
        if (type === "resale") {
          params.set("isResale", "true");
        } else if (type === "new-project") {
          params.set("listing_type", "new");
        }
      } else if (activeTab === "commercial") {
        params.set("propertyType", type);
      }
    }
    
    // Add search query
    if (searchQuery.trim()) {
      params.set("search", searchQuery.trim());
    }
    
    // Add property types
    if (selectedPropertyTypes.size > 0) {
      params.set("types", Array.from(selectedPropertyTypes).join(","));
    }
    
    // Route to city buy page
    router.push(`/${city}/buy?${params.toString()}`);
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

      {/* Search Container */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 md:p-6 relative">
        {/* Dropdowns Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* City Dropdown */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">City</label>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-12 w-full">
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
          </div>

          {/* Type Dropdown */}
          <div>
            <label className="block text-xs text-gray-600 mb-2">
              {activeTab === "residential" ? "Type" : activeTab === "commercial" ? "Property Type" : "Plot Type"}
            </label>
            <Select value={type} onValueChange={setType}>
              <SelectTrigger className="h-12 w-full">
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
        </div>

        {/* Search Input */}
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
          <p className="text-xs text-gray-500 mt-2 ml-1">
            Ex: 3BHK in Kokapet by Godrej...
          </p>
        </div>

        {/* Property Type Checkboxes */}
        <div className="mb-4">
          <label className="block text-xs text-gray-600 mb-3">Property Types</label>
          <div className="flex flex-wrap gap-3">
            {visibleTypes.map((option) => (
              <label
                key={option.id}
                className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedPropertyTypes.has(option.id)}
                  onChange={() => togglePropertyType(option.id)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">{option.label}</span>
              </label>
            ))}
            {moreTypes.length > 0 && (
              <>
                {showMoreTypes && moreTypes.map((option) => (
                  <label
                    key={option.id}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPropertyTypes.has(option.id)}
                      onChange={() => togglePropertyType(option.id)}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">{option.label}</span>
                  </label>
                ))}
                <button
                  onClick={() => setShowMoreTypes(!showMoreTypes)}
                  className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {showMoreTypes ? "Less" : "More"}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Search Button */}
        <Button
          onClick={handleSearch}
          className="w-full h-12 md:h-14 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base rounded-lg"
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
