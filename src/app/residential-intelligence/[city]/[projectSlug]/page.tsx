import { headers } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DebugPage(props: any) {
  console.log("PARAMS", props?.params);

  const city = props?.params?.city;
  const projectSlug = props?.params?.projectSlug;

  if (!city || !projectSlug) {
    return null;
  }
  const h = await headers();

  return (
    <div style={{ padding: 40, fontFamily: "monospace" }}>
      <h1 style={{ fontSize: 28, fontWeight: "bold" }}>
        Residential Intelligence Route – Param Debug
      </h1>

      <h2 style={{ marginTop: 20 }}>RAW PROPS</h2>
      <pre style={{ background: "#000", color: "#0f0", padding: 20 }}>
        {JSON.stringify(props, null, 2)}
      </pre>

      <h2 style={{ marginTop: 20 }}>HEADERS (important)</h2>
      <pre style={{ background: "#000", color: "#0ff", padding: 20 }}>
        {JSON.stringify(Object.fromEntries(h.entries()), null, 2)}
      </pre>

      <h2 style={{ marginTop: 20 }}>PATH CHECK</h2>
      <div style={{ background: "#111", color: "#fff", padding: 20 }}>
        URL should be: /residential-intelligence/hyderabad/aparna-zenon
      </div>
    </div>
  );
}
