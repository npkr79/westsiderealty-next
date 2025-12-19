"use client";

import { Building2, Palmtree, Landmark } from "lucide-react";

export default function ServicesHeroSection() {
  return (
    <>
      {/* Section 1: Dark blue gradient header */}
      <section className="bg-gradient-to-b from-blue-900 to-blue-800 text-white py-20">
        <div className="container mx-auto px-4">
          <span className="inline-block px-4 py-2 bg-blue-700/50 rounded-full text-sm mb-6">
            END-TO-END REAL ESTATE ADVISORY
          </span>
          <h1 className="text-4xl md:text-5xl font-bold max-w-4xl">
            One Team for Hyderabad Premium Properties, Goa Holiday Homes & Dubai Investments.
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-2xl">
            Work with specialists who understand premium properties, second homes, and global investments.
            We curate inventory, negotiate on your behalf, and manage the transaction till registration.
          </p>
        </div>
      </section>

      {/* Section 2: Lighter blue with service cards */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Service cards with semi-transparent white backgrounds */}
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <Building2 className="w-10 h-10 mb-4 text-white" />
              <h3 className="font-bold text-lg text-white">Hyderabad Premium Properties</h3>
              <p className="text-blue-100 text-sm mt-2">
                Kokapet, Neopolis, Financial District, Gachibowli & Gandipet
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <Palmtree className="w-10 h-10 mb-4 text-white" />
              <h3 className="font-bold text-lg text-white">Goa Holiday Homes</h3>
              <p className="text-blue-100 text-sm mt-2">
                Villas & apartments curated for rental yield and appreciation
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-6 border border-white/20">
              <Landmark className="w-10 h-10 mb-4 text-white" />
              <h3 className="font-bold text-lg text-white">Dubai Investments</h3>
              <p className="text-blue-100 text-sm mt-2">
                Off-plan & rental-assured projects in marquee communities
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: White/light background for "How We Help" */}
      <section className="bg-slate-50 py-16">
        <div className="container mx-auto px-4">
          <div className="bg-white rounded-2xl p-8 shadow-lg max-w-4xl mx-auto">
            <h2 className="font-bold text-xl text-slate-900 mb-6">HOW WE HELP</h2>
            <ul className="space-y-3 text-slate-700">
              <li>• Curated shortlists instead of endless online browsing.</li>
              <li>• Property comparisons with on-ground pros & cons.</li>
              <li>• Negotiation support with sellers and developers.</li>
              <li>• Coordination with banks, lawyers, and registration offices.</li>
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}


