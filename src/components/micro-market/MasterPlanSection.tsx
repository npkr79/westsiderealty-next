import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, MapPin, Trees, Briefcase, Home } from "lucide-react";

interface MasterPlanZone {
  zone: string;
  purpose: string;
  description: string;
}

interface MasterPlanData {
  zones?: MasterPlanZone[];
  fsi_policy?: string;
  total_area?: string;
}

interface MasterPlanSectionProps {
  data: MasterPlanData | string;
  microMarketName?: string;
}

// Icon mapping for different zone types
const getZoneIcon = (zone: string): typeof Building2 => {
  const zoneLower = zone.toLowerCase();
  if (zoneLower.includes("residential") || zoneLower.includes("housing")) {
    return Home;
  }
  if (zoneLower.includes("commercial") || zoneLower.includes("business") || zoneLower.includes("it")) {
    return Briefcase;
  }
  if (zoneLower.includes("recreational") || zoneLower.includes("green") || zoneLower.includes("park")) {
    return Trees;
  }
  return Building2;
};

export default function MasterPlanSection({ data, microMarketName = "Neopolis" }: MasterPlanSectionProps) {
  // Parse data if it's a string
  let masterPlanData: MasterPlanData = {};
  
  if (typeof data === "string") {
    try {
      masterPlanData = JSON.parse(data);
    } catch (e) {
      console.error("[MasterPlanSection] Error parsing JSON:", e);
      return null;
    }
  } else if (typeof data === "object" && data !== null) {
    masterPlanData = data;
  } else {
    return null;
  }

  const { zones = [], fsi_policy, total_area } = masterPlanData;

  if (!zones || zones.length === 0) {
    return null;
  }

  // Generate JSON-LD structured data for SEO
  const masterPlanSchema = {
    "@context": "https://schema.org",
    "@type": "Place",
    "name": `${microMarketName} Master Plan & Zoning`,
    "description": `Master Plan and Zoning information for ${microMarketName}. ${zones.map((zone) => `${zone.zone}: ${zone.purpose} - ${zone.description}`).join(". ")}${fsi_policy ? ` FSI Policy: ${fsi_policy}.` : ""}${total_area ? ` Total Area: ${total_area}.` : ""}`,
    "containsPlace": zones.map((zone) => ({
      "@type": "Place",
      "name": zone.zone,
      "description": `${zone.purpose}: ${zone.description}`,
    })),
    ...(fsi_policy && { "additionalProperty": { "@type": "PropertyValue", "name": "FSI Policy", "value": fsi_policy } }),
    ...(total_area && { "areaServed": { "@type": "City", "name": microMarketName, "area": total_area } }),
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(masterPlanSchema) }}
      />

      <section className="mb-12" itemScope itemType="https://schema.org/Place">
        <Card className="border-2 border-primary/20 shadow-lg">
          <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10 pb-4">
            <CardTitle className="text-3xl font-bold text-foreground flex items-center gap-3">
              <MapPin className="h-8 w-8 text-primary" />
              Master Plan & Zoning
            </CardTitle>
            {(fsi_policy || total_area) && (
              <div className="flex flex-wrap gap-4 mt-4">
                {fsi_policy && (
                  <Badge variant="secondary" className="text-base px-4 py-2 bg-primary/20 text-primary font-semibold">
                    <Building2 className="h-4 w-4 mr-2" />
                    {fsi_policy}
                  </Badge>
                )}
                {total_area && (
                  <Badge variant="secondary" className="text-base px-4 py-2 bg-secondary/20 text-secondary-foreground font-semibold">
                    <MapPin className="h-4 w-4 mr-2" />
                    Total Area: {total_area}
                  </Badge>
                )}
              </div>
            )}
          </CardHeader>
          <CardContent className="pt-6">
            {/* SEO-friendly hidden content */}
            <div className="sr-only" itemProp="description">
              Master Plan and Zoning information for {microMarketName}. 
              {zones.map((zone) => `${zone.zone}: ${zone.purpose} - ${zone.description}`).join(". ")}
              {fsi_policy && ` FSI Policy: ${fsi_policy}.`}
              {total_area && ` Total Area: ${total_area}.`}
            </div>

            {/* Zones Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {zones.map((zone, index) => {
                const IconComponent = getZoneIcon(zone.zone);
                return (
                  <Card
                    key={index}
                    className="hover:shadow-xl transition-all duration-300 border-l-4 border-l-primary/50 hover:border-l-primary"
                    itemScope
                    itemType="https://schema.org/Place"
                  >
                    <CardHeader className="pb-3">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          <IconComponent className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <CardTitle className="text-xl font-bold text-foreground mb-1" itemProp="name">
                            {zone.zone}
                          </CardTitle>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {zone.purpose}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground leading-relaxed" itemProp="description">
                        {zone.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Additional Information */}
            {(fsi_policy || total_area) && (
              <div className="mt-8 pt-6 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {fsi_policy && (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="p-3 rounded-full bg-primary/10">
                        <Building2 className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">FSI Policy</p>
                        <p className="text-lg font-bold text-foreground">{fsi_policy}</p>
                      </div>
                    </div>
                  )}
                  {total_area && (
                    <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
                      <div className="p-3 rounded-full bg-secondary/10">
                        <MapPin className="h-6 w-6 text-secondary-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Total Area</p>
                        <p className="text-lg font-bold text-foreground">{total_area}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </>
  );
}
