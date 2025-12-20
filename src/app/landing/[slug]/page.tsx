import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import LandingPageComponent from "./LandingPageComponent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: page } = await supabase
    .from("landing_pages")
    .select("seo_title, meta_description, hero_image_url, title")
    .eq("uri", slug)
    .or("status.eq.published,is_published.eq.true")
    .maybeSingle();

  if (!page) {
    return {
      title: "Landing Page Not Found",
    };
  }

  const canonicalUrl = `https://www.westsiderealty.in/landing/${slug}`;
  const ogImage = page.hero_image_url || "https://www.westsiderealty.in/placeholder.svg";

  return {
    title: page.seo_title || page.title,
    description: page.meta_description || `Explore ${page.title} - Premium real estate opportunity`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: page.seo_title || page.title,
      description: page.meta_description || `Explore ${page.title} - Premium real estate opportunity`,
      images: [ogImage],
      type: "website",
      url: canonicalUrl,
    },
    twitter: {
      card: "summary_large_image",
      title: page.seo_title || page.title,
      description: page.meta_description || `Explore ${page.title} - Premium real estate opportunity`,
      images: [ogImage],
    },
  };
}

export async function generateStaticParams() {
  const supabase = await createClient();
  const { data: pages } = await supabase
    .from("landing_pages")
    .select("uri")
    .or("status.eq.published,is_published.eq.true");

  return pages?.map((page) => ({ slug: page.uri })) || [];
}

export default async function LandingPageWrapper({ params }: PageProps) {
  const { slug } = await params;
  const supabase = await createClient();

  // Verify the page exists and is published
  // Check both status='published' OR is_published=true (for backward compatibility)
  const { data: page } = await supabase
    .from("landing_pages")
    .select("id, uri, status, is_published")
    .eq("uri", slug)
    .or("status.eq.published,is_published.eq.true")
    .maybeSingle();

  if (!page) {
    notFound();
  }

  return <LandingPageComponent slug={slug} />;
}

