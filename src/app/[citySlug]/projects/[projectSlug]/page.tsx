import ProjectDetailClient from "./ProjectDetailClient";

interface PageProps {
  params: Promise<{ citySlug: string; projectSlug: string }>;
}

export default async function ProjectDetailPage({ params }: PageProps) {
  const { citySlug, projectSlug } = await params;
  return <ProjectDetailClient citySlug={citySlug} projectSlug={projectSlug} />;
}
