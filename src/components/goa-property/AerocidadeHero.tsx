"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, MessageCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AerocidadeHeroProps {
  data: {
    projectName: string;
    tagline: string;
    headline: string;
    subheadline: string;
    rera: {
      number: string;
      validUntil: string;
    };
  };
}

export default function AerocidadeHero({ data }: AerocidadeHeroProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.from("all_leads").insert({
        full_name: formData.name,
        phone: formData.phone,
        email: formData.email,
        lead_type: "goa_property",
        source_page_url: "/goa/aerocidade-studio-apartments-dabolim",
        status: "new",
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Our team will contact you shortly.",
      });

      setFormData({ name: "", phone: "", email: "" });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${data.projectName} Studio Apartments in Dabolim, Goa. Please share more details.`
  );

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-10 w-72 h-72 bg-teal-300 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-cyan-300 rounded-full blur-3xl"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <div className="text-center md:text-left">
            <Badge className="mb-4 bg-teal-500 text-white border-0">
              {data.tagline}
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gray-900 leading-tight">
              {data.projectName}
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-4 font-semibold">
              {data.headline}
            </p>
            <p className="text-lg text-gray-600 mb-8">
              {data.subheadline}
            </p>

            {/* RERA Badge */}
            {data.rera.number && (
              <div className="mb-8 flex justify-center md:justify-start">
                <Badge className="bg-white/90 backdrop-blur-sm px-4 py-2 border border-teal-200 shadow-lg">
                  <Shield className="h-4 w-4 mr-2 text-teal-600" />
                  <span className="text-gray-800 font-semibold">
                    RERA: {data.rera.number}
                  </span>
                </Badge>
              </div>
            )}

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Button
                size="lg"
                className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-6 text-lg font-semibold"
                onClick={() => {
                  const formSection = document.getElementById("enquiry-form");
                  formSection?.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
              >
                Get Exclusive Details
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="border-teal-600 text-teal-600 hover:bg-teal-50 px-8 py-6 text-lg font-semibold"
                onClick={() => {
                  window.open(`https://wa.me/919866085831?text=${whatsappMessage}`, "_blank");
                }}
              >
                <MessageCircle className="h-5 w-5 mr-2" />
                WhatsApp Us
              </Button>
            </div>
          </div>

          {/* Right: Enquiry Form */}
          <Card className="bg-white/90 backdrop-blur-sm shadow-xl border-0" id="enquiry-form">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-6 text-gray-900 text-center">
                Get Project Details
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your phone"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold"
                  disabled={loading}
                >
                  {loading ? "Submitting..." : "Request Details"}
                </Button>
                <p className="text-xs text-gray-500 text-center">
                  By submitting, you agree to be contacted by our team
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

