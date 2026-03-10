import type { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";

export const metadata: Metadata = buildMetadata({
  title: "Find Your Ideal Property in Hyderabad | Westside Realty",
  description: "Tell us what you're looking for and we'll find the perfect property in Hyderabad. Apartments, villas, commercial spaces — Westside Realty finds your match.",
  canonicalUrl: "https://www.westsiderealty.in/buying-requirement",
});

export default function BuyingRequirementLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
