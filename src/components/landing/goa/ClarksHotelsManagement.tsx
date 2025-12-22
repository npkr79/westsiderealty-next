"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Key, 
  Building2, 
  Globe, 
  Users, 
  Award, 
  TrendingUp 
} from "lucide-react";

export default function ClarksHotelsManagement() {
  const benefits = [
    { 
      icon: Key, 
      title: "Hassle-Free Ownership", 
      desc: "Complete property key management – you own, they operate" 
    },
    { 
      icon: Building2, 
      title: "133+ Hotels Managed", 
      desc: "Proven track record across premium properties" 
    },
    { 
      icon: Globe, 
      title: "6 Countries", 
      desc: "International expertise including Sri Lanka, Nepal, Maldives" 
    },
    { 
      icon: Users, 
      title: "6000+ Keys", 
      desc: "Managing thousands of rooms with excellence" 
    },
    { 
      icon: Award, 
      title: "75+ Years Legacy", 
      desc: "Trusted hospitality brand since 1947" 
    },
    { 
      icon: TrendingUp, 
      title: "Maximized Returns", 
      desc: "Professional management ensures optimal rental income" 
    }
  ];

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      <div className="container mx-auto max-w-6xl">
        <Card className="border-2 border-amber-200 shadow-2xl bg-white">
          <CardContent className="p-8 md:p-12">
            <div className="text-center mb-8">
              <Badge className="mb-4 bg-amber-500 text-white border-0 px-6 py-2 text-lg font-semibold">
                Premium Hospitality Partnership
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                Professional Property Management by The Clarks Hotels & Resorts
              </h2>
              <p className="text-xl text-amber-700 font-semibold mb-4">
                India's Premier Hospitality Brand Since 1947
              </p>
              <p className="text-gray-700 leading-relaxed max-w-3xl mx-auto">
                Your investment is managed by The Clarks Hotels & Resorts – a leading hospitality company with 133+ hotels across 110+ destinations. Founded in 1947 and headquartered in Gurugram, they bring 75+ years of hospitality excellence to Aerocidade.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
              {benefits.map((benefit, index) => {
                const Icon = benefit.icon;
                return (
                  <Card key={index} className="border-2 border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 hover:shadow-xl transition-all">
                    <CardContent className="p-6">
                      <div className="flex flex-col items-center text-center">
                        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mb-4">
                          <Icon className="h-8 w-8 text-amber-600" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">
                          {benefit.title}
                        </h3>
                        <p className="text-sm text-gray-600 leading-relaxed">
                          {benefit.desc}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="mt-10 pt-8 border-t-2 border-amber-200">
              <div className="flex flex-wrap gap-3 justify-center">
                <Badge className="bg-amber-100 text-amber-800 border-0 px-4 py-2 text-sm font-semibold">
                  Founded 1947
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border-0 px-4 py-2 text-sm font-semibold">
                  133+ Hotels
                </Badge>
                <Badge className="bg-yellow-100 text-yellow-800 border-0 px-4 py-2 text-sm font-semibold">
                  110+ Destinations
                </Badge>
                <Badge className="bg-amber-100 text-amber-800 border-0 px-4 py-2 text-sm font-semibold">
                  6000+ Keys Managed
                </Badge>
                <Badge className="bg-orange-100 text-orange-800 border-0 px-4 py-2 text-sm font-semibold">
                  6 Countries
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

