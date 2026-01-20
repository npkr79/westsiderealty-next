import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

export const runtime = "edge";
export const alt = "Westside Realty Agent Profile";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const toDisplayName = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, " ").trim();

export default async function Image({
  params,
}: {
  params: { slug: string };
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const displayName = toDisplayName(params.slug);
  let agentName = displayName || "Real Estate Professional";
  let photoUrl: string | null = null;

  if (supabaseUrl && serviceRoleKey) {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: agent } = await supabase
      .from("agents_profile")
      .select("name")
      .ilike("name", displayName)
      .maybeSingle();

    if (agent?.name) {
      agentName = agent.name;
    }

    const formattedName = params.slug.replace(/-/g, "_");
    const fileName = `${formattedName}_profile_photo.png`;
    const { data: secretImage } = await supabase.storage
      .from("agent_profile_photos")
      .createSignedUrl(fileName, 3600);

    photoUrl = secretImage?.signedUrl || null;
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "row",
          backgroundColor: "#f0f4f8",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            width: "50%",
            padding: "60px",
            backgroundColor: "#003DA5",
            color: "white",
          }}
        >
          <div style={{ fontSize: 32, marginBottom: 20, opacity: 0.9 }}>
            RE/MAX Westside Realty
          </div>
          <div style={{ fontSize: 64, fontWeight: "bold", lineHeight: 1.1 }}>
            {agentName}
          </div>
          <div
            style={{
              fontSize: 36,
              marginTop: 20,
              color: "#DC1C2E",
              fontWeight: "bold",
            }}
          >
            View Profile →
          </div>
        </div>
        <div
          style={{
            display: "flex",
            width: "50%",
            height: "100%",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
            backgroundColor: "#ffffff",
          }}
        >
          {photoUrl ? (
            <img
              src={photoUrl}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          ) : (
            <div
              style={{
                height: "100%",
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 24,
                color: "#64748b",
                backgroundColor: "#f8fafc",
              }}
            >
              Profile photo unavailable
            </div>
          )}
        </div>
      </div>
    ),
    { ...size }
  );
}
