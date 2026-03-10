import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/dashboard/", "/crm/", "/api/", "/reset-password"],
    },
    sitemap: "https://www.westsiderealty.in/sitemap.xml",
  };
}

