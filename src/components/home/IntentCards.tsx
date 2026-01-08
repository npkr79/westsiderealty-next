"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, Home, Search } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export default function IntentCards() {
  const cards = [
    {
      title: "Want to Sell your Property?",
      description: "Get a free valuation and connect with verified buyers",
      link: "/sell-property",
      icon: Home,
      gradient: "from-blue-500 to-blue-600",
    },
    {
      title: "Have a specific requirement?",
      description: "Tell us what you're looking for, and we'll find the perfect match",
      link: "/buying-requirement",
      icon: Search,
      gradient: "from-green-500 to-green-600",
    },
    {
      title: "Landowner Share Properties",
      description: "Explore exclusive landowner and investor share opportunities",
      link: "https://www.westsiderealty.in/hyderabad/landowner-investor-share-flats",
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-600",
      external: true,
    },
  ];

  return (
    <section className="py-16 px-4 bg-slate-50">
      <div className="container mx-auto max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">How can we help you today?</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're buying, selling, or investing, we're here to guide you every step of the way.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card, index) => {
            const Icon = card.icon;
            const isExternal = card.external || card.link.startsWith("http");

            const CardContentWrapper = isExternal ? (
              <a
                href={card.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block h-full"
              >
                <CardContent className="p-8 h-full flex flex-col cursor-pointer group">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 flex-grow">{card.description}</p>
                  <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                </CardContent>
              </a>
            ) : (
              <Link href={card.link} className="block h-full">
                <CardContent className="p-8 h-full flex flex-col cursor-pointer group">
                  <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground mb-6 flex-grow">{card.description}</p>
                  <div className="flex items-center text-primary font-semibold group-hover:gap-2 transition-all">
                    Get Started <ArrowRight className="ml-2 w-5 h-5" />
                  </div>
                </CardContent>
              </Link>
            );

            return (
              <Card
                key={index}
                className="overflow-hidden bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all border border-gray-200 hover:border-primary/50 h-full"
              >
                {CardContentWrapper}
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
