import { Card, CardContent } from "@/components/ui/card";

export function SEOContent() {
  return (
    <section className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Buy Landowner & Investor Share Apartments in Hyderabad
          </h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Looking for landowner share flats in Hyderabad? You've come to the right place. Westside Realty specializes
            in helping home buyers find verified landowner share units and investor share apartments across premium
            projects in Gachibowli, Kokapet, Financial District, Narsingi, Tellapur, and other prime locations in
            Hyderabad.
          </p>
        </div>

        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">What Makes Landowner Shares Attractive?</h3>
            <p className="text-muted-foreground leading-relaxed">
              When builders enter into Joint Development Agreements (JDAs) with landowners, the landowners receive a
              portion of the constructed units as compensation. These landowner quota apartments are often sold at
              10-15% below the builder's listed price, offering significant savings to smart buyers.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Investor Share Units in Hyderabad Real Estate</h3>
            <p className="text-muted-foreground leading-relaxed">
              Investor share units are apartments purchased by early investors during pre-launch phases. As projects
              near completion, these investors often exit their investments, offering units at below market prices for
              quick sales. This creates opportunities for end-users to purchase ready or near-ready apartments at
              discounted rates.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Top Locations for Landowner Share Flats</h3>
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-muted-foreground">
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Gachibowli - IT hub with premium projects</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Kokapet - Emerging luxury destination</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Financial District - Close to major tech parks</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Narsingi - Well-connected residential area</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Tellapur - Affordable luxury options</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="text-primary font-semibold">•</span>
                <span>Nallagandla - Established residential zone</span>
              </li>
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Why Choose Westside Realty?</h3>
            <p className="text-muted-foreground leading-relaxed">
              With years of experience in Hyderabad's real estate market, we have direct relationships with landowners
              and investors across 50+ premium projects. Our team verifies all documentation, negotiates best prices, and
              ensures a smooth transaction process. Contact us today to explore available landowner and investor share
              flats in Hyderabad.
            </p>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

