import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  getOpportunityBySlug,
  getAllOpportunitySlugs,
} from "@/services/developmentOpportunitiesService";
import { OpportunityDetailClient } from "@/components/opportunities/OpportunityDetailClient";
import { JsonLd } from "@/components/common/SEO";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  const slugs = await getAllOpportunitySlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const opp = await getOpportunityBySlug(slug);
  if (!opp) {
    return { title: "Opportunity not found | Westside Realty" };
  }
  const url = `https://www.westsiderealty.in/opportunities/${opp.slug}`;
  const desc =
    opp.headline ??
    opp.summary ??
    `Development opportunity in ${opp.micro_market ?? opp.city}. Detailed feasibility under NDA.`;
  return {
    title: `${opp.title} | Development Opportunity | Westside Realty`,
    description: desc.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: opp.title,
      description: desc.slice(0, 200),
      url,
      siteName: "RE/MAX Westside Realty",
      type: "article",
      locale: "en_IN",
      ...(opp.hero_image_url ? { images: [{ url: opp.hero_image_url }] } : {}),
    },
    robots: { index: true, follow: true },
  };
}

export default async function OpportunityDetailPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const opportunity = await getOpportunityBySlug(slug);
  if (!opportunity) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.westsiderealty.in" },
      {
        "@type": "ListItem",
        position: 2,
        name: "Opportunities",
        item: "https://www.westsiderealty.in/opportunities",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: opportunity.title,
        item: `https://www.westsiderealty.in/opportunities/${opportunity.slug}`,
      },
    ],
  };

  return (
    <>
      <JsonLd jsonLd={[breadcrumbSchema]} />
      <OpportunityDetailClient opportunity={opportunity} />
    </>
  );
}
