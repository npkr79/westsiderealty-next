import type { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";

export const metadata: Metadata = buildMetadata({
  title: "Find Your Perfect Property | Buying Requirement | RE/MAX Westside Realty",
  description: "Tell us what you're looking for, and we'll match you with the best properties. Expert guidance, verified listings, and personalized matching for your property search.",
  canonicalUrl: "https://www.westsiderealty.in/buying-requirement",
});

export default function BuyingRequirementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
