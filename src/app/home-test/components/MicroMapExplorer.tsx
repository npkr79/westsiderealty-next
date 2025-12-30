"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";

interface MicroMapExplorerProps {
  microMarkets: any[];
}

export default function MicroMapExplorer({ microMarkets }: MicroMapExplorerProps) {
  const [selectedCity, setSelectedCity] = useState("Hyderabad");

  // Group markets by city (for now just Hyderabad, but can expand)
  const displayedMarkets = microMarkets.slice(0, 6);

  if (microMarkets.length === 0) return null;

  return (
    <section className="py-12 bg-gradient-to-b from-white to-gray-50">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <MapPin className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Explore Hyderabad
            </h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCity("Hyderabad")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCity === "Hyderabad"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Hyderabad
            </button>
            <button
              onClick={() => setSelectedCity("Goa")}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedCity === "Goa"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
            >
              Goa
            </button>
          </div>
        </div>

        {/* Map Container */}
        <div className="relative bg-white rounded-3xl shadow-xl overflow-hidden" style={{ height: "300px" }}>
          {/* Placeholder for Mapbox - can be integrated later */}
          <div className="w-full h-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="w-16 h-16 text-blue-600 mx-auto mb-4" />
              <p className="text-gray-700 font-medium">Interactive Map Coming Soon</p>
              <p className="text-sm text-gray-500 mt-2">Explore micro-markets below</p>
            </div>
          </div>
        </div>

        {/* Micro-Market Pills */}
        <div className="mt-6 flex flex-wrap gap-3">
          {displayedMarkets.map((market, index) => (
            <div
              key={market.id}
              className="animate-fade-in-up"
              style={{ animationDelay: `${index * 0.05}s` }}
            >
              <Link
                href={`/hyderabad/${market.url_slug}`}
                className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-md hover:shadow-lg transition-all hover:scale-105"
              >
                <span className="font-semibold text-gray-900">
                  {market.micro_market_name}
                </span>
                {market.projectCount > 0 && (
                  <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs font-medium">
                    {market.projectCount}
                  </span>
                )}
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
