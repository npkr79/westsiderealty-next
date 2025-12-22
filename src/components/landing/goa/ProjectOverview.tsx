"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Ruler, 
  IndianRupee, 
  TrendingUp, 
  Calendar, 
  MapPin, 
  Plane, 
  Waves, 
  Coffee, 
  Dumbbell, 
  Palmtree, 
  ShieldCheck, 
  Car, 
  Users, 
  CheckCircle2
} from "lucide-react";

export default function ProjectOverview() {
  // Section 1: Unit Details
  const unitDetails = [
    { icon: Ruler, label: "Unit Size", value: "582 sq.ft" },
    { icon: IndianRupee, label: "Rate", value: "₹9,500/sq.ft" },
    { icon: TrendingUp, label: "Rental Yield", value: "12% from Day 1" },
    { icon: Calendar, label: "Payment Plan", value: "50% | 25% | 25%" }
  ];

  // Section 2: Investment Highlights
  const investmentHighlights = [
    "Goa tourism up by 10.5% in 2025 – booming domestic & global footfall",
    "Backed by ₹350 Cr 'Goa Beyond Beaches' tourism transformation plan",
    "Proximity to Airport, Beaches, Resorts & Entertainment Zones",
    "Excellent long-term, short-stay & holiday rental demand – strong ROI potential",
    "Fully furnished + resort-style maintenance = zero hassle investment",
    "Perfect for: Self Use | Airbnb | Long-term Rental"
  ];

  // Section 3: Nearby Attractions
  const nearbyAttractions = [
    { icon: Plane, text: "10 min from Dabolim International Airport" },
    { icon: Waves, text: "Close to Bogmalo & Hollant Beaches" },
    { icon: Coffee, text: "Surrounded by 5-star resorts, cafés & nightlife" },
    { icon: MapPin, text: "Easy access to Goa's scenic coastal belt" }
  ];

  // Section 4: Premium Amenities
  const amenities = [
    { icon: Coffee, name: "Cafeteria" },
    { icon: Waves, name: "Swimming Pool" },
    { icon: Dumbbell, name: "Gym & Fitness Zone" },
    { icon: Coffee, name: "Café & Lounge Area" },
    { icon: Palmtree, name: "Landscaped Green Courtyard" },
    { icon: Users, name: "Kids' Play Zone" },
    { icon: ShieldCheck, name: "24x7 Security" },
    { icon: Car, name: "Parking" }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-teal-500 text-white border-0 px-6 py-2 text-lg">
            Vive la Goa
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Project Overview
          </h2>
        </div>

        {/* Section 1: Unit Details */}
        <Card className="border-2 border-teal-200 shadow-xl mb-8 bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-teal-600" />
              Unit Details
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {unitDetails.map((detail, index) => {
                const Icon = detail.icon;
                return (
                  <Card key={index} className="border-2 border-teal-100 bg-gradient-to-br from-teal-50 to-cyan-50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
                        <Icon className="h-6 w-6 text-teal-600" />
                      </div>
                      <p className="text-sm font-medium text-gray-600 mb-1">{detail.label}</p>
                      <p className="text-lg font-bold text-gray-900">{detail.value}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Investment Highlights */}
        <Card className="border-2 border-cyan-200 shadow-xl mb-8 bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <TrendingUp className="h-7 w-7 text-cyan-600" />
              Investment Highlights
            </h3>
            <div className="space-y-3">
              {investmentHighlights.map((highlight, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-gradient-to-r from-cyan-50 to-teal-50 border-2 border-cyan-100">
                  <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <p className="text-gray-700 leading-relaxed">{highlight}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Nearby Attractions */}
        <Card className="border-2 border-blue-200 shadow-xl mb-8 bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <MapPin className="h-7 w-7 text-blue-600" />
              Nearby Attractions
            </h3>
            <div className="grid md:grid-cols-2 gap-4">
              {nearbyAttractions.map((attraction, index) => {
                const Icon = attraction.icon;
                return (
                  <div key={index} className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-100">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-6 w-6 text-blue-600" />
                    </div>
                    <p className="text-gray-700 font-medium">{attraction.text}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Premium Amenities */}
        <Card className="border-2 border-green-200 shadow-xl bg-white">
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Building2 className="h-7 w-7 text-green-600" />
              Premium Amenities
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {amenities.map((amenity, index) => {
                const Icon = amenity.icon;
                return (
                  <Card key={index} className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-teal-50 hover:shadow-lg transition-all">
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-3">
                        <Icon className="h-6 w-6 text-green-600" />
                      </div>
                      <p className="text-sm font-semibold text-gray-900">{amenity.name}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
