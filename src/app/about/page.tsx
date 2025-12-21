import { Metadata } from "next";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import AboutPage from "@/components/pages/AboutPage";
import { supabaseTestimonialService } from "@/services/admin/supabaseTestimonialService";

const ABOUT_PAGE_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About RE/MAX Westside Realty",
  description:
    "Learn about RE/MAX Westside Realty - your trusted real estate advisory partner for premium properties in Hyderabad, Goa, and Dubai.",
  url: "https://www.westsiderealty.in/about",
  mainEntity: {
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    description:
      "Premier real estate advisory specializing in resale properties, investment opportunities, and holiday homes across Hyderabad, Goa & Dubai.",
    url: "https://www.westsiderealty.in",
    logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets/remax-logo.jpg",
    telephone: "+91-9866085831",
    email: "npkr79@gmail.com",
    address: {
      "@type": "PostalAddress",
      addressLocality: "Hyderabad",
      addressRegion: "Telangana",
      addressCountry: "IN",
    },
    areaServed: [
      { "@type": "City", name: "Hyderabad" },
      { "@type": "City", name: "Goa" },
      { "@type": "City", name: "Dubai" },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "150",
      bestRating: "5",
    },
    founder: {
      "@type": "Person",
      name: "N. P. K. Reddy",
      jobTitle: "Founder",
    },
  },
};

const ORG_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "RealEstateAgent",
  name: "RE/MAX Westside Realty",
  url: "https://www.westsiderealty.in",
  logo: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  image: "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  telephone: "+91 9866085831",
  address: {
    "@type": "PostalAddress",
    streetAddress: "415, 4th Floor, Kokapet Terminal, Kokapet, Hyderabad – 500075",
    addressLocality: "Hyderabad",
    addressRegion: "Telangana",
    postalCode: "500075",
    addressCountry: "IN",
  },
  description:
    "Award-winning property agents for Hyderabad, Goa, and Dubai. Specializing in resale, investment & holiday homes with a focus on trust, service, and global expertise.",
  founder: {
    "@type": "Person",
    name: "N. P. K. Reddy",
    jobTitle: "Founder",
  },
};

export const metadata: Metadata = buildMetadata({
  title: "About Us - RE/MAX Westside Realty | Your Trusted Real Estate Partner",
  description:
    "Discover the story of RE/MAX Westside Realty, Hyderabad's trusted expert in resale, investment, and holiday properties. Learn about our global network, values, and award-winning service.",
  canonicalUrl: "https://www.westsiderealty.in/about",
  keywords:
    "about remax hyderabad, real estate agents, resale properties hyderabad, goa investment homes, dubai realty, trusted property advisor",
});

export default async function Page() {
  // Fetch testimonials server-side for SEO
  const testimonials = await supabaseTestimonialService.getTestimonials(true);

  return (
    <>
      <JsonLd jsonLd={[ABOUT_PAGE_SCHEMA, ORG_SCHEMA]} />
      <AboutPage testimonials={testimonials} />
    </>
  );
}
