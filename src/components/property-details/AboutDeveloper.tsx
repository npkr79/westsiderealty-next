"use client";

import Link from "next/link";
import { Calendar, Medal, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AboutDeveloperProps {
  developerName: string;
  developerSlug?: string;
  citySlug?: string;
  description?: string;
  yearsInBusiness?: number;
  totalProjects?: number;
  totalSftDelivered?: string;
  logoUrl?: string;
}

const stripHtml = (html: string | null | undefined): string => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, '').trim();
};

export default function AboutDeveloper({ 
  developerName, 
  developerSlug,
  citySlug = 'hyderabad',
  description,
  yearsInBusiness,
  totalProjects,
  totalSftDelivered,
  logoUrl
}: AboutDeveloperProps) {
  if (!developerName) return null;

  const cleanDescription = description 
    ? stripHtml(description)
    : `${developerName} is a reputed developer associated with premium projects in this micro-market.`;

  // Link to city-specific developers page if citySlug is provided, otherwise generic developers page
  const developerUrl = developerSlug 
    ? `/${citySlug}/developers#${developerSlug}`
    : `/${citySlug}/developers`;

  return (
    <div className="rounded-xl border border-gray-200 p-6 space-y-6 bg-white">
      <h2 className="text-2xl font-bold text-gray-900">About {developerName}</h2>
      
      <p className="text-gray-600 leading-relaxed line-clamp-3">
        {cleanDescription}
      </p>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {yearsInBusiness && (
          <div className="rounded-xl p-5 space-y-2 bg-blue-50">
            <Calendar className="w-6 h-6 text-blue-500" />
            <p className="text-sm font-semibold text-blue-600">Experience</p>
            <p className="text-xl font-bold text-gray-900">{yearsInBusiness}+ Years</p>
            <p className="text-xs text-gray-500">in business</p>
          </div>
        )}
        
        {totalProjects && (
          <div className="rounded-xl p-5 space-y-2 bg-green-50">
            <Medal className="w-6 h-6 text-green-500" />
            <p className="text-sm font-semibold text-green-600">Projects Delivered</p>
            <p className="text-xl font-bold text-gray-900">{totalProjects}+</p>
            <p className="text-xs text-gray-500">completed projects</p>
          </div>
        )}
        
        {totalSftDelivered && (
          <div className="rounded-xl p-5 space-y-2 bg-purple-50">
            <Tag className="w-6 h-6 text-purple-500" />
            <p className="text-sm font-semibold text-purple-600">SFT Delivered</p>
            <p className="text-xl font-bold text-gray-900">{totalSftDelivered}</p>
            <p className="text-xs text-gray-500">square feet</p>
          </div>
        )}
      </div>

      <Link href={developerUrl}>
        <Button className="w-full bg-slate-900 text-white py-4 rounded-xl font-medium hover:bg-slate-800">
          Know more about {developerName}
        </Button>
      </Link>
    </div>
  );
}
