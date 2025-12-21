"use client";

import { Suspense } from "react";
import PropertyListingClient from "./PropertyListingClient";
import type { UnifiedProperty, CitySlug } from "@/types/unifiedProperty";

interface PropertyListingClientWrapperProps {
  citySlug: CitySlug;
  initialProperties: UnifiedProperty[];
}

/**
 * Wrapper component that handles Suspense for useSearchParams
 * Renders properties immediately without showing loading state
 */
export default function PropertyListingClientWrapper({
  citySlug,
  initialProperties,
}: PropertyListingClientWrapperProps) {
  return (
    <Suspense fallback={
      // Render properties immediately in fallback - no "Loading..." message
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <div className="text-sm text-muted-foreground">Filters loading...</div>
            </div>
            <div className="lg:col-span-3">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {initialProperties.length} Properties Found
                </h2>
                <p className="text-gray-600">
                  Premium resale properties in Hyderabad
                </p>
              </div>
              <div className="grid gap-6 grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                {initialProperties.map((property) => (
                  <div key={property.id} className="border rounded-lg p-4">
                    <h2 className="text-base font-semibold text-foreground line-clamp-2 mb-2">
                      {property.title}
                    </h2>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                      {property.location}
                    </p>
                    <p className="text-base font-semibold text-primary">
                      {property.price_display || `₹${property.price.toLocaleString()}`}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    }>
      <PropertyListingClient
        citySlug={citySlug}
        initialProperties={initialProperties}
      />
    </Suspense>
  );
}

