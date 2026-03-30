import type { Metadata } from "next";
import ProjectDetailPage, {
  generateMetadata as generateCityProjectMetadata,
} from "@/app/[citySlug]/projects/[projectSlug]/page";

interface PageProps {
  params: Promise<{ projectSlug: string | string[] }>;
}

export default async function HyderabadProjectDetailPage({ params }: PageProps) {
  const { projectSlug: projectSlugParam } = await params;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  return ProjectDetailPage({
    params: Promise.resolve({
      citySlug: "hyderabad",
      projectSlug: projectSlug || "",
    }),
  });
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { projectSlug: projectSlugParam } = await params;
  const projectSlug = Array.isArray(projectSlugParam) ? projectSlugParam[0] : projectSlugParam;

  return generateCityProjectMetadata({
    params: Promise.resolve({
      citySlug: "hyderabad",
      projectSlug: projectSlug || "",
    }),
  });
}

export const revalidate = 60;
