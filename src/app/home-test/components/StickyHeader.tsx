"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Menu, Phone } from "lucide-react";

interface StickyHeaderProps {
  isScrolled: boolean;
}

export default function StickyHeader({ isScrolled }: StickyHeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? "bg-white/95 backdrop-blur-xl shadow-lg"
            : "bg-white/80 backdrop-blur-sm"
        }`}
        style={{ height: "80px" }}
      >
        <div className="container mx-auto px-4 h-full flex items-center justify-between">
          {/* Logo */}
          <Link href="/home-test" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">W</span>
            </div>
            <span className="font-bold text-lg text-gray-900 hidden sm:inline">
              Westside Realty
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/hyderabad/buy"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Buy
            </Link>
            <Link
              href="/hyderabad/buy"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Rent
            </Link>
            <Link
              href="/hyderabad/buy"
              className="text-gray-700 hover:text-blue-600 font-medium transition-colors"
            >
              Commercial
            </Link>
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-3">
            <button className="p-2 text-gray-700 hover:text-blue-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <a
              href="tel:+919866085831"
              className="hidden sm:flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Phone className="w-4 h-4" />
              <span className="font-medium">Call</span>
            </a>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden p-2 text-gray-700"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="fixed top-20 left-0 right-0 bg-white shadow-xl z-40 md:hidden animate-fade-in-up">
            <nav className="container mx-auto px-4 py-6 space-y-4">
              <Link
                href="/hyderabad/buy"
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Buy
              </Link>
              <Link
                href="/hyderabad/buy"
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Rent
              </Link>
              <Link
                href="/hyderabad/buy"
                className="block text-gray-700 hover:text-blue-600 font-medium py-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Commercial
              </Link>
            </nav>
          </div>
        )}
    </>
  );
}
