"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Briefcase, Home, TrendingUp, MapPin } from "lucide-react";

interface CityOverviewSectionProps {
  overviewData: any;
}

const iconMap: Record<string, any> = {
  landmark: Landmark,
  briefcase: Briefcase,
  home: Home,
  trendingUp: TrendingUp,
  mapPin: MapPin,
};

export default function CityOverviewSection({ overviewData }: CityOverviewSectionProps) {
  if (!overviewData) return null;

  // Parse the JSON data - handle the structure: { main: {...}, sections: [...] }
  let sections: Array<{ id: string; icon?: any; title: string; content: string }> = [];
  let mainContent: string | null = null;
  
  if (typeof overviewData === "string") {
    try {
      const parsed = JSON.parse(overviewData);
      if (parsed.main) {
        mainContent = parsed.main.content || parsed.main.title || "";
      }
      if (parsed.sections && Array.isArray(parsed.sections)) {
        sections = parsed.sections.map((section: any) => ({
          id: section.id || section.title?.toLowerCase() || "",
          icon: section.icon ? iconMap[section.icon] : null,
          title: section.title || "",
          content: section.content || ""
        }));
      }
    } catch {
      // If it's HTML string, create a single section
      sections = [{ id: "overview", title: "Overview", content: overviewData }];
    }
  } else if (overviewData.main || overviewData.sections) {
    // Structure: { main: {...}, sections: [...] }
    if (overviewData.main) {
      mainContent = overviewData.main.content || overviewData.main.title || "";
    }
    if (overviewData.sections && Array.isArray(overviewData.sections)) {
      sections = overviewData.sections.map((section: any) => ({
        id: section.id || section.title?.toLowerCase() || "",
        icon: section.icon ? iconMap[section.icon] : null,
        title: section.title || "",
        content: section.content || ""
      }));
    }
  } else if (Array.isArray(overviewData)) {
    sections = overviewData.map((section: any) => ({
      id: section.id || section.title?.toLowerCase() || "",
      icon: section.icon ? iconMap[section.icon] : null,
      title: section.title || "",
      content: section.content || ""
    }));
  }

  if (sections.length === 0) return null;

  const [activeTab, setActiveTab] = useState(sections[0]?.id || sections[0]?.title || "overview");

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-center text-[hsl(var(--heading-blue))]">
          City Overview
        </h2>
        <Card className="bg-white/80 backdrop-blur-sm border shadow-lg">
          <CardContent className="p-6">
            {mainContent && (
              <div 
                className="prose prose-sm max-w-none text-muted-foreground mb-6 pb-6 border-b"
                dangerouslySetInnerHTML={{ __html: mainContent }}
              />
            )}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                {sections.map((section) => (
                  <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
                    {section.icon && <section.icon className="h-4 w-4" />}
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="mt-4">
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ __html: section.content }}
                  />
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}



