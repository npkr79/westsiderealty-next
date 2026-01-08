import type { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";

export const metadata: Metadata = buildMetadata({
  title: "Sell Your Property | Free Valuation & Buyer List | RE/MAX Westside Realty",
  description: "Sell your property with confidence. Get a free valuation, expert guidance, and connect with verified buyers. Fast, transparent, and hassle-free selling experience.",
  canonicalUrl: "https://www.westsiderealty.in/sell-property",
});

export default function SellPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
