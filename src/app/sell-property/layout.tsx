import type { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";

export const metadata: Metadata = buildMetadata({
  title: "Sell Your Property in Hyderabad & Goa | RE/MAX Westside Realty",
  description: "Get the best price for your Hyderabad or Goa property. Expert valuation, targeted marketing, and end-to-end selling support by RE/MAX Westside Realty.",
  canonicalUrl: "https://www.westsiderealty.in/sell-property",
  keywords: "sell property hyderabad, sell apartment hyderabad, property valuation hyderabad, sell villa goa, goa property sale",
});

export default function SellPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
