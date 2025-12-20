"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { GraduationCap, Hospital, Building2, ShoppingBag, Car, Plane } from "lucide-react";

interface LocationDetailsDisplayProps {
  nearby_landmarks?: string[] | string | Array<{ name?: string; type?: string; distance?: string }> | { [key: string]: any };
}

interface LocationItem {
  name: string;
  distance?: string;
}

interface LocationCategory {
  type: 'schools' | 'hospitals' | 'it_hub' | 'mall' | 'orr' | 'airport';
  label: string;
  icon: typeof GraduationCap;
  color: string;
  bgColor: string;
  items: LocationItem[];
}

// Parse location data to group by category
function parseLocationData(locationDetails: any): LocationCategory[] {
  const categories: LocationCategory[] = [];

  if (!locationDetails || typeof locationDetails !== 'object') {
    return categories;
  }

  // Schools
  const schools: LocationItem[] = [];
  if (locationDetails.school1_name) {
    schools.push({ 
      name: locationDetails.school1_name, 
      distance: locationDetails.school1_distance 
    });
  }
  if (locationDetails.school2_name) {
    schools.push({ 
      name: locationDetails.school2_name, 
      distance: locationDetails.school2_distance 
    });
  }
  if (schools.length > 0) {
    categories.push({
      type: 'schools',
      label: 'Schools',
      icon: GraduationCap,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      items: schools,
    });
  }

  // Hospitals
  const hospitals: LocationItem[] = [];
  if (locationDetails.hospital1_name) {
    hospitals.push({ 
      name: locationDetails.hospital1_name, 
      distance: locationDetails.hospital1_distance 
    });
  }
  if (locationDetails.hospital2_name) {
    hospitals.push({ 
      name: locationDetails.hospital2_name, 
      distance: locationDetails.hospital2_distance 
    });
  }
  if (hospitals.length > 0) {
    categories.push({
      type: 'hospitals',
      label: 'Hospitals',
      icon: Hospital,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      items: hospitals,
    });
  }

  // IT Hub
  if (locationDetails.it_hub_name) {
    categories.push({
      type: 'it_hub',
      label: 'IT Hub',
      icon: Building2,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      items: [{ 
        name: locationDetails.it_hub_name, 
        distance: locationDetails.it_hub_distance 
      }],
    });
  }

  // Mall
  if (locationDetails.mall_name) {
    categories.push({
      type: 'mall',
      label: 'Mall',
      icon: ShoppingBag,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      items: [{ 
        name: locationDetails.mall_name, 
        distance: locationDetails.mall_distance 
      }],
    });
  }

  // ORR/Connectivity
  if (locationDetails.orr_exit_distance) {
    categories.push({
      type: 'orr',
      label: 'ORR Exit',
      icon: Car,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      items: [{ 
        name: 'Outer Ring Road', 
        distance: locationDetails.orr_exit_distance 
      }],
    });
  }

  // Airport
  if (locationDetails.airport_distance) {
    categories.push({
      type: 'airport',
      label: 'Airport',
      icon: Plane,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      items: [{ 
        name: 'International Airport', 
        distance: locationDetails.airport_distance 
      }],
    });
  }

  return categories;
}

export default function LocationDetailsDisplay({
  nearby_landmarks,
}: LocationDetailsDisplayProps) {
  if (!nearby_landmarks) {
    return null;
  }

  // Try to parse as structured location data
  let locationData: any = null;

  try {
    // If it's a string, try to parse as JSON
    if (typeof nearby_landmarks === "string") {
      try {
        locationData = JSON.parse(nearby_landmarks);
      } catch {
        // If parsing fails, it might be a comma-separated string - skip structured format
        return null;
      }
    } else if (typeof nearby_landmarks === "object" && nearby_landmarks !== null && !Array.isArray(nearby_landmarks)) {
      // Already an object - check if it has the expected structure
      locationData = nearby_landmarks;
    } else {
      // Array or other format - skip structured format
      return null;
    }
  } catch (error) {
    console.error("[LocationDetailsDisplay] Error parsing location data:", error);
    return null;
  }

  // Parse location data into categories
  const categories = parseLocationData(locationData);

  if (categories.length === 0) {
    return null;
  }

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-foreground">Location Highlights</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const IconComponent = category.icon;
          return (
            <Card key={category.type} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${category.bgColor}`}>
                    <IconComponent className={`h-5 w-5 ${category.color}`} />
                  </div>
                  <h3 className={`text-sm font-bold uppercase tracking-wide ${category.color}`}>
                    {category.label}
                  </h3>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="space-y-3">
                  {category.items.map((item, index) => (
                    <li key={index} className="flex items-center justify-between">
                      <span className="text-sm text-foreground font-medium flex-1">
                        {item.name}
                      </span>
                      {item.distance && (
                        <Badge variant="secondary" className="ml-2 text-xs font-semibold">
                          {item.distance}
                        </Badge>
                      )}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
