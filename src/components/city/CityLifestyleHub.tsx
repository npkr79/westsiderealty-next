"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import { Utensils, Cloud, Train } from "lucide-react";

interface CityLifestyleHubProps {
  lifestyleData: any;
  cityName: string;
}

export default function CityLifestyleHub({ lifestyleData, cityName }: CityLifestyleHubProps) {
  if (!lifestyleData) return null;

  // Parse lifestyle data - handle different formats
  let tabs: Array<{ 
    id: string; 
    title: string; 
    icon?: any;
    content: any;
  }> = [];

  if (Array.isArray(lifestyleData)) {
    tabs = lifestyleData.map((item, idx) => ({
      id: item.id || item.title?.toLowerCase() || `tab-${idx}`,
      title: item.title || item.name || "Section",
      icon: item.icon,
      content: item
    }));
  } else if (lifestyleData.culture || lifestyleData.climate || lifestyleData.connectivity) {
    // Structure: { culture: {...}, climate: {...}, connectivity: {...} }
    tabs = [
      { id: "culture", title: "🎭 Culture & Heritage", icon: Utensils, content: lifestyleData.culture },
      { id: "climate", title: "🌤️ Climate & Infrastructure", icon: Cloud, content: lifestyleData.climate },
      { id: "connectivity", title: "🚇 Connectivity", icon: Train, content: lifestyleData.connectivity }
    ].filter(tab => tab.content);
  } else if (lifestyleData.sections) {
    tabs = lifestyleData.sections.map((section: any, idx: number) => ({
      id: section.id || section.title?.toLowerCase() || `tab-${idx}`,
      title: section.title || section.name || "Section",
      icon: section.icon,
      content: section
    }));
  }

  if (tabs.length === 0) return null;

  const [activeTab, setActiveTab] = useState(tabs[0]?.id || "culture");

  const renderTabContent = (content: any) => {
    if (!content) return null;

    return (
      <div className="space-y-6">
        {/* Main Description */}
        {content.description && (
          <div 
            className="prose prose-sm max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ __html: content.description }}
          />
        )}

        {/* Culinary Heritage Cards (for Culture tab) */}
        {content.culinary_heritage && Array.isArray(content.culinary_heritage) && (
          <div>
            <h3 className="text-xl font-semibold mb-4">Vibrant Culture & Culinary Heritage</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {content.culinary_heritage.map((item: any, idx: number) => (
                <Card key={idx}>
                  {item.image && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={item.image}
                        alt={item.title || "Culinary heritage"}
                        fill
                        className="object-cover rounded-t-lg"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold mb-2">{item.title}</h4>
                    {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Key Festivals */}
        {content.festivals && Array.isArray(content.festivals) && (
          <div>
            <h3 className="text-lg font-semibold mb-3">Key Festivals</h3>
            <div className="flex flex-wrap gap-2">
              {content.festivals.map((festival: string, idx: number) => (
                <Badge key={idx} variant="secondary">{festival}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Landmarks Grid */}
        {content.landmarks && Array.isArray(content.landmarks) && (
          <div>
            <h3 className="text-lg font-semibold mb-4">Must-Visit Landmarks</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {content.landmarks.map((landmark: any, idx: number) => (
                <Card key={idx} className="overflow-hidden">
                  {landmark.image && (
                    <div className="relative h-32 w-full">
                      <Image
                        src={landmark.image}
                        alt={landmark.name || landmark.title || "Landmark"}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm">{landmark.name || landmark.title}</h4>
                    {landmark.description && (
                      <p className="text-xs text-muted-foreground mt-1">{landmark.description}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Points List */}
        {content.points && Array.isArray(content.points) && (
          <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
            {content.points.map((point: string, i: number) => (
              <li key={i}>{point}</li>
            ))}
          </ul>
        )}

        {/* Infrastructure Items */}
        {content.infrastructure && Array.isArray(content.infrastructure) && (
          <div className="grid md:grid-cols-2 gap-4">
            {content.infrastructure.map((item: any, idx: number) => (
              <Card key={idx}>
                <CardContent className="p-4">
                  <h4 className="font-semibold mb-2">{item.title || item.name}</h4>
                  {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section className="py-16 bg-secondary/10">
      <div className="container px-4">
        <h2 className="text-3xl md:text-4xl font-bold mb-8 text-[hsl(var(--heading-blue))]">
          {cityName} Lifestyle: Culture, Climate, and Connectivity
        </h2>
        <Card>
          <CardContent className="p-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                {tabs.map((tab) => (
                  <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2">
                    {tab.icon && <tab.icon className="h-4 w-4" />}
                    {tab.title}
                  </TabsTrigger>
                ))}
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent key={tab.id} value={tab.id} className="mt-4">
                  {renderTabContent(tab.content)}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}


