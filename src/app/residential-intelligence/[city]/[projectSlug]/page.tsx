import { notFound } from "next/navigation";
import { reraIntelligenceService } from "@/services/reraIntelligenceService";

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

  if (!intelligence) {
    notFound();
  }

  return (
    <div style={{ padding: 40 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>
        Residential Intelligence Route Active
      </h1>
      <div style={{ marginTop: 20 }}>
        <div>
          <strong>Project Name:</strong>{" "}
          {(intelligence.rera_project as any)?.project_name ?? "Not disclosed"}
        </div>
        <div>
          <strong>RERA ID:</strong>{" "}
          {(intelligence.rera_project as any)?.id ?? "Not disclosed"}
        </div>
        <div>
          <strong>city_slug:</strong>{" "}
          {(intelligence.rera_project as any)?.city_slug ?? "Not disclosed"}
        </div>
        <div>
          <strong>url_slug:</strong>{" "}
          {(intelligence.rera_project as any)?.url_slug ?? "Not disclosed"}
        </div>
      </div>
      <h2 style={{ marginTop: 20 }}>Structural Profile</h2>
      <pre style={{ background: "#000", color: "#0f0", padding: 20 }}>
        {JSON.stringify(intelligence.structural_profile, null, 2)}
      </pre>
      <h2 style={{ marginTop: 20 }}>Land Summary</h2>
      <pre style={{ background: "#000", color: "#0f0", padding: 20 }}>
        {JSON.stringify(intelligence.land_summary, null, 2)}
      </pre>
    </div>
  );
}
