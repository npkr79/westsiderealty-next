import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { city: string; projectSlug: string };
}

export default async function Page({ params }: PageProps) {
  const { city, projectSlug } = params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rera_projects")
    .select("id, project_name, url_slug, city_slug")
    .eq("url_slug", projectSlug)
    .eq("city_slug", city)
    .single();

  console.log("INTEL DEBUG RESULT:", { city, projectSlug, data, error });

  if (error || !data) {
    return (
      <pre className="p-10 text-red-600">
        INTELLIGENCE RESOLUTION FAILED
        {JSON.stringify({ city, projectSlug, data, error }, null, 2)}
      </pre>
    );
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>Residential Intelligence Route Active</h1>
      <pre>{JSON.stringify({ city, projectSlug, data }, null, 2)}</pre>
    </div>
  );
}
