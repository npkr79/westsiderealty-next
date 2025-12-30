"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
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
  const [selectedChips, setSelectedChips] = useState<Set<string>>(new Set());
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter chips
  const filterChips = [
    { id: "residential", label: "Residential" },
    { id: "commercial", label: "Commercial" },
    { id: "buy", label: "Buy" },
    { id: "rent", label: "Rent" },
    { id: "new", label: "New" },
    { id: "resale", label: "Resale" },
    { id: "rera", label: "RERA" },
    { id: "ready", label: "Ready" },
    { id: "under-construction", label: "Under Construction" },
  ];

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

  const toggleChip = (chipId: string) => {
    const newSelected = new Set(selectedChips);
    if (newSelected.has(chipId)) {
      newSelected.delete(chipId);
    } else {
      newSelected.add(chipId);
    }
    setSelectedChips(newSelected);
  };

  const handleSearch = () => {
    if (!searchQuery.trim() && selectedChips.size === 0) return;

    // Build search URL with query params
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set("q", searchQuery.trim());
    }
    if (selectedChips.size > 0) {
      const chipsArray = Array.from(selectedChips);
      if (chipsArray.includes("residential") || chipsArray.includes("commercial")) {
        params.set("type", chipsArray.find(c => c === "residential" || c === "commercial") || "");
      }
      if (chipsArray.includes("buy") || chipsArray.includes("rent")) {
        params.set("transaction", chipsArray.find(c => c === "buy" || c === "rent") || "");
      }
      if (chipsArray.includes("new") || chipsArray.includes("resale")) {
        params.set("listing_type", chipsArray.find(c => c === "new" || c === "resale") || "");
      }
      if (chipsArray.includes("rera")) {
        params.set("rera", "true");
      }
      if (chipsArray.includes("ready")) {
        params.set("status", "ready");
      }
      if (chipsArray.includes("under-construction")) {
        params.set("status", "under-construction");
      }
    }

    // Navigate to search page or properties page
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

        {/* World-Class Search Bar */}
        <div ref={searchRef} className="w-full max-w-4xl mt-8 relative">
          <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 relative">
            {/* Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
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
                className="w-full pl-12 pr-4 py-4 bg-gray-50 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white text-lg border border-gray-200"
              />
              {searchQuery && (
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setShowSuggestions(false);
                    inputRef.current?.focus();
                  }}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Filter Chips - 2 Rows */}
            <div className="flex flex-wrap gap-2 mb-4">
              {filterChips.map((chip) => {
                const isSelected = selectedChips.has(chip.id);
                return (
                  <button
                    key={chip.id}
                    onClick={() => toggleChip(chip.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-blue-600 text-white shadow-md"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>

            {/* Search Button */}
            <Button
              onClick={handleSearch}
              size="lg"
              className="w-full bg-blue-700 hover:bg-blue-800 text-white rounded-xl py-6 text-lg font-semibold shadow-lg"
            >
              Search Properties
            </Button>

            {/* Autocomplete Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-200 max-h-96 overflow-y-auto">
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
