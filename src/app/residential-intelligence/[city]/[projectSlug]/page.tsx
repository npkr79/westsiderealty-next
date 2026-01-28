import { createClient } from "@/lib/supabase/server";

interface PageProps {
  params: { city: string; projectSlug: string };
}

export default async function Page({ params }: PageProps) {
  const { city, projectSlug } = params;
  const supabase = await createClient();
  const { data: allRows, error: allError } = await supabase
    .from("rera_projects")
    .select("id, project_name, url_slug, city_slug")
    .limit(20);

  const { data: slugOnly, error: slugError } = await supabase
    .from("rera_projects")
    .select("id, project_name, url_slug, city_slug")
    .ilike("url_slug", "%aparna%");

  const { data: cityOnly, error: cityError } = await supabase
    .from("rera_projects")
    .select("id, project_name, url_slug, city_slug")
    .ilike("city_slug", "%hyd%");

  return (
    <pre className="p-10 text-sm">
      ALL ROWS:
      {"\n"}
      {JSON.stringify(allRows, null, 2)}
      {"\n\n"}
      SLUG SEARCH:
      {"\n"}
      {JSON.stringify(slugOnly, null, 2)}
      {"\n\n"}
      CITY SEARCH:
      {"\n"}
      {JSON.stringify(cityOnly, null, 2)}
      {"\n\n"}
      ERRORS:
      {"\n"}
      {JSON.stringify({ allError, slugError, cityError }, null, 2)}
    </pre>
  );
}
