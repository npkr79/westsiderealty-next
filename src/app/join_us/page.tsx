import { notFound } from "next/navigation";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { agentRecruitmentService } from "@/services/agentRecruitmentService";
import { HeroSection } from "./components/HeroSection";
import { WhyJoinUsSection } from "./components/WhyJoinUsSection";
import { SuccessStoriesSection } from "./components/SuccessStoriesSection";
import { ApplicationForm } from "./components/ApplicationForm";
import { FAQSection } from "./components/FAQSection";
import { FinalCTASection } from "./components/FinalCTASection";
import { WhoThrivesSection } from "./components/WhoThrivesSection";
import { SalesMindsetSection } from "./components/SalesMindsetSection";
import { BattlegroundSection } from "./components/BattlegroundSection";
import { RoleModelsSection } from "./components/RoleModelsSection";
import { RecruitmentCTASection } from "./components/RecruitmentCTASection";

const CANONICAL_URL = "https://www.westsiderealty.in/join_us";
const OG_IMAGE_URL =
  "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/landing-pages/hero/Join_us_OG_Image.png";

export const metadata = {
  title: "Join Westside Realty - Professional Real Estate Careers",
  description:
    "Switch from solo struggle to a professional system. Explore our subscription models and join a winning team.",
  openGraph: {
    title: "Join Westside Realty - Professional Real Estate Careers",
    description:
      "Switch from solo struggle to a professional system. Explore our subscription models and join a winning team.",
    images: [
      {
        url: OG_IMAGE_URL,
        width: 1200,
        height: 630,
        alt: "Join Westside Realty",
      },
    ],
  },
};

export default async function JoinUsPage() {
  const pageContent = await agentRecruitmentService.getPageContent();

  if (!pageContent) {
    notFound();
  }

  const pageUrl = CANONICAL_URL;
  const primaryCtaText = "Be a Partner Today";
  const secondaryCtaText = pageContent.hero_cta_secondary_text;

  // Generate unified schema
  const faqItems = Array.isArray(pageContent.faqs) && pageContent.faqs.length > 0
    ? pageContent.faqs
        .filter((faq) => faq && typeof faq === 'object' && typeof faq.question === 'string' && typeof faq.answer === 'string')
        .map((faq) => ({
          question: faq.question,
          answer: faq.answer,
        }))
    : [];

  const unifiedSchema = generateUnifiedSchema({
    pageUrl,
    title: pageContent.seo_title || pageContent.hero_headline,
    description: pageContent.seo_description || pageContent.hero_description || "",
    faqItems,
    breadcrumbs: [
      { name: "Home", item: "https://www.westsiderealty.in" },
      { name: "Join Us", item: pageUrl },
    ],
  });

  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Join Us", href: "/join_us" },
  ];

  return (
    <>
      <JsonLd jsonLd={unifiedSchema} />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-4">
          <Breadcrumbs items={breadcrumbItems} />
        </div>

        <HeroSection
          headline={pageContent.hero_headline}
          subheadline={pageContent.hero_subheadline}
          description={pageContent.hero_description}
          imageUrl={pageContent.hero_image_url}
          primaryCtaText={primaryCtaText}
          secondaryCtaText={secondaryCtaText}
          trustIndicator={pageContent.hero_trust_indicator}
        />

        <WhyJoinUsSection
          title={pageContent.why_join_title}
          subtitle={pageContent.why_join_subtitle}
          valuePillars={Array.isArray(pageContent.value_pillars) ? pageContent.value_pillars : []}
        />

        <SuccessStoriesSection />

        <WhoThrivesSection />

        <SalesMindsetSection />

        <BattlegroundSection />

        <RoleModelsSection />

        <RecruitmentCTASection />

        <ApplicationForm />

        {Array.isArray(pageContent.faqs) && pageContent.faqs.length > 0 && (
          <FAQSection
            title={pageContent.faq_title}
            subtitle={pageContent.faq_subtitle}
            faqs={pageContent.faqs}
          />
        )}

        <FinalCTASection
          title={pageContent.final_cta_title}
          description={pageContent.final_cta_description}
          buttonText={pageContent.final_cta_button_text}
          contactAddress={pageContent.contact_address}
        />
      </div>
    </>
  );
}
