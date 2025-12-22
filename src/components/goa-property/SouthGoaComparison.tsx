"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

interface Advantage {
  param: string;
  value: string;
}

interface SouthGoaComparisonProps {
  advantages: Advantage[];
}

export default function SouthGoaComparison({ advantages }: SouthGoaComparisonProps) {
  return (
    <section className="py-16 px-4 bg-white">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">
            Why Goa is the Smart Investment Choice
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Compare the investment advantages of Goa
          </p>
        </div>

        <Card className="shadow-xl border-2 border-teal-100">
          <CardHeader className="bg-gradient-to-r from-teal-50 to-cyan-50">
            <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-teal-600" />
              Goa Investment Advantages
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-teal-200">
                    <th className="text-left py-4 px-4 font-bold text-gray-900">Parameter</th>
                    <th className="text-left py-4 px-4 font-bold text-teal-600">Goa Advantage</th>
                  </tr>
                </thead>
                <tbody>
                  {advantages.map((advantage, index) => (
                    <tr
                      key={index}
                      className={`border-b border-gray-100 ${
                        index % 2 === 0 ? "bg-teal-50/30" : "bg-white"
                      }`}
                    >
                      <td className="py-4 px-4 font-semibold text-gray-900">
                        {advantage.param}
                      </td>
                      <td className="py-4 px-4 text-gray-700">
                        {advantage.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

