"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Calendar, Award } from "lucide-react";

interface DeveloperSectionProps {
  developer: {
    name: string;
    legacy: string;
    stats: {
      areaDelivered: string;
      happyCustomers: string;
      yearsLegacy: string;
      projectsDelivered: string;
    };
    locations: string;
  };
}

export default function DeveloperSection({ developer }: DeveloperSectionProps) {
  return (
    <section className="py-16 px-4 bg-gradient-to-br from-gray-50 to-teal-50/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Trusted Developer: {developer.name}
          </h2>
          <p className="text-xl text-teal-600 font-semibold mb-2">
            {developer.legacy}
          </p>
          <p className="text-gray-600">
            Operating in {developer.locations}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          <Card className="text-center border-2 border-teal-100 hover:border-teal-400 transition-all">
            <CardContent className="p-6">
              <Building2 className="h-10 w-10 mx-auto mb-4 text-teal-600" />
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {developer.stats.areaDelivered}
              </div>
              <p className="text-sm text-gray-600">Area Delivered</p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-teal-100 hover:border-teal-400 transition-all">
            <CardContent className="p-6">
              <Users className="h-10 w-10 mx-auto mb-4 text-teal-600" />
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {developer.stats.happyCustomers}
              </div>
              <p className="text-sm text-gray-600">Happy Customers</p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-teal-100 hover:border-teal-400 transition-all">
            <CardContent className="p-6">
              <Calendar className="h-10 w-10 mx-auto mb-4 text-teal-600" />
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {developer.stats.yearsLegacy}
              </div>
              <p className="text-sm text-gray-600">Years of Excellence</p>
            </CardContent>
          </Card>

          <Card className="text-center border-2 border-teal-100 hover:border-teal-400 transition-all">
            <CardContent className="p-6">
              <Award className="h-10 w-10 mx-auto mb-4 text-teal-600" />
              <div className="text-3xl font-bold text-gray-900 mb-2">
                {developer.stats.projectsDelivered}
              </div>
              <p className="text-sm text-gray-600">Projects Delivered</p>
            </CardContent>
          </Card>
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap justify-center gap-4">
          <Badge className="bg-teal-600 text-white px-6 py-3 text-lg">
            RERA Approved
          </Badge>
          <Badge className="bg-teal-600 text-white px-6 py-3 text-lg">
            Trusted Builder
          </Badge>
          <Badge className="bg-teal-600 text-white px-6 py-3 text-lg">
            70+ Years Legacy
          </Badge>
          <Badge className="bg-teal-600 text-white px-6 py-3 text-lg">
            Timely Delivery
          </Badge>
        </div>
      </div>
    </section>
  );
}

