import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { JsonLd } from "@/components/common/SEO";
import { Breadcrumbs } from "@/components/seo/Breadcrumbs";
import { generateUnifiedSchema } from "@/lib/seo-utils";
import { agentRecruitmentService } from "@/services/agentRecruitmentService";
import { HeroSection } from "./components/HeroSection";
import { WhyJoinUsSection } from "./components/WhyJoinUsSection";
import { SuccessStoriesSection } from "./components/SuccessStoriesSection";
import { WhatWeOfferSection } from "./components/WhatWeOfferSection";
import { RequirementsSection } from "./components/RequirementsSection";
import { ApplicationForm } from "./components/ApplicationForm";
import { FAQSection } from "./components/FAQSection";
import { FinalCTASection } from "./components/FinalCTASection";

const CANONICAL_URL = "https://www.westsiderealty.in/join_us";

export async function generateMetadata(): Promise<Metadata> {
  const pageContent = await agentRecruitmentService.getPageContent();
  
  const title = pageContent?.seo_title || "Join RE/MAX Westside Realty | Real Estate Agent Careers";
  const description = pageContent?.seo_description || "Join India's premier real estate brokerage. Build your career with RE/MAX Westside Realty - competitive commissions, training, and support.";
  const keywords = pageContent?.seo_keywords || "real estate agent jobs, real estate careers, RE/MAX agents, property agent recruitment, real estate broker jobs";

  return {
    title,
    description,
    keywords,
    alternates: {
      canonical: CANONICAL_URL,
    },
    openGraph: {
      title,
      description,
      url: CANONICAL_URL,
      siteName: "RE/MAX Westside Realty",
      type: "website",
      locale: "en_IN",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function JoinUsPage() {
  const pageContent = await agentRecruitmentService.getPageContent();

  if (!pageContent) {
    notFound();
  }

  const pageUrl = CANONICAL_URL;

  // Generate unified schema
  const unifiedSchema = generateUnifiedSchema({
    pageUrl,
    title: pageContent.seo_title || pageContent.hero_headline,
    description: pageContent.seo_description || pageContent.hero_description || "",
    faqItems: pageContent.faqs.map((faq) => ({
      question: faq.question,
      answer: faq.answer,
    })),
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
          primaryCtaText={pageContent.hero_cta_primary_text}
          secondaryCtaText={pageContent.hero_cta_secondary_text}
          trustIndicator={pageContent.hero_trust_indicator}
        />

        <WhyJoinUsSection
          title={pageContent.why_join_title}
          subtitle={pageContent.why_join_subtitle}
          valuePillars={pageContent.value_pillars}
        />

        {pageContent.success_stories.length > 0 && (
          <SuccessStoriesSection
            title={pageContent.success_stories_title}
            subtitle={pageContent.success_stories_subtitle}
            stories={pageContent.success_stories}
          />
        )}

        <WhatWeOfferSection
          title={pageContent.what_we_offer_title}
          subtitle={pageContent.what_we_offer_subtitle}
          benefits={pageContent.benefits}
        />

        <RequirementsSection
          title={pageContent.requirements_title}
          subtitle={pageContent.requirements_subtitle}
          requirementsList={pageContent.requirements_list}
          whatWeLookFor={pageContent.what_we_look_for}
          processSteps={pageContent.application_process_steps}
        />

        <ApplicationForm />

        {pageContent.faqs.length > 0 && (
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
          contactEmail={pageContent.contact_email}
          contactPhone={pageContent.contact_phone}
          contactAddress={pageContent.contact_address}
        />
      </div>
    </>
  );
}
