"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { X } from "lucide-react";
import type { UnifiedPropertyFilters, CitySlug } from "@/types/unifiedProperty";

interface PropertyFiltersProps {
  citySlug: CitySlug;
  filters: UnifiedPropertyFilters;
  onFiltersChange: (filters: UnifiedPropertyFilters) => void;
  onReset: () => void;
  maxPrice?: number;
}

export default function PropertyFilters({
  citySlug,
  filters,
  onFiltersChange,
  onReset,
  maxPrice = 500000000,
}: PropertyFiltersProps) {
  const [localFilters, setLocalFilters] = useState<UnifiedPropertyFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const updateFilter = (key: keyof UnifiedPropertyFilters, value: any) => {
    const updated = { ...localFilters, [key]: value };
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const removeFilter = (key: keyof UnifiedPropertyFilters) => {
    const updated = { ...localFilters };
    delete updated[key];
    setLocalFilters(updated);
    onFiltersChange(updated);
  };

  const parsePriceRange = (range: string): [number, number | null] => {
    switch (range) {
      case '0-50L': return [0, 5000000];
      case '50L-1Cr': return [5000000, 10000000];
      case '1-2Cr': return [10000000, 20000000];
      case '2-5Cr': return [20000000, 50000000];
      case '5Cr+': return [50000000, null];
      default: return [0, null];
    }
  };

  const formatPrice = (price: number): string => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(1)} Cr`;
    } else {
      return `₹${(price / 100000).toFixed(0)} L`;
    }
  };

  return (
    <Card className="sticky top-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Filters</CardTitle>
          <Button variant="ghost" size="sm" onClick={onReset}>
            Reset
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Search */}
        <div>
          <Label htmlFor="search">Search</Label>
          <Input
            id="search"
            placeholder="Search properties..."
            value={localFilters.searchQuery || ''}
            onChange={(e) => updateFilter('searchQuery', e.target.value || undefined)}
          />
        </div>

        {/* Property Type */}
        <div>
          <Label>Property Type</Label>
          <Select
            value={localFilters.propertyType || 'all'}
            onValueChange={(value) => updateFilter('propertyType', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="Apartment">Apartment</SelectItem>
              <SelectItem value="Villa">Villa</SelectItem>
              <SelectItem value="Plot">Plot</SelectItem>
              <SelectItem value="Farmhouse">Farmhouse</SelectItem>
              {citySlug === 'goa' && (
                <>
                  <SelectItem value="Holiday Home">Holiday Home</SelectItem>
                  <SelectItem value="Beach Villa">Beach Villa</SelectItem>
                </>
              )}
              {citySlug === 'dubai' && (
                <>
                  <SelectItem value="Studio">Studio</SelectItem>
                  <SelectItem value="Penthouse">Penthouse</SelectItem>
                </>
              )}
            </SelectContent>
          </Select>
        </div>

        {/* Price Range */}
        <div>
          <Label>Price Range</Label>
          <Select
            value={localFilters.priceRange || 'all'}
            onValueChange={(value) => updateFilter('priceRange', value === 'all' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Prices</SelectItem>
              <SelectItem value="0-50L">₹0 - ₹50 L</SelectItem>
              <SelectItem value="50L-1Cr">₹50 L - ₹1 Cr</SelectItem>
              <SelectItem value="1-2Cr">₹1 Cr - ₹2 Cr</SelectItem>
              <SelectItem value="2-5Cr">₹2 Cr - ₹5 Cr</SelectItem>
              <SelectItem value="5Cr+">₹5 Cr+</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Bedrooms */}
        <div>
          <Label>Bedrooms</Label>
          <Select
            value={localFilters.bedrooms?.toString() || 'all'}
            onValueChange={(value) => updateFilter('bedrooms', value === 'all' ? undefined : parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="1">1 BHK</SelectItem>
              <SelectItem value="2">2 BHK</SelectItem>
              <SelectItem value="3">3 BHK</SelectItem>
              <SelectItem value="4">4 BHK</SelectItem>
              <SelectItem value="5">5+ BHK</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* City-specific filters */}
        {citySlug === 'hyderabad' && (
          <>
            {/* Micro Markets */}
            {localFilters.microMarkets && localFilters.microMarkets.length > 0 && (
              <div>
                <Label>Micro Markets</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {localFilters.microMarkets.map((market) => (
                    <div key={market} className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <span className="text-sm">{market}</span>
                      <button
                        onClick={() => {
                          const updated = localFilters.microMarkets?.filter(m => m !== market);
                          updateFilter('microMarkets', updated && updated.length > 0 ? updated : undefined);
                        }}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Communities */}
            {localFilters.communities && localFilters.communities.length > 0 && (
              <div>
                <Label>Communities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {localFilters.communities.map((community) => (
                    <div key={community} className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded">
                      <span className="text-sm">{community}</span>
                      <button
                        onClick={() => {
                          const updated = localFilters.communities?.filter(c => c !== community);
                          updateFilter('communities', updated && updated.length > 0 ? updated : undefined);
                        }}
                        className="ml-1"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Filters */}
            <div className="space-y-2">
              <Label>Special Options</Label>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="landowner-share"
                  checked={localFilters.landownerShare || false}
                  onCheckedChange={(checked) => updateFilter('landownerShare', checked || undefined)}
                />
                <Label htmlFor="landowner-share" className="font-normal cursor-pointer">
                  Landowner Share
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="investor-share"
                  checked={localFilters.investorShare || false}
                  onCheckedChange={(checked) => updateFilter('investorShare', checked || undefined)}
                />
                <Label htmlFor="investor-share" className="font-normal cursor-pointer">
                  Investor Share
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="resale"
                  checked={localFilters.isResale || false}
                  onCheckedChange={(checked) => updateFilter('isResale', checked || undefined)}
                />
                <Label htmlFor="resale" className="font-normal cursor-pointer">
                  Resale Only
                </Label>
              </div>
            </div>
          </>
        )}

        {citySlug === 'goa' && (
          <>
            {/* District */}
            <div>
              <Label>District</Label>
              <Select
                value={localFilters.district || 'all'}
                onValueChange={(value) => updateFilter('district', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Districts</SelectItem>
                  <SelectItem value="North Goa">North Goa</SelectItem>
                  <SelectItem value="South Goa">South Goa</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Listing Type */}
            <div>
              <Label>Listing Type</Label>
              <Select
                value={localFilters.listing_type || 'all'}
                onValueChange={(value) => updateFilter('listing_type', value === 'all' ? undefined : value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Sale">Sale</SelectItem>
                  <SelectItem value="Rent">Rent</SelectItem>
                  <SelectItem value="Both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}

        {citySlug === 'dubai' && (
          <>
            {/* Emirate */}
            {localFilters.emirate && (
              <div>
                <Label>Emirate</Label>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded mt-2">
                  <span className="text-sm">{localFilters.emirate}</span>
                  <button
                    onClick={() => removeFilter('emirate')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}

            {/* Community */}
            {localFilters.community && (
              <div>
                <Label>Community</Label>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded mt-2">
                  <span className="text-sm">{localFilters.community}</span>
                  <button
                    onClick={() => removeFilter('community')}
                    className="ml-1"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Sort By */}
        <div>
          <Label>Sort By</Label>
          <Select
            value={localFilters.sortBy || 'default'}
            onValueChange={(value) => updateFilter('sortBy', value === 'default' ? undefined : value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Featured First</SelectItem>
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

