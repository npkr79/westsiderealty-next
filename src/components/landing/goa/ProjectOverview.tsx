"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { LandingPage } from "@/types/landingPage";

interface ProjectOverviewProps {
  landingPage: LandingPage;
}

export default function ProjectOverview({ landingPage }: ProjectOverviewProps) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-teal-500 text-white border-0 px-6 py-2 text-lg">
            Vive la Goa
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Project Overview
          </h2>
        </div>

        <Card className="border-2 border-teal-200 shadow-xl bg-gradient-to-br from-white to-teal-50/30">
          <CardContent className="p-8 md:p-12">
            <div 
              className="prose prose-lg max-w-none text-gray-700 leading-relaxed"
              dangerouslySetInnerHTML={{ __html: landingPage.rich_description || '' }}
            />
            
            <div className="mt-8 pt-8 border-t-2 border-teal-200">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">Project Specifications</h3>
              <ul className="space-y-3 text-gray-700">
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Exclusive 12-unit per floor resort-style apartments</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>G+3 floors structure</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>1.8m wide corridors</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-teal-600 font-bold">•</span>
                  <span>Modern eco-friendly construction</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

