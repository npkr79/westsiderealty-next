import type { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";

export const metadata: Metadata = buildMetadata({
  title: "Sell Your Property in Hyderabad | Westside Realty",
  description: "Get the best price for your Hyderabad property. Westside Realty offers expert valuation, targeted marketing and end-to-end selling support in West Hyderabad.",
  canonicalUrl: "https://www.westsiderealty.in/sell-property",
});

export default function SellPropertyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
