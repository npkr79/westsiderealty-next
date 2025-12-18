import { redirect } from "next/navigation";

interface PageProps {
  params: { citySlug: string; microMarketSlug: string; projectSlug: string };
}

export default async function MicroMarketProjectRedirectPage({ params }: PageProps) {
  const { citySlug, projectSlug } = params;
  redirect(`/${citySlug}/projects/${projectSlug}`);
}
