import type { Metadata } from "next";
import HomepageRedesign from "@/components/homepage/HomepageRedesign";

export const metadata: Metadata = {
  title: "Westside Realty — Premium Real Estate in Hyderabad, Goa & Dubai | Expert Advisory",
  description:
    "Hyderabad's trusted real estate advisors. RERA-verified apartments, villas & plots in Kokapet, Gachibowli, Financial District & Goa. Compare prices, floor plans & market intelligence.",
};

export const revalidate = 300;

export default function HomePage() {
  return <HomepageRedesign />;
}
