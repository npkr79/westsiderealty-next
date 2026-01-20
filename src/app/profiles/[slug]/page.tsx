import Image from "next/image";
import { notFound } from "next/navigation";
import { getServiceClient } from "@/app/api/admin/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, ShieldCheck } from "lucide-react";

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

const toDisplayName = (slug: string) =>
  decodeURIComponent(slug).replace(/-/g, " ").trim();

export default async function AgentProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const displayName = toDisplayName(slug);

  const adminClient = getServiceClient();
  const { data, error } = await adminClient
    .from("agents_profile")
    .select(
      "agent_id, name, email, phone, bio, specialization, profile_image, service_areas, whatsapp, linkedin, instagram, raw_agents(category, is_active)"
    )
    .ilike("name", displayName)
    .maybeSingle();

  if (error || !data) {
    notFound();
  }

  const agent = data as AgentProfileRow;
  const name = agent.name || displayName;
  const badgeLabel = agent.raw_agents?.category || "Westside Realty Professional";

  return (
    <div className="min-h-screen bg-slate-50">
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-slate-50 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 items-center">
            <div className="space-y-6">
              <Badge className="bg-[#003DA5]/10 text-[#003DA5] border border-[#003DA5]/20">
                {badgeLabel}
              </Badge>
              <h1 className="text-3xl md:text-5xl font-bold text-slate-900">
                {name}
              </h1>
              <p className="text-lg text-slate-600 max-w-xl">
                {agent.bio ||
                  "Trusted real estate advisor focused on structured execution and high-trust transactions."}
              </p>
              <div className="flex flex-wrap gap-3">
                {agent.specialization && (
                  <Badge variant="secondary">{agent.specialization}</Badge>
                )}
                {Array.isArray(agent.service_areas) &&
                  agent.service_areas.slice(0, 4).map((area) => (
                    <Badge key={area} variant="outline">
                      {area}
                    </Badge>
                  ))}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
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
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative h-72 w-72 rounded-3xl bg-white shadow-2xl overflow-hidden">
                <Image
                  src={agent.profile_image || "/images/placeholder-agent.png"}
                  alt={name}
                  fill
                  className="object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
          <div className="space-y-6">
            <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
              <CardContent className="p-6 space-y-4">
                <h2 className="text-2xl font-semibold text-slate-900">
                  Professional Summary
                </h2>
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
          </div>

          <Card className="rounded-3xl border border-slate-200 bg-white shadow-xl">
            <CardContent className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold text-slate-900">Contact Agent</h2>
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
      </section>
    </div>
  );
}
