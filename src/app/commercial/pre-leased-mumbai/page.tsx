import type { Metadata } from "next";
import { buildMetadata, JsonLd } from "@/components/common/SEO";
import Hero from "./components/Hero";
import MarketStats from "./components/MarketStats";
import OpportunitiesTable from "./components/OpportunitiesTable";
import InvestorAnalysis from "./components/InvestorAnalysis";
import MicroMarkets from "./components/MicroMarkets";
import FAQAccordion from "./components/FAQAccordion";
import InquiryForm from "./components/InquiryForm";
import { PROPERTIES, FAQS } from "./data";

const PAGE_URL = "https://www.westsiderealty.in/commercial/pre-leased-mumbai";
const OG_IMAGE = "https://www.westsiderealty.in/api/og/commercial-mumbai";

export const metadata: Metadata = buildMetadata({
  title: "Pre-Leased Commercial Property in Mumbai | 11 Exclusive Investment Opportunities | Remax Westside Realty",
  description:
    "Curated pre-leased commercial properties in Mumbai (Bandra, Santacruz, Khar, Malad, Thane) from ₹11 Cr to ₹70 Cr. Yields 4.9–6.66%. Bank, showroom, office & restaurant tenants. RERA-compliant. Institutional-grade investments by Remax Westside Realty.",
  canonicalUrl: PAGE_URL,
  imageUrl: OG_IMAGE,
  keywords:
    "pre-leased commercial property Mumbai, commercial real estate Mumbai 2026, Bandra commercial investment, Santacruz commercial shop for sale, Mumbai commercial property yield, pre-leased shop Bandra West, commercial investment Mumbai, Mumbai real estate HNI, Remax Westside Realty",
});

const breadcrumbSchema = {
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [
    { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
    { "@type": "ListItem", position: 2, name: "Commercial", item: "https://www.westsiderealty.in/commercial-investments" },
    { "@type": "ListItem", position: 3, name: "Pre-Leased Mumbai Opportunities", item: PAGE_URL },
  ],
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const listingSchema = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Pre-Leased Commercial Properties in Mumbai",
  url: PAGE_URL,
  numberOfItems: PROPERTIES.length,
  itemListElement: PROPERTIES.map((p, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "RealEstateListing",
      name: p.name,
      description: p.notes,
      address: {
        "@type": "PostalAddress",
        addressLocality: p.location,
        addressRegion: "Maharashtra",
        addressCountry: "IN",
      },
      offers: {
        "@type": "Offer",
        price: p.askingPriceNum * 10000000,
        priceCurrency: "INR",
      },
      ...(p.areaSqftNum > 0 && {
        floorSize: { "@type": "QuantitativeValue", value: p.areaSqftNum, unitCode: "FTK" },
      }),
      additionalProperty: p.yieldNum > 0
        ? [{ "@type": "PropertyValue", name: "Rental Yield", value: `${p.yield}` }]
        : [],
    },
  })),
};

export default function PreLeasedMumbaiPage() {
  return (
    <>
      <JsonLd jsonLd={[breadcrumbSchema, faqSchema, listingSchema]} />
      <main>
        <Hero />
        <MarketStats />
        <OpportunitiesTable properties={PROPERTIES} />
        <InvestorAnalysis />
        <MicroMarkets />
        <FAQAccordion faqs={FAQS} />
        <InquiryForm />

        {/* Legal disclaimer */}
        <section style={{ background: "#070707", borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px" }}>
          <div style={{ maxWidth: 960, margin: "0 auto" }}>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", lineHeight: 1.7, margin: 0 }}>
              All information presented is sourced from property owners and third-party brokers and is believed to be accurate at the time of publication. Figures, tenancy terms, and availability are subject to change without notice. All investments in real estate are subject to market risk and should be made only after independent legal and financial due diligence. Remax Westside Realty acts as a facilitator and does not guarantee returns. RERA registration numbers available on request where applicable.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
