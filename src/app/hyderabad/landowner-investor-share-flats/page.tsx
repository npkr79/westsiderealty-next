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

  // Comprehensive FAQs for landowner and investor share flats
  const comprehensiveFAQs = [
    {
      question: "What is a landowner share flat?",
      answer: "A landowner share flat is an apartment unit that belongs to the original land owner who entered into a Joint Development Agreement (JDA) with a builder. Instead of selling the land outright, the landowner receives a percentage of the constructed units (typically 25-35%) as their share. These units are identical to builder units in terms of construction quality and specifications.",
    },
    {
      question: "What is an investor share unit in real estate?",
      answer: "An investor share unit is an apartment purchased by an early investor during the pre-launch or construction phase at a discounted price. These investors bought units for capital appreciation and now wish to exit their investment. They typically offer these units at prices below the current market rate for a quicker sale.",
    },
    {
      question: "Why are landowner share flats cheaper than builder flats?",
      answer: "Landowner share flats are cheaper because: 1) Landowners received these units as compensation, not purchase, so they have more pricing flexibility, 2) They often need liquidity and prefer quick sales, 3) There's no marketing or sales overhead, 4) Many landowners are not real estate professionals and may price units conservatively.",
    },
    {
      question: "Are landowner share units legal and safe to buy?",
      answer: "Yes, landowner share units are completely legal and safe. They are registered under RERA, have clear titles, and follow the same legal process as builder sales. The only difference is the seller - instead of the builder, you're buying from the landowner. Always verify the JDA agreement and ensure the landowner has clear title to the specific unit.",
    },
    {
      question: "What documents should I check when buying landowner share flats?",
      answer: "Essential documents include: 1) Joint Development Agreement (JDA) between landowner and builder, 2) Landowner's share allocation letter from the builder, 3) RERA registration certificate, 4) Approved building plan, 5) Encumbrance certificate, 6) Mother deed and chain of title documents, 7) NOC from builder if required, 8) Latest property tax receipts.",
    },
    {
      question: "Can I get a home loan for landowner share units?",
      answer: "Yes, all major banks and housing finance companies provide home loans for landowner share units. Since these are RERA-registered units in approved projects, lenders treat them the same as builder units. Ensure the project is pre-approved by your preferred bank for faster loan processing.",
    },
    {
      question: "What is the typical discount on landowner share flats in Hyderabad?",
      answer: "In Hyderabad, landowner share flats typically come at a 10-15% discount compared to the builder's listed price. The exact discount depends on factors like project stage, market conditions, landowner's urgency to sell, and negotiation. Premium projects may offer 8-12% while bulk deals can go up to 18-20%.",
    },
    {
      question: "Do landowner share units have the same amenities as builder units?",
      answer: "Absolutely. Landowner share units have identical access to all project amenities including clubhouse, swimming pool, gym, landscaped gardens, parking, and security. The only difference is who you're buying from - the landowner instead of the builder. All common area charges and maintenance fees remain the same.",
    },
    {
      question: "What is the difference between landowner share and investor share?",
      answer: "Landowner share units are allocated to the original land owner as part of the JDA agreement - they never purchased these units. Investor share units were purchased by early investors at pre-launch prices who now want to sell for profit or exit. Both offer below-market pricing but for different reasons.",
    },
    {
      question: "How do I verify if a unit is genuinely landowner share?",
      answer: "To verify: 1) Ask for the JDA agreement showing unit allocation to landowner, 2) Get a confirmation letter from the builder acknowledging the landowner's rights, 3) Check the RERA portal for landowner details, 4) Verify the seller's identity matches JDA documents, 5) Consult a property lawyer to review all documentation.",
    },
    {
      question: "What are the risks of buying landowner share flats?",
      answer: "Main risks include: 1) Disputes between landowner and builder (verify JDA terms), 2) Multiple claims on same unit (get builder NOC), 3) Incomplete documentation (hire a lawyer), 4) No builder warranty on finishing (negotiate with builder). These risks are manageable with proper due diligence and legal verification.",
    },
    {
      question: "Who provides possession for landowner share units?",
      answer: "The builder provides possession even for landowner share units. The construction, finishing, and handover process remains the same. However, registration and sale deed execution happens between you and the landowner (seller), not the builder. The builder issues the occupancy certificate for the entire project.",
    },
    {
      question: "Can I negotiate the price of landowner share units?",
      answer: "Yes, landowner share units often have more negotiation room compared to builder sales. Landowners are usually individuals without fixed pricing policies. Factors that help negotiation include: ready possession units, bulk booking, quick payment, market conditions, and the landowner's liquidity needs.",
    },
    {
      question: "What payment terms are available for landowner share flats?",
      answer: "Payment terms for landowner share units are often more flexible than builder sales. Options may include: 1) Full upfront payment for maximum discount, 2) 50-50 payment structure, 3) Construction-linked plans for under-construction units, 4) Some landowners accept part payment with balance on possession. Terms are negotiable.",
    },
    {
      question: "Why should I buy landowner share units through a broker?",
      answer: "Buying through an experienced broker offers several advantages: 1) Access to verified landowner inventory across multiple projects, 2) Price negotiation expertise, 3) Documentation verification, 4) Builder coordination for NOCs and transfers, 5) Legal process guidance, 6) Post-sale support for registration and possession. A good broker ensures a safe, smooth transaction.",
    },
  ];

  // Combine comprehensive FAQs with any database FAQs
  const allFAQs = [...comprehensiveFAQs, ...faqs];

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

