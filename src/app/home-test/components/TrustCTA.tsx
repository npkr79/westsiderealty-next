"use client";

import { CheckCircle2, Shield, Award, Phone } from "lucide-react";
import Link from "next/link";

export default function TrustCTA() {
  const trustPoints = [
    { icon: CheckCircle2, text: "500+ Verified Properties" },
    { icon: Shield, text: "RERA Approved" },
    { icon: Award, text: "Partner Developers" },
  ];

  return (
    <section className="py-12 bg-gradient-to-br from-blue-600 to-blue-800 text-white">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center">
          {/* Trust Points */}
          <div className="flex flex-wrap justify-center gap-6 md:gap-12 mb-8">
            {trustPoints.map((point, index) => (
              <div
                key={index}
                className="flex items-center gap-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <point.icon className="w-6 h-6" />
                <span className="font-semibold text-lg">{point.text}</span>
              </div>
            ))}
          </div>

          {/* CTA Button */}
          <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
            <Link
              href="tel:+919866085831"
              className="inline-flex items-center gap-3 bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all shadow-2xl hover:scale-105"
            >
              <Phone className="w-6 h-6" />
              Talk to Our Expert Team
            </Link>
          </div>

          <p className="mt-6 text-blue-100 text-sm">
            Free consultation • No obligation • Expert guidance
          </p>
        </div>
      </div>
    </section>
  );
}
