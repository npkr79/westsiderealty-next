import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Join Westside Realty";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const bgImage =
    "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/landing-pages/hero/Join_us_OG_Image.png";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#003DA5",
        }}
      >
        <img
          src={bgImage}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
