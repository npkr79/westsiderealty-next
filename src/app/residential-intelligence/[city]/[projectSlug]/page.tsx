import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { city: string; projectSlug: string };
}

export default async function Page({ params }: PageProps) {
  const city = decodeURIComponent(params.city).toLowerCase();
  const projectSlug = decodeURIComponent(params.projectSlug).toLowerCase();
  const supabase = await createClient();

  console.log("[INTEL] resolving:", { city, projectSlug });

  const { data, error } = await supabase
    .from("rera_projects")
    .select("*")
    .eq("url_slug", projectSlug)
    .eq("city_slug", city)
    .maybeSingle();

  console.log("[INTEL] resolved:", { data, error });

  if (error) {
    throw new Error("Supabase error: " + error.message);
  }

  if (!data) {
    notFound();
  }

  return (
    <div style={{ padding: 50 }}>
      <h1>Residential Intelligence Route Active</h1>
      <pre>{JSON.stringify({ city, projectSlug, data }, null, 2)}</pre>
    </div>
  );
}
