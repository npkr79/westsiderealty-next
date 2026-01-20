"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Quote } from "lucide-react";

const testimonials = [
  {
    name: "Naveen",
    role: "The Strategist",
    headline: "From Zero Closures to Consistent Deals",
    quote:
      "I spent a fortune on portals individually with zero results. Joining the Westside system changed everything. With their brand authority and lead support, I moved from struggling solo to closing a deal every two months like clockwork.",
    tags: ["System Support", "Consistent Growth"],
  },
  {
    name: "Krishna",
    role: "The Strategist",
    headline: "Hospitality to Top Performance in 6 Months",
    quote:
      "Coming from hospitality, the transition was seamless. It’s a win-win: I contribute the inventory, and the brand helps me sell it. The system made me comfortable instantly, and I'm already closing 2 deals a month.",
    tags: ["Career Switch", "Fast Track"],
  },
  {
    name: "Srinivas",
    role: "The Commander",
    headline: "Stability in a Complex Market",
    quote:
      "The resale market is tough, but the guidance here is exceptional. I've been with the company for 1.5 years because the lead support and professional environment give me the comfort and confidence to operate without the usual stress.",
    tags: ["Resale Market", "Long-term Support"],
  },
];

export function SuccessStoriesSection() {

  return (
    <section className="container mx-auto px-4 py-16 md:py-24 bg-slate-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Real Agents. Real Growth.
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
            Professionals who chose a system over solo struggle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((story) => (
            <Card
              key={story.name}
              className="border border-slate-200 bg-white shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <CardContent className="p-6 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                    {story.role}
                  </p>
                  <h3 className="text-xl font-semibold text-foreground">{story.headline}</h3>
                </div>
                <div className="relative">
                  <Quote className="absolute -top-2 -left-2 h-8 w-8 text-primary/20" />
                  <p className="text-muted-foreground leading-relaxed pl-6">
                    {story.quote}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {story.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-primary"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                <div className="pt-2 text-sm font-semibold text-foreground">
                  {story.name}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
