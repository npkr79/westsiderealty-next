"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageCircle, CheckCircle2 } from "lucide-react";
import type { LandingPage } from "@/services/admin/supabaseLandingPagesService";

interface GoaLeadFormProps {
  landingPage: LandingPage;
}

export default function GoaLeadForm({ landingPage }: GoaLeadFormProps) {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
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
        requirements_message: formData.message || null,
        lead_type: "goa_property",
        source_page_url: `/landing/${landingPage.uri}`,
        status: "new",
      });

      if (error) throw error;

      toast({
        title: "Thank you!",
        description: "Our team will contact you shortly.",
      });

      setSubmitted(true);
      setFormData({ name: "", phone: "", email: "", message: "" });
      
      // Reset submitted state after 3 seconds
      setTimeout(() => setSubmitted(false), 3000);
    } catch (error: any) {
      console.error("Error submitting form:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Hi, I'm interested in ${landingPage.title} in ${landingPage.location_info}. Please share more details.`
  );

  return (
    <section id="goa-lead-form" className="py-16 px-4 bg-gradient-to-br from-teal-50 via-cyan-50 to-blue-50">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Get Exclusive Project Details
          </h2>
          <p className="text-lg text-gray-600">
            Fill in your details and our team will get back to you
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Lead Form */}
          <Card className="bg-white/95 backdrop-blur-sm shadow-xl border-2 border-teal-200">
            <CardContent className="p-8">
              {submitted ? (
                <div className="text-center py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Thank You!
                  </h3>
                  <p className="text-gray-600">
                    We've received your enquiry. Our team will contact you shortly.
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-2xl font-bold mb-6 text-gray-900">
                    Request Details
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
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
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="Enter your email"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Message (Optional)
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={4}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        placeholder="Any specific requirements or questions?"
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg font-semibold shadow-lg"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Request Details"}
                    </Button>
                    <p className="text-xs text-gray-500 text-center">
                      By submitting, you agree to be contacted by our team
                    </p>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* WhatsApp CTA */}
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl border-0">
            <CardContent className="p-8 flex flex-col justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-16 w-16 mx-auto mb-6 bg-white/20 rounded-full p-4" />
                <h3 className="text-2xl font-bold mb-4">
                  Chat with Us on WhatsApp
                </h3>
                <p className="mb-6 opacity-90">
                  Get instant responses and quick answers to all your questions
                </p>
                <Button
                  size="lg"
                  variant="outline"
                  className="bg-white text-green-600 hover:bg-green-50 border-0 px-8 py-6 text-lg font-semibold shadow-lg"
                  onClick={() => {
                    window.open(`https://wa.me/${landingPage.whatsapp_number}?text=${whatsappMessage}`, "_blank");
                  }}
                >
                  <MessageCircle className="h-5 w-5 mr-2" />
                  Start WhatsApp Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

