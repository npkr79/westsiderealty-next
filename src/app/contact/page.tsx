
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import FooterSection from "@/components/home/FooterSection";
import { contactService, locationSettingsService } from "@/services/adminService";
import ContactForm from "@/components/ContactForm";
import { JsonLd, buildMetadata } from "@/components/common/SEO";

const CONTACT_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ContactPage",
  name: "Contact RE/MAX Westside Realty",
  description:
    "Contact RE/MAX Westside Realty for expert property advice, resale apartments, investment opportunities, and more.",
  url: "https://www.westsiderealty.in/contact",
};

export const metadata: Metadata = buildMetadata({
  title: "Contact Us | RE/MAX Westside Realty",
  description:
    "Get in touch with RE/MAX Westside Realty for expert property advice, resale apartments, investment opportunities, and more. Contact our Hyderabad office or WhatsApp for quick assistance.",
  canonicalUrl: "https://www.westsiderealty.in/contact",
  imageUrl:
    "https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png",
  type: "website",
  siteName: "RE/MAX Westside Realty",
  keywords:
    "contact remax, real estate agent hyderabad, call property advisor, whatsapp remax india, get real estate help",
});

export default function Contact() {
  const contactInfo = contactService.getContactInfo();
  const locationSettings = locationSettingsService.getLocationSettings();

  const contactInfoDisplay = [
    {
      icon: MapPin,
      title: "Office Address",
      content: contactInfo.address || "415, 4th Floor, Kokapet Terminal\nKokapet, Hyderabad – 500075",
    },
    {
      icon: Phone,
      title: "Phone Number",
      content: contactInfo.phone || "+91 9866085831",
    },
    {
      icon: Mail,
      title: "Email Address",
      content: contactInfo.email || "info@westsiderealty.in",
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: contactInfo.businessHours || "Monday - Saturday\n9:00 AM - 7:00 PM",
    },
  ];

  const handleWhatsAppContact = () => {
    const message =
      "Hi, I'm interested in your real estate services. Could you please provide more information?";
    const whatsappUrl = `https://wa.me/919866085831?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  return (
    <div className="min-h-screen bg-background">
      <JsonLd jsonLd={CONTACT_SCHEMA} />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-remax-blue/10 to-remax-red/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">Get In Touch</h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Ready to find your perfect property? Our expert team is here to help you navigate the real estate
            markets in Hyderabad, Goa, and Dubai.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <ContactForm />

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Contact Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {contactInfoDisplay.map((item, idx) => (
                      <div className="flex items-start gap-4" key={idx}>
                        <item.icon className="h-6 w-6 text-remax-red flex-shrink-0 mt-1" />
                        <div>
                          <h4 className="font-semibold">{item.title}</h4>
                          <p className="text-gray-700 whitespace-pre-line text-sm">{item.content}</p>
                        </div>
                      </div>
                    ))}
                    <Card>
                      <CardContent className="pt-4">
                        <button
                          className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent"
                          onClick={handleWhatsAppContact}
                        >
                          <span className="mr-2">Chat on WhatsApp</span>
                          <Send className="h-5 w-5" />
                        </button>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Our Office Location</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-lg overflow-hidden shadow-lg">
                    <iframe
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3806.7238359893885!2d78.32729527516557!3d17.38511598359169!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bcb95ee5b2ab6e9%3A0x5e0b4a7a89b65c76!2sRE%2FMAX%20Westside%20Realty!5e0!3m2!1sen!2sin!4v1703680800000!5m2!1sen!2sin"
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="RE/MAX Westside Realty Office Location"
                      className="rounded-lg"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <FooterSection />
    </div>
  );
}
