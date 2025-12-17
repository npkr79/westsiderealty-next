import { Metadata } from "next";
import { buildMetadata } from "@/components/common/SEO";
import RegisterPage from "@/components/pages/RegisterPage";

export const metadata: Metadata = buildMetadata({
  title: "Register | RE/MAX Westside Realty | Become a Partner Agent",
  description:
    "Create your RE/MAX Westside Realty agent account to access exclusive listings, tools, and support for your real estate success.",
  canonicalUrl: "https://www.westsiderealty.in/register",
});

// Force dynamic rendering to prevent prerendering (useAuth requires AuthProvider)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const fetchCache = 'force-no-store';

export default function Page() {
  return <RegisterPage />;
}


