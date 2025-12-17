import { redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ citySlug: string; microMarketSlug: string; projectSlug: string }>;
}

export default async function MicroMarketProjectRedirectPage({ params }: PageProps) {
  const { citySlug, projectSlug } = await params;
  redirect(`/${citySlug}/projects/${projectSlug}`);
}
