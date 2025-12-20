"use client";

import Link from "next/link";
import { CircleDollarSign, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutMicroMarketProps {
  microMarketName: string;
  microMarketSlug?: string;
  citySlug: string;
  description?: string;
  pricePerSqftMin?: number;
  pricePerSqftMax?: number;
  appreciationRate?: number;
}

const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').trim();
};

export function AboutMicroMarket({ 
  microMarketName, 
  microMarketSlug,
  citySlug,
  description,
  pricePerSqftMin,
  pricePerSqftMax,
  appreciationRate 
}: AboutMicroMarketProps) {
  if (!microMarketName) return null;

  const cleanDescription = description 
    ? stripHtml(description)
    : `${microMarketName} is a prime micro-market offering excellent connectivity and infrastructure.`;

  const microMarketUrl = microMarketSlug 
    ? `/${citySlug}/${microMarketSlug}`
    : `/${citySlug}/micro-markets`;

  return (
    <div className="rounded-xl border border-gray-200 p-6 space-y-6 bg-white">
      <h2 className="text-2xl font-bold text-gray-900">About {microMarketName}</h2>
      
      <p className="text-gray-600 leading-relaxed line-clamp-3">
        {cleanDescription}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {pricePerSqftMin && pricePerSqftMax && (
          <div className="rounded-xl p-5 space-y-2 bg-blue-50">
            <CircleDollarSign className="w-6 h-6 text-blue-500" />
            <p className="text-sm font-semibold text-blue-600">Price Range</p>
            <p className="text-xl font-bold text-gray-900">
              ₹{pricePerSqftMin.toLocaleString()} - ₹{pricePerSqftMax.toLocaleString()}
            </p>
            <p className="text-xs text-gray-500">per sq.ft</p>
          </div>
        )}
        
        {appreciationRate && (
          <div className="rounded-xl p-5 space-y-2 bg-green-50">
            <TrendingUp className="w-6 h-6 text-green-500" />
            <p className="text-sm font-semibold text-green-600">Appreciation</p>
            <p className="text-xl font-bold text-gray-900">{appreciationRate}%</p>
            <p className="text-xs text-gray-500">annual growth</p>
          </div>
        )}
      </div>

      <Link href={microMarketUrl}>
        <Button className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium hover:bg-slate-800">
          Know more about {microMarketName}
        </Button>
      </Link>
    </div>
  );
}
