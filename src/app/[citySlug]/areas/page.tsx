import { redirect } from "next/navigation";

export const revalidate = 3600;

interface PageProps {
  params: Promise<{ citySlug: string }>;
}

export default async function AreasPage({ params }: PageProps) {
  const { citySlug: citySlugParam } = await params;
  const citySlug = Array.isArray(citySlugParam) ? citySlugParam[0] : citySlugParam;
  
  // Redirect to micro-markets page (same content)
  redirect(`/${citySlug}/micro-markets`);
}

