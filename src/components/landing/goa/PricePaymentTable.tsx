"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Calendar, TrendingUp } from "lucide-react";
import type { LandingPageConfiguration } from "@/types/landingPage";

interface PricePaymentTableProps {
  configurations: LandingPageConfiguration[];
}

export default function PricePaymentTable({ configurations }: PricePaymentTableProps) {
  const config = configurations[0];
  const price = config?.starting_price || 5529000;
  const priceDisplay = config?.price_display || "₹55.29 Lakhs*";
  const unitType = config?.unit_type || "Studio Apartment";
  const sizeMin = config?.size_min || 348.65;
  const sizeMax = config?.size_max || 348.65;

  const paymentPlan = [
    { stage: "Booking", percentage: "50%", description: "On booking" },
    { stage: "After 1 Year", percentage: "25%", description: "After 1 year", note: "after 1 year" },
    { stage: "On Possession", percentage: "25%", description: "On possession" }
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Pricing & Payment Plan
          </h2>
          <p className="text-lg text-gray-600">
            Transparent pricing with flexible payment options
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Price Card */}
          <Card className="border-2 border-teal-200 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center">
                  <IndianRupee className="h-6 w-6 text-teal-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Unit Pricing</h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Unit Type</span>
                  <span className="font-semibold text-gray-900">{unitType}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Size</span>
                  <span className="font-semibold text-gray-900">582 sq.ft</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b">
                  <span className="text-gray-600">Rate</span>
                  <span className="font-semibold text-gray-900">₹9,500/sq.ft</span>
                </div>
                <div className="pt-4">
                  <div className="bg-teal-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-2">Total Price</p>
                    <p className="text-3xl font-bold text-teal-600">{priceDisplay}</p>
                  </div>
                </div>
                <div className="pt-2">
                  <Badge className="bg-green-100 text-green-800 border-0">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    12% Yield
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Plan Card */}
          <Card className="border-2 border-cyan-200 shadow-xl">
            <CardContent className="p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-cyan-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Payment Plan</h3>
              </div>
              
              <div className="space-y-4">
                {paymentPlan.map((plan, index) => (
                  <div key={index} className="flex items-center gap-4 pb-4 border-b last:border-0">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 rounded-full bg-cyan-100 flex items-center justify-center">
                        <span className="text-cyan-600 font-bold">{plan.percentage}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {plan.stage}
                        {plan.note && <span className="text-xs font-normal text-gray-500 ml-2">({plan.note})</span>}
                      </p>
                      <p className="text-sm text-gray-600">{plan.description}</p>
                    </div>
                  </div>
                ))}
                <div className="pt-4 bg-cyan-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Flexible Payment Schedule</p>
                  <p className="text-xs text-gray-500">50% Booking | 25% (after 1 year) | 25% On Possession</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

