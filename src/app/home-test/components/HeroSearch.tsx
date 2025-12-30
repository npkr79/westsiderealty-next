"use client";

import { useState } from "react";
import { Search } from "lucide-react";
import Link from "next/link";

export default function HeroSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const [propertyType, setPropertyType] = useState("Residential");
  const [transactionType, setTransactionType] = useState("Buy");

  return (
    <section
      className="relative min-h-screen flex items-center justify-center pt-20 pb-32"
      style={{
        background:
          "linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)",
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('/grid.svg')] bg-repeat"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center">
        {/* Hero Text */}
        <div className="mb-8 animate-fade-in-up">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 leading-tight">
            Find your dream home
            <br />
            <span className="text-blue-400">in seconds</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300">
            1000+ RERA verified projects
          </p>
        </div>

        {/* Glass Search Bar */}
        <div className="max-w-4xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/20">
            {/* Main Search Input */}
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search projects, developers, micro markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-white/90 backdrop-blur-sm rounded-2xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              />
            </div>

            {/* Filter Row 1 */}
            <div className="flex flex-wrap gap-3 mb-3">
              <button
                onClick={() => setPropertyType("Residential")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  propertyType === "Residential"
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Residential
              </button>
              <button
                onClick={() => setPropertyType("Commercial")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  propertyType === "Commercial"
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Commercial
              </button>
              <button
                onClick={() => setTransactionType("Buy")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  transactionType === "Buy"
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTransactionType("Rent")}
                className={`px-4 py-2 rounded-xl font-medium transition-all ${
                  transactionType === "Rent"
                    ? "bg-blue-600 text-white"
                    : "bg-white/20 text-white hover:bg-white/30"
                }`}
              >
                Rent
              </button>
            </div>

            {/* Filter Row 2 */}
            <div className="flex flex-wrap gap-3">
              {["New", "Resale", "RERA", "Ready", "Under Construction"].map(
                (filter) => (
                  <button
                    key={filter}
                    className="px-3 py-1.5 rounded-lg bg-white/10 text-white text-sm font-medium hover:bg-white/20 transition-all"
                  >
                    {filter}
                  </button>
                )
              )}
            </div>

            {/* Search Button */}
            <Link
              href={`/hyderabad/buy?search=${encodeURIComponent(searchQuery)}`}
              className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-2xl transition-all flex items-center justify-center gap-2 shadow-lg"
            >
              <Search className="w-5 h-5" />
              Search Properties
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
