import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { MapPin, ArrowRight } from "lucide-react";
import type { MicroMarketCacheRow } from "@/services/microMarketViewModel";

interface MicroMarketsHubContentProps {
  markets: MicroMarketCacheRow[];
  citySlug: string;
  cityName: string;
}

function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function truncate(text: string, max = 120): string {
  const cleaned = stripHtml(text);
  return cleaned.length > max ? `${cleaned.slice(0, max - 1)}…` : cleaned;
}

function getAvgPrice(row: MicroMarketCacheRow): number | null {
  const min = row.price_per_sqft_min;
  const max = row.price_per_sqft_max;
  if (min != null && max != null) return (min + max) / 2;
  return min ?? max ?? null;
}

function isHighGrowth(row: MicroMarketCacheRow): boolean {
  return (row.annual_appreciation_min ?? 0) > 12;
}

function getBadges(row: MicroMarketCacheRow): string[] {
  const badges: string[] = [];
  if ((row.annual_appreciation_min ?? 0) >= 15) badges.push("Top Pick");
  if ((row.rental_yield_min ?? 0) >= 4) badges.push("High Yield");
  return badges;
}

function MarketGrid({
  markets,
  citySlug,
}: {
  markets: MicroMarketCacheRow[];
  citySlug: string;
}) {
  if (markets.length === 0) {
    return (
      <div className="py-12 text-center">
        <MapPin className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <h3 className="text-lg font-medium">No markets in this category</h3>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {markets.map((market) => {
        const badges = getBadges(market);
        const avgPrice = getAvgPrice(market);
        const appreciation = market.annual_appreciation_min
          ? `${market.annual_appreciation_min}%+`
          : "—";
        const rental = market.rental_yield_min ? `${market.rental_yield_min}%+` : "—";

        return (
          <Card
            key={market.id}
            className="overflow-hidden border-l-4 border-l-primary/50 transition hover:shadow-lg"
          >
            <div className="relative h-40 bg-gradient-to-br from-primary/20 to-primary/5">
              <div className="absolute inset-0 flex items-center justify-center">
                <MapPin className="h-12 w-12 text-primary/40" />
              </div>
              <div className="absolute right-4 top-4 flex flex-col gap-2">
                {badges.map((b) => (
                  <Badge
                    key={b}
                    className={
                      b === "Top Pick" ? "bg-amber-500 text-white" : "bg-emerald-600 text-white"
                    }
                  >
                    {b}
                  </Badge>
                ))}
              </div>
              <h3 className="absolute bottom-4 left-4 text-xl font-bold text-foreground">
                {market.micro_market_name ?? "Market"}
              </h3>
            </div>
            <CardContent className="p-4 space-y-4">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-lg bg-muted/50 p-2 text-center">
                  <p className="text-xs text-muted-foreground">Price/sqft</p>
                  <p className="text-sm font-semibold">
                    {avgPrice != null ? `₹${Math.round(avgPrice).toLocaleString()}` : "—"}
                  </p>
                </div>
                <div className="rounded-lg bg-emerald-50 p-2 text-center dark:bg-emerald-950/30">
                  <p className="text-xs text-muted-foreground">Growth</p>
                  <p className="text-sm font-semibold text-emerald-600">{appreciation}</p>
                </div>
                <div className="rounded-lg bg-blue-50 p-2 text-center dark:bg-blue-950/30">
                  <p className="text-xs text-muted-foreground">Yield</p>
                  <p className="text-sm font-semibold text-blue-600">{rental}</p>
                </div>
              </div>
              {market.hero_hook && (
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {truncate(market.hero_hook)}
                </p>
              )}
              <Button asChild className="w-full" variant="default">
                <Link href={`/${citySlug}/${market.url_slug ?? market.id}`}>
                  View Market <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default function MicroMarketsHubContent({
  markets,
  citySlug,
  cityName,
}: MicroMarketsHubContentProps) {
  const highGrowth = markets.filter(isHighGrowth);
  const luxury = markets.filter((m) => {
    const avg = getAvgPrice(m);
    return avg != null && avg > 10000;
  });
  const affordable = markets.filter((m) => {
    const avg = getAvgPrice(m);
    return avg != null && avg < 8000;
  });

  const comparisonData = markets.map((m) => ({
    name: m.micro_market_name ?? "—",
    priceRange:
      m.price_per_sqft_min != null && m.price_per_sqft_max != null
        ? `₹${m.price_per_sqft_min.toLocaleString()} – ₹${m.price_per_sqft_max.toLocaleString()}/sqft`
        : m.price_per_sqft_min != null
          ? `₹${m.price_per_sqft_min.toLocaleString()}/sqft+`
          : "—",
    growth: m.annual_appreciation_min ? `${m.annual_appreciation_min}%+` : "—",
    rental: m.rental_yield_min ? `${m.rental_yield_min}%+` : "—",
    url: `/${citySlug}/${m.url_slug ?? m.id}`,
  }));

  const faqs = [
    {
      question: `Which micro-market in ${cityName} offers the best ROI?`,
      answer: `Markets with 15%+ YoY appreciation show strong growth. ROI depends on your investment timeline and risk appetite.`,
    },
    {
      question: `What is the average price per sq.ft in ${cityName} micro-markets?`,
      answer: `Prices vary by corridor. Use the comparison table above to compare price ranges across markets.`,
    },
    {
      question: `How do I choose between luxury and affordable micro-markets?`,
      answer: `Luxury markets offer higher capital appreciation but require larger investment. Affordable markets provide better rental yields and entry-level opportunities.`,
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4">
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/${citySlug}`} className="hover:text-foreground">{cityName}</Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">Investment Areas</span>
        </nav>
      </div>

      <section className="border-b bg-muted/30 py-16">
        <div className="container mx-auto max-w-5xl px-4 text-center">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
            {cityName} Real Estate Micro-Market Insights
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            Compare property trends, prices, and investment potential across top localities.
          </p>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="mb-8 grid w-full max-w-md grid-cols-4 mx-auto">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="high-growth">High Growth</TabsTrigger>
            <TabsTrigger value="luxury">Luxury</TabsTrigger>
            <TabsTrigger value="affordable">Affordable</TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-8">
            <MarketGrid markets={markets} citySlug={citySlug} />
          </TabsContent>
          <TabsContent value="high-growth" className="mt-8">
            <MarketGrid markets={highGrowth} citySlug={citySlug} />
          </TabsContent>
          <TabsContent value="luxury" className="mt-8">
            <MarketGrid markets={luxury} citySlug={citySlug} />
          </TabsContent>
          <TabsContent value="affordable" className="mt-8">
            <MarketGrid markets={affordable} citySlug={citySlug} />
          </TabsContent>
        </Tabs>
      </section>

      {comparisonData.length > 0 && (
        <section className="border-t bg-muted/20 py-12">
          <div className="container mx-auto max-w-4xl px-4">
            <h2 className="mb-8 text-center text-2xl font-bold">Market Comparison</h2>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold">Market</TableHead>
                      <TableHead className="font-semibold">Price Range</TableHead>
                      <TableHead className="font-semibold">Growth</TableHead>
                      <TableHead className="font-semibold">Yield</TableHead>
                      <TableHead className="font-semibold">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {comparisonData.map((row, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium">
                          <Link href={row.url} className="text-primary hover:underline">
                            {row.name}
                          </Link>
                        </TableCell>
                        <TableCell>{row.priceRange}</TableCell>
                        <TableCell className="text-emerald-600 font-medium">{row.growth}</TableCell>
                        <TableCell>{row.rental}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" asChild>
                            <Link href={row.url}>View <ArrowRight className="ml-1 h-4 w-4" /></Link>
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      <section className="container mx-auto max-w-2xl px-4 py-16">
        <h2 className="mb-8 text-center text-2xl font-bold">FAQs</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, i) => (
            <AccordionItem key={i} value={`faq-${i}`}>
              <AccordionTrigger className="text-left font-medium">{faq.question}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{faq.answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
