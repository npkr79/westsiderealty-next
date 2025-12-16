"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ServicesSection() {
  const services = [
    {
      title: "Hyderabad Resale Advisory",
      description: "Expert guidance for buying and selling resale apartments and villas in West Hyderabad.",
    },
    {
      title: "Goa Holiday Homes",
      description: "Curated villas and apartments with strong rental potential in North & South Goa.",
    },
    {
      title: "Dubai Investments",
      description: "Global investment opportunities with high ROI in Dubai’s prime communities.",
    },
  ];

  return (
    <section className="py-10 bg-muted/40">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-center">What We Help You With</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {services.map((service) => (
            <Card key={service.title}>
              <CardHeader>
                <CardTitle>{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{service.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}


