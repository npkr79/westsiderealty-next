import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/app/api/admin/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, MapPin, Phone, ShieldCheck } from "lucide-react";

interface AgentProfileRow {
  agent_id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  bio: string | null;
  specialization: string | null;
  profile_image: string | null;
  service_areas: string[] | null;
  whatsapp: string | null;
  linkedin: string | null;
  instagram: string | null;
  raw_agents?: {
    category?: string | null;
    is_active?: boolean | null;
  } | null;
}

interface AgentProperty {
  id: string;
  title: string | null;
  slug: string | null;
  price_display: string | null;
  price: number | null;
  main_image_url: string | null;
  image_gallery: string[] | null;
  project_name: string | null;
  location: string | null;
  micro_market: string | null;
  bhk_config: string | null;
  area_sqft: number | null;
}

interface ProjectInfo {
  project_name: string;
  url_slug: string | null;
  hero_image_url: string | null;
  main_image_url: string | null;
  meta_description: string | null;
  project_overview_seo: string | null;
}

const toDisplayName = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, " ").trim();

const SITE_URL = "https://www.westsiderealty.in";
const FALLBACK_OG_IMAGE = `${SITE_URL}/images/placeholder-agent.png`;

const fetchAgentBySlug = async (slug: string) => {
  const displayName = toDisplayName(slug);
  const adminClient = getServiceClient();
  const { data } = await adminClient
    .from("agents_profile")
    .select(
      "agent_id, name, email, phone, bio, specialization, profile_image, service_areas, whatsapp, linkedin, instagram, raw_agents(category, is_active)"
    )
    .ilike("name", displayName)
    .maybeSingle();

  return { data, displayName };
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const { data, displayName } = await fetchAgentBySlug(slug);

  if (!data) {
    return {};
  }

  const agent = data as AgentProfileRow;
  const name = agent.name || displayName;
  const description =
    agent.bio ||
    "Westside Realty professional profile, expertise highlights, and active listings.";
  const profileImage = agent.profile_image || FALLBACK_OG_IMAGE;
  const pageUrl = `${SITE_URL}/profiles/${slug}`;

  return {
    title: `${name} | Westside Realty`,
    description,
    alternates: {
      canonical: pageUrl,
    },
    openGraph: {
      title: `${name} | Westside Realty`,
      description,
      url: pageUrl,
      siteName: "Westside Realty",
      type: "profile",
      images: [
        {
          url: profileImage,
          width: 1080,
          height: 1350,
          alt: `${name} profile photo`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${name} | Westside Realty`,
      description,
      images: [profileImage],
    },
  };
}

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { data, displayName } = await fetchAgentBySlug(slug);

  if (!data) {
    notFound();
  }

  const agent = data as AgentProfileRow;
  const name = agent.name || displayName;
  const badgeLabel = agent.raw_agents?.category || "Westside Realty Professional";
  const strengthLabel = agent.specialization || "Structured execution";

  const adminClient = getServiceClient();
  const { data: properties } = await adminClient
    .from("hyderabad_properties")
    .select(
      "id, title, slug, price_display, price, main_image_url, image_gallery, project_name, location, micro_market, bhk_config, area_sqft"
    )
    .eq("agent_id", agent.agent_id)
    .order("created_at", { ascending: false })
    .limit(6);

  const propertyRows = (properties || []) as AgentProperty[];
  const projectNames = Array.from(
    new Set(propertyRows.map((property) => property.project_name).filter(Boolean))
  ) as string[];

  const { data: projectRows } = projectNames.length
    ? await adminClient
        .from("projects")
        .select("project_name, url_slug, hero_image_url, main_image_url, meta_description, project_overview_seo")
        .in("project_name", projectNames)
    : { data: [] as ProjectInfo[] };

  const projectMap = new Map(
    (projectRows || []).map((project) => [project.project_name, project])
  );

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-slate-50 py-12">
        <div className="container mx-auto px-4 space-y-10">
          <div className="grid grid-cols-1 lg:grid-cols-[320px_minmax(0,1fr)_320px] gap-6 items-stretch">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl h-full min-h-[520px]">
              <CardContent className="p-4 h-full">
                <div className="relative w-full h-full min-h-[480px] aspect-[4/5] rounded-2xl overflow-hidden">
                  <Image
                    src={agent.profile_image || "/images/placeholder-agent.png"}
                    alt={name}
                    fill
                    className="object-cover"
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl h-full min-h-[520px]">
              <CardContent className="p-6 space-y-5 h-full">
                <Badge className="bg-[#003DA5]/10 text-[#003DA5] border border-[#003DA5]/20">
                  {badgeLabel}
                </Badge>
                <h1 className="text-3xl md:text-5xl font-bold text-slate-900">
                  {name}
                </h1>
                <div className="grid grid-cols-1 gap-3 text-sm text-slate-600">
                  <div>
                    <span className="font-semibold text-slate-900">Role:</span>{" "}
                    {badgeLabel}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Strength:</span>{" "}
                    {strengthLabel}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900">Areas:</span>{" "}
                    {Array.isArray(agent.service_areas) && agent.service_areas.length
                      ? agent.service_areas.join(", ")
                      : "Hyderabad"}
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-600 pt-2">
                  {agent.email && (
                    <span className="inline-flex items-center gap-2">
                      <Mail className="h-4 w-4 text-[#003DA5]" />
                      {agent.email}
                    </span>
                  )}
                  {agent.phone && (
                    <span className="inline-flex items-center gap-2">
                      <Phone className="h-4 w-4 text-[#003DA5]" />
                      {agent.phone}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="lg:sticky lg:top-24 h-fit self-start">
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl h-full min-h-[520px]">
                <CardContent className="p-6 space-y-4 h-full">
                  <h2 className="text-2xl font-semibold text-slate-900">
                    Contact {name}
                  </h2>
                  <div className="space-y-3">
                    <Input placeholder="Your Name" className="bg-slate-50" />
                    <Input placeholder="Email Address" className="bg-slate-50" />
                    <Input placeholder="Phone Number" className="bg-slate-50" />
                    <Textarea
                      placeholder="Tell us what you are looking for..."
                      rows={4}
                      className="bg-slate-50"
                    />
                    <Button className="w-full rounded-full bg-[#DC1C2E] text-white hover:bg-[#b91525]">
                      Send Inquiry
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">About {name}</h2>
              <p className="text-slate-600 leading-relaxed">
                {agent.bio ||
                  "Focused on delivering structured, client-first real estate solutions with disciplined execution and market intelligence."}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-[#003DA5]" />
                  Verified Westside Realty professional
                </div>
                {agent.specialization && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-[#003DA5]" />
                    Specialization: {agent.specialization}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <h2 className="text-2xl font-semibold text-slate-900">
              Properties handled by {name}
            </h2>
            {propertyRows.length === 0 ? (
              <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
                <CardContent className="p-6 text-slate-600">
                  No properties are currently listed for this agent.
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {propertyRows.map((property) => {
                  const project = property.project_name
                    ? projectMap.get(property.project_name)
                    : null;
                  const image =
                    property.main_image_url ||
                    property.image_gallery?.[0] ||
                    project?.hero_image_url ||
                    project?.main_image_url ||
                    "/images/placeholder-property.png";

                  return (
                    <Card
                      key={property.id}
                      className="rounded-3xl border border-slate-200 bg-white shadow-xl overflow-hidden"
                    >
                      <div className="relative h-48 w-full">
                        <Image src={image} alt={property.title || "Property"} fill className="object-cover" />
                      </div>
                      <CardContent className="p-5 space-y-2">
                        <div className="text-xs uppercase tracking-[0.2em] text-slate-500">
                          {property.project_name || "Independent Listing"}
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900">
                          {property.title || "Untitled property"}
                        </h3>
                        <div className="text-sm text-slate-600">
                          {property.micro_market || property.location || "Hyderabad"}
                        </div>
                        <div className="flex items-center justify-between text-sm text-slate-600">
                          <span>{property.bhk_config || "—"}</span>
                          <span>{property.area_sqft ? `${property.area_sqft} sq.ft` : ""}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[#003DA5] font-semibold">
                            {property.price_display || ""}
                          </span>
                          {property.slug ? (
                            <Link
                              href={`/hyderabad/buy/${property.slug}`}
                              className="text-sm font-semibold text-[#DC1C2E]"
                            >
                              View
                            </Link>
                          ) : null}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
