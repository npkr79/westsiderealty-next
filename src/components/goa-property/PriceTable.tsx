"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, Home, TrendingUp } from "lucide-react";

interface PriceTableProps {
  data: {
    unitConfig: {
      type: string;
      size: string;
      builtUpArea: string;
      rate: string;
      totalPrice: string;
      monthlyRental: string;
      totalUnits: number;
      floors: number;
    };
    paymentPlan: Array<{
      stage: string;
      percentage: string;
    }>;
  };
}

export default function PriceTable({ data }: PriceTableProps) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Unit Configuration & Pricing
          </h2>
          <p className="text-lg text-gray-600">
            Transparent pricing with flexible payment options
          </p>
        </div>

        {/* Pricing Table */}
        <Card className="mb-12 shadow-lg border-2 border-teal-100">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-2xl font-bold text-gray-900">
              Studio Apartment Details
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Unit Type</span>
                  <span className="font-bold text-gray-900">{data.unitConfig.type}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Carpet Area</span>
                  <span className="font-bold text-gray-900">{data.unitConfig.size}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Built-up Area</span>
                  <span className="font-bold text-gray-900">{data.unitConfig.builtUpArea}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Rate per Sq.ft</span>
                  <span className="font-bold text-teal-600">{data.unitConfig.rate}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Total Price</span>
                  <span className="font-bold text-2xl text-teal-600">{data.unitConfig.totalPrice}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Monthly Rental Potential</span>
                  <span className="font-bold text-teal-600">{data.unitConfig.monthlyRental}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b">
                  <span className="text-gray-600 font-medium">Total Units</span>
                  <span className="font-bold text-gray-900">{data.unitConfig.totalUnits}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-gray-600 font-medium">Floors</span>
                  <span className="font-bold text-gray-900">{data.unitConfig.floors}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Plan */}
        <Card className="shadow-lg border-2 border-teal-100">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <IndianRupee className="h-6 w-6 text-teal-600" />
              Flexible Payment Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid md:grid-cols-3 gap-6">
              {data.paymentPlan.map((plan, index) => (
                <div
                  key={index}
                  className="text-center p-6 bg-gradient-to-br from-teal-50 to-cyan-50 rounded-lg border-2 border-teal-200"
                >
                  <div className="text-4xl font-bold text-teal-600 mb-2">
                    {plan.percentage}
                  </div>
                  <div className="text-lg font-semibold text-gray-900 mb-1">
                    {plan.stage}
                  </div>
                  <div className="text-sm text-gray-600">
                    {index === 0 && "At time of booking"}
                    {index === 1 && "During construction"}
                    {index === 2 && "On possession"}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-sm text-amber-800">
                <strong>Note:</strong> *Price mentioned is indicative and subject to change. 
                Please contact us for the latest pricing and availability.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

