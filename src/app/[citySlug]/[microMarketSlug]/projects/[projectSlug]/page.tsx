import { redirect } from "next/navigation";
import { buildProjectUrl } from "@/lib/routes";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ citySlug: string; microMarketSlug: string; projectSlug: string }>;
}

export default async function MicroMarketProjectRedirectPage({ params }: PageProps) {
  const { citySlug, projectSlug } = await params;
  redirect(buildProjectUrl(citySlug, projectSlug));
}
