"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CityOverviewSectionProps {
  overviewData: any;
}

export default function CityOverviewSection({ overviewData }: CityOverviewSectionProps) {
  if (!overviewData) return null;

  // Parse the JSON data - handle different formats
  let sections: Array<{ title: string; content: string }> = [];
  
  if (typeof overviewData === "string") {
    try {
      const parsed = JSON.parse(overviewData);
      sections = Array.isArray(parsed) ? parsed : (parsed.sections || []);
    } catch {
      // If it's HTML string, create a single section
      sections = [{ title: "Overview", content: overviewData }];
    }
  } else if (Array.isArray(overviewData)) {
    sections = overviewData;
  } else if (overviewData.sections) {
    sections = overviewData.sections;
  } else {
    // Try to extract tab data from object
    const tabNames = ["History", "Culture", "Climate", "Tourism", "Growth"];
    sections = tabNames
      .filter(tab => overviewData[tab.toLowerCase()] || overviewData[tab])
      .map(tab => ({
        title: tab,
        content: overviewData[tab.toLowerCase()] || overviewData[tab] || ""
      }));
  }

  if (sections.length === 0) return null;

  const [activeTab, setActiveTab] = useState(sections[0]?.title || "Overview");

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-8 text-[hsl(var(--heading-blue))]">
          City Overview
        </h2>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 mb-6">
                {sections.map((section) => (
                  <TabsTrigger key={section.title} value={section.title}>
                    {section.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {sections.map((section) => (
                <TabsContent key={section.title} value={section.title} className="mt-4">
                  <div 
                    className="prose prose-sm max-w-none text-muted-foreground"
                    dangerouslySetInnerHTML={{ 
                      __html: typeof section.content === 'string' 
                        ? section.content 
                        : JSON.stringify(section.content, null, 2)
                    }}
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



