"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ChevronDown } from "lucide-react";
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

export default function HeroSectionWithSearch({ onContactClick }: HeroSectionWithSearchProps = {}) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [transactionType, setTransactionType] = useState<string>("");
  const [propertyType, setPropertyType] = useState<string>("");
  const [listingType, setListingType] = useState<string>("");
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Minimal chips (3-5 max)
  const quickFilters = [
    { id: "rera", label: "RERA" },
    { id: "ready", label: "Ready" },
    { id: "new", label: "New" },
  ];

  const [selectedQuickFilters, setSelectedQuickFilters] = useState<Set<string>>(new Set());

  // Fetch autocomplete suggestions
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      const supabase = createClient();
      const query = searchQuery.toLowerCase();

      // Fetch projects, developers, and micro-markets in parallel
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

      // Add projects
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

      // Add developers
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

      // Add micro-markets
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

  const toggleQuickFilter = (filterId: string) => {
    const newSelected = new Set(selectedQuickFilters);
    if (newSelected.has(filterId)) {
      newSelected.delete(filterId);
    } else {
      newSelected.add(filterId);
    }
    setSelectedQuickFilters(newSelected);
  };

  const handleSearch = () => {
    // Build search URL with query params
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (transactionType) {
      params.set("transaction", transactionType);
    }
    if (propertyType) {
      params.set("type", propertyType);
    }
    if (listingType) {
      params.set("listing_type", listingType);
    }
    if (selectedQuickFilters.has("rera")) {
      params.set("rera", "true");
    }
    if (selectedQuickFilters.has("ready")) {
      params.set("status", "ready");
    }
    if (selectedQuickFilters.has("new")) {
      params.set("listing_type", "new");
    }

    // Navigate to search page
    const searchUrl = `/hyderabad/buy?${params.toString()}`;
    router.push(searchUrl);
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

        {/* World-Class Search Bar - 90% width */}
        <div ref={searchRef} className="w-[90%] max-w-5xl mt-8 relative">
          <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
            {/* Desktop: Single Row Layout */}
            <div className="hidden md:flex items-stretch">
              {/* Search Input - Full Width */}
              <div className="flex-1 relative">
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
                  className="w-full h-14 pl-12 pr-4 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base border-r border-gray-200"
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

              {/* Dropdowns - Left Aligned */}
              <div className="flex items-stretch border-r border-gray-200">
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="w-32 h-14 rounded-none border-0 border-r border-gray-200 focus:ring-0">
                    <SelectValue placeholder="Buy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="w-40 h-14 rounded-none border-0 border-r border-gray-200 focus:ring-0">
                    <SelectValue placeholder="Residential" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="w-32 h-14 rounded-none border-0 focus:ring-0">
                    <SelectValue placeholder="New" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="resale">Resale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button - Right Side */}
              <Button
                onClick={handleSearch}
                className="h-14 px-8 bg-blue-700 hover:bg-blue-800 text-white rounded-none font-semibold text-base min-w-[140px]"
              >
                Search
              </Button>
            </div>

            {/* Mobile: Two-Row Stacked Layout */}
            <div className="md:hidden p-4 space-y-3">
              {/* Search Input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 z-10" />
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
                  className="w-full h-12 pl-10 pr-4 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base border border-gray-200 rounded-lg"
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

              {/* Dropdowns Row */}
              <div className="flex gap-2">
                <Select value={transactionType} onValueChange={setTransactionType}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder="Buy" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="buy">Buy</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={propertyType} onValueChange={setPropertyType}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder="Residential" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="residential">Residential</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={listingType} onValueChange={setListingType}>
                  <SelectTrigger className="h-12 flex-1">
                    <SelectValue placeholder="New" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="resale">Resale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Search Button */}
              <Button
                onClick={handleSearch}
                className="w-full h-12 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-base"
              >
                Search
              </Button>
            </div>

            {/* Minimal Chips Below Input (3-5 max) */}
            <div className="px-4 pb-4 pt-2 border-t border-gray-100">
              <div className="flex flex-wrap gap-2 justify-center">
                {quickFilters.map((filter) => {
                  const isSelected = selectedQuickFilters.has(filter.id);
                  return (
                    <button
                      key={filter.id}
                      onClick={() => toggleQuickFilter(filter.id)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-blue-100 text-blue-700 border border-blue-300"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200"
                      }`}
                    >
                      {filter.label}
                    </button>
                  );
                })}
              </div>
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
