"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Users, Cloud, MapPin, TrendingUp } from "lucide-react";

interface CityOverviewSectionProps {
  overviewData: any;
}

const iconMap: Record<string, React.ElementType> = {
  landmark: Landmark,
  users: Users,
  cloud: Cloud,
  "map-pin": MapPin,
  "trending-up": TrendingUp,
};

export default function CityOverviewSection({ overviewData }: CityOverviewSectionProps) {
  if (!overviewData) return null;

  // Parse the JSON data - handle the structure: { main: {...}, sections: [...] }
  let sections: Array<{ id: string; icon?: string; title: string; content: string }> = [];
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
          icon: section.icon || "landmark",
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
        icon: section.icon || "landmark",
        title: section.title || "",
        content: section.content || ""
      }));
    }
  } else if (Array.isArray(overviewData)) {
    sections = overviewData.map((section: any) => ({
      id: section.id || section.title?.toLowerCase() || "",
      icon: section.icon || "landmark",
      title: section.title || "",
      content: section.content || ""
    }));
  }

  if (sections.length === 0) return null;

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
            <Tabs defaultValue={sections[0]?.id} className="w-full">
              <TabsList className="flex w-full flex-wrap justify-center gap-2 bg-transparent h-auto mb-8 overflow-x-auto">
                {sections.map((section) => {
                  const Icon = iconMap[section.icon || "landmark"] || Landmark;
                  const shortLabel = section.title.split(":")[0].trim();
                  return (
                    <TabsTrigger
                      key={section.id}
                      value={section.id}
                      className="px-4 py-2 rounded-full border bg-card hover:bg-primary/10 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground flex items-center gap-2 text-sm"
                    >
                      <Icon className="w-4 h-4" />
                      {shortLabel}
                    </TabsTrigger>
                  );
                })}
              </TabsList>
              {sections.map((section) => (
                <TabsContent key={section.id} value={section.id} className="mt-0">
                  <div className="bg-card rounded-xl p-6 md:p-8 shadow-lg border">
                    <h3 className="text-xl font-semibold mb-4">{section.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      {section.content}
                    </p>
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}



