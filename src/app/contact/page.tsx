
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Phone, Mail, Clock } from "lucide-react";
import ContactForm from "@/components/ContactForm";
import { JsonLd, buildMetadata } from "@/components/common/SEO";
import WhatsAppButton from "@/components/contact/WhatsAppButton";

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
  // Use default values for server-side rendering (localStorage is not available)
  const defaultContactInfo = {
    address: "415, 4th Floor, Kokapet Terminal\nKokapet, Hyderabad – 500075",
    phone: "+91 9866085831",
    email: "info@westsiderealty.in",
    businessHours: "Monday - Saturday\n9:00 AM - 7:00 PM",
  };

  const contactInfoDisplay = [
    {
      icon: MapPin,
      title: "Office Address",
      content: defaultContactInfo.address,
    },
    {
      icon: Phone,
      title: "Phone Number",
      content: defaultContactInfo.phone,
    },
    {
      icon: Mail,
      title: "Email Address",
      content: defaultContactInfo.email,
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: defaultContactInfo.businessHours,
    },
  ];

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
                    <WhatsAppButton />
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
                      src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3574.5406493313703!2d78.3269774748044!3d17.385123602871065!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x6869ea289d44d3d%3A0x7ee055e9306884d4!2sRE%2FMAX%20Westside%20Realty!5e1!3m2!1sen!2sin!4v1766248713985!5m2!1sen!2sin"
                      width="100%"
                      height="450"
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
    </div>
  );
}
