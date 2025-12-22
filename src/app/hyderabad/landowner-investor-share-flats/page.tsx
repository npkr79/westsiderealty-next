import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { getLandownerInvestorProjects } from "@/lib/supabase/landowner-projects";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { HeroSection } from "./components/HeroSection";
import { ExplanationSection } from "./components/ExplanationSection";
import { BenefitsGrid } from "./components/BenefitsGrid";
import { LandownerProjectsGrid } from "@/components/landowner/LandownerProjectsGrid";
import { FAQSection } from "./components/FAQSection";
import { SEOContent } from "./components/SEOContent";
import { CTASection } from "./components/CTASection";

const LANDOWNER_CANONICAL_URL =
  "https://www.westsiderealty.in/hyderabad/landowner-investor-share-flats";

// Hero / social preview banner (1200x630 recommended)
const LANDOWNER_OG_IMAGE =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/landowner-share-banner-1200x630.jpg";

export async function generateMetadata(): Promise<Metadata> {
  const title = "Landowner Share Flats in Hyderabad | 15% Cheaper than Builder Price";
  const description =
    "Buy landowner share & investor share apartments in Hyderabad at 10-15% below market rates. RERA approved projects in Gachibowli, Kokapet, Narsingi. Direct from landowners.";

  return {
    title,
    description,
    keywords: [
      "landowner share flats hyderabad",
      "investor share apartments hyderabad",
      "landowner units hyderabad",
      "investor flats gachibowli",
      "below market price flats hyderabad",
      "landowner share meaning",
      "what is investor share in real estate",
      "discounted flats hyderabad",
      "landowner quota apartments",
      "investor share units kokapet",
      "bulk deal flats hyderabad",
      "pre-launch investor flats",
      "landowner share vs builder flats",
    ].join(", "),
    alternates: {
      canonical: LANDOWNER_CANONICAL_URL,
    },
    openGraph: {
      title,
      description,
      url: LANDOWNER_CANONICAL_URL,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
      images: [
        {
          url: LANDOWNER_OG_IMAGE,
          width: 1200,
          height: 630,
          alt: "Landowner & Investor Share Flats in Hyderabad",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [LANDOWNER_OG_IMAGE],
    },
  };
}

interface PageContent {
  h1_title: string | null;
  hero_description: string | null;
  what_is_landowner_share: string | null;
  what_is_investor_share: string | null;
  why_buy_content: string | null;
  benefits_json: any;
  faqs_json: any;
}

export default async function LandownerInvestorSharePage() {
  const supabase = await createClient();

  // Fetch projects from projects table with has_landowner_investor_share = true
  const projects = await getLandownerInvestorProjects();
  
  console.log(`[LandownerSharePage] Fetched ${projects.length} projects with landowner/investor share`);

  // Fetch page content
  const { data: contentData, error: contentError } = await supabase
    .from("landowner_page_content")
    .select("*")
    .eq("city_slug", "hyderabad")
    .maybeSingle();

  if (contentError) {
    console.error("Error fetching page content:", contentError);
  }

  const content = (contentData || {}) as PageContent;

  // Default content if not in database
  const h1Title = content.h1_title || "Landowner & Investor Share Flats in Hyderabad";
  const heroDescription =
    content.hero_description ||
    "Get premium apartments at 10-15% below market price. Direct from landowners and early investors in top projects across Gachibowli, Kokapet, Financial District & more.";

  const whatIsLandownerShare =
    content.what_is_landowner_share ||
    "Landowner share units are apartments allocated to the original land owner as part of a joint development agreement (JDA) with the builder. Instead of selling land outright, landowners receive a percentage of constructed units (typically 25-35%) as compensation.";

  const whatIsInvestorShare =
    content.what_is_investor_share ||
    "Investor share units are apartments purchased by early investors during pre-launch or construction phase at discounted rates. These investors now wish to exit their investment, often offering units below current market price for quick sale.";

  const whyBuyContent =
    content.why_buy_content ||
    "Smart buyers choose landowner and investor shares for significant savings without compromising on quality or legality.";

  // Parse benefits from JSON or use defaults
  let benefits = [];
  if (content.benefits_json) {
    try {
      benefits = typeof content.benefits_json === "string" ? JSON.parse(content.benefits_json) : content.benefits_json;
    } catch (e) {
      console.error("Error parsing benefits_json:", e);
    }
  }

  // Parse FAQs from JSON or use defaults (will be combined with high-value FAQs later)
  let faqs = [];
  if (content.faqs_json) {
    try {
      faqs = typeof content.faqs_json === "string" ? JSON.parse(content.faqs_json) : content.faqs_json;
    } catch (e) {
      console.error("Error parsing faqs_json:", e);
    }
  }

  // Calculate stats
  const totalProjects = projects.length;

  // High-value FAQs for schema (always include these 3)
  const highValueFAQs = [
    {
      question: "Are landowner share flats legal?",
      answer: "Yes, they are 100% legal units allocated to the land owner via a registered Joint Development Agreement (JDA).",
    },
    {
      question: "Why are they cheaper?",
      answer: "Landowners often sell at a lower rate for quick liquidity, offering a 10-15% discount vs. builder prices.",
    },
    {
      question: "Can I get a bank loan?",
      answer: "Yes, all major banks provide loans for landowner share units in RERA-approved projects.",
    },
  ];

  // Combine high-value FAQs with database FAQs (if any)
  const allFAQs = [...highValueFAQs, ...faqs];

  const pageUrl = LANDOWNER_CANONICAL_URL;

  // Build ItemList primary entity
  const primaryEntity = {
    "@type": "ItemList",
    name: "Landowner Share Projects in Hyderabad",
    numberOfItems: totalProjects,
    itemListElement: projects.map((project, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "RealEstateListing",
        name: project.project_name,
        url: `https://www.westsiderealty.in/hyderabad/projects/${project.url_slug}`,
        address: {
          "@type": "PostalAddress",
          addressLocality: project.micro_market?.micro_market_name || "Hyderabad",
          addressRegion: "Telangana",
          addressCountry: "IN",
        },
        offers: {
          "@type": "Offer",
          priceCurrency: "INR",
          price: "Check Price",
          description: "10-15% Discount on Market Price",
        },
      },
    })),
  };

  // Generate unified schema using the utility
  const unifiedSchema = generateUnifiedSchema({
    pageUrl,
    title: "Landowner Share Flats in Hyderabad | 15% Cheaper than Builder Price",
    description:
      "Buy landowner share & investor share apartments in Hyderabad at 10-15% below market rates. RERA approved projects in Gachibowli, Kokapet, Narsingi. Direct from landowners.",
    heroImageUrl: LANDOWNER_OG_IMAGE,
    primaryEntityType: "ItemList",
    primaryEntity,
    faqItems: allFAQs.map((faq: any) => ({
      question: faq.question || faq.q || "",
      answer: faq.answer || faq.a || "",
    })),
    breadcrumbs: [
      { name: "Home", item: "https://www.westsiderealty.in" },
      { name: "Hyderabad", item: "https://www.westsiderealty.in/hyderabad" },
      { name: "Landowner & Investor Share Flats", item: pageUrl },
    ],
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Hyderabad", href: "/hyderabad" },
    { name: "Landowner & Investor Share Flats", href: "/hyderabad/landowner-investor-share-flats" },
  ];

  return (
    <>
      {/* Unified JSON-LD graph: Organization, WebSite, WebPage, ItemList, FAQPage */}
      <JsonLd jsonLd={unifiedSchema} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <HeroSection title={h1Title} description={heroDescription} totalProjects={totalProjects} totalUnits={0} />

        <ExplanationSection
          landownerShare={whatIsLandownerShare}
          investorShare={whatIsInvestorShare}
        />

        <BenefitsGrid benefits={benefits} whyBuyContent={whyBuyContent} />

        <LandownerProjectsGrid projects={projects} />

        <FAQSection faqs={allFAQs} />

        <SEOContent />

        <CTASection />
      </div>
    </>
  );
}

