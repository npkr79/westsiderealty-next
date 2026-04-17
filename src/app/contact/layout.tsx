import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contact Us | RE/MAX Westside Realty — Hyderabad & Goa",
  description:
    "Get in touch with our expert real estate advisors. Office in Hyderabad's Financial District. Submit your details and we'll call you back.",
  alternates: { canonical: "https://www.westsiderealty.in/contact" },
  keywords: "contact westside realty, hyderabad real estate agent contact, goa property advisor",
  openGraph: {
    title: "Contact RE/MAX Westside Realty",
    description: "Get expert real estate advisory for Hyderabad and Goa properties.",
    url: "https://www.westsiderealty.in/contact",
    siteName: "RE/MAX Westside Realty",
    type: "website",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
