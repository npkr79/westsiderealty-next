"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, Award, MapPin } from "lucide-react";

export default function DeveloperSection() {
  const stats = [
    { icon: Building2, label: "Area Delivered", value: "6+ Million Sq. Ft." },
    { icon: Users, label: "Happy Customers", value: "14,000+" },
    { icon: Award, label: "Years Legacy", value: "71 Years" },
    { icon: MapPin, label: "Projects Delivered", value: "46+" }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-b from-white to-teal-50/30">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            About Devika Group
          </h2>
          <p className="text-xl text-teal-600 font-semibold mb-2">
            70+ Years of Building Excellence Since 1954
          </p>
          <p className="text-gray-600">
            Trusted Developer | Delhi, Uttar Pradesh, Goa
          </p>
        </div>

        <Card className="border-2 border-teal-200 shadow-xl bg-white">
          <CardContent className="p-8 md:p-12">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  Devika Group Legacy
                </h3>
                <p className="text-gray-700 leading-relaxed mb-6">
                  With over 70 years of excellence since 1954, Devika Group has established itself as a trusted name in real estate development. The group has successfully delivered 46+ projects across 6+ million sq.ft, creating homes for 14,000+ happy customers.
                </p>
                <p className="text-gray-700 leading-relaxed">
                  Operating across Delhi, Uttar Pradesh, and Goa, Devika Group brings unmatched expertise and commitment to quality in every project, including Aerocidade.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {stats.map((stat, index) => {
                  const Icon = stat.icon;
                  return (
                    <Card key={index} className="border-2 border-teal-100 bg-teal-50/50">
                      <CardContent className="p-6 text-center">
                        <Icon className="h-8 w-8 mx-auto mb-3 text-teal-600" />
                        <p className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</p>
                        <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <div className="mt-8 pt-8 border-t-2 border-teal-200">
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge className="bg-teal-100 text-teal-800 border-0 px-4 py-2 text-sm font-semibold">
                  Trusted Developer
                </Badge>
                <Badge className="bg-cyan-100 text-cyan-800 border-0 px-4 py-2 text-sm font-semibold">
                  70+ Years Legacy
                </Badge>
                <Badge className="bg-blue-100 text-blue-800 border-0 px-4 py-2 text-sm font-semibold">
                  46+ Projects Delivered
                </Badge>
                <Badge className="bg-green-100 text-green-800 border-0 px-4 py-2 text-sm font-semibold">
                  14,000+ Happy Customers
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

