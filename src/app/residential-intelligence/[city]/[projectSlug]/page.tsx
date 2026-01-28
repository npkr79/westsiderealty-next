import { reraIntelligenceService } from "@/services/reraIntelligenceService";
import { createClient } from "@/lib/supabase/server";

type PageProps = {
  params: {
    city: string;
    projectSlug: string;
  };
};

export default async function ResidentialIntelligencePage({ params }: PageProps) {
  const { city, projectSlug } = params;

  const intelligence = await reraIntelligenceService.getResidentialIntelligence(
    city,
    projectSlug
  );

  let sampleProjects:
    | { id: string | null; city_slug: string | null; url_slug: string | null }[]
    | null = null;

  if (!intelligence) {
    const supabase = await createClient();
    const { data } = await supabase
      .from("rera_projects")
      .select("id, city_slug, url_slug")
      .limit(5);
    sampleProjects = data ?? null;
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
        Residential Intelligence Debug
      </h1>
      <pre style={{ background: "#000", color: "#0f0", padding: 20, marginTop: 20 }}>
        {JSON.stringify({ city, projectSlug }, null, 2)}
      </pre>
      <pre style={{ background: "#000", color: "#0f0", padding: 20, marginTop: 20 }}>
        {JSON.stringify({ resultType: typeof intelligence }, null, 2)}
      </pre>
      <pre style={{ background: "#000", color: "#0f0", padding: 20, marginTop: 20 }}>
        {JSON.stringify(intelligence, null, 2)}
      </pre>
      {intelligence === null && (
        <pre style={{ background: "#000", color: "#0f0", padding: 20, marginTop: 20 }}>
          {JSON.stringify({ sampleProjects }, null, 2)}
        </pre>
      )}
    </div>
  );
}
