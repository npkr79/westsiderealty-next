
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Clock,
  MessageSquare,
  Send,
  Loader2
} from "lucide-react";
import FooterSection from "@/components/home/FooterSection";
import { useToast } from "@/hooks/use-toast";
import { contactService, locationSettingsService } from "@/services/adminService";
import SEO from "@/components/common/SEO";
import { supabase } from "@/integrations/supabase/client";

const Contact = () => {
  const [contactInfo, setContactInfo] = useState<any>({});
  const [locationSettings, setLocationSettings] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    interest: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContactInfo(contactService.getContactInfo());
    setLocationSettings(locationSettingsService.getLocationSettings());
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-contact-email', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          message: formData.message,
          interest: formData.interest,
          form_type: 'contact_form'
        }
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Message Sent Successfully!",
        description: "Thank you for your inquiry. We'll get back to you within 24 hours.",
      });
      
      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        interest: ""
      });

    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Error Sending Message",
        description: error.message || "There was a problem sending your message. Please try again or contact us directly.",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactInfoDisplay = [
    {
      icon: MapPin,
      title: "Office Address",
      content: contactInfo.address || "415, 4th Floor, Kokapet Terminal\nKokapet, Hyderabad – 500075"
    },
    {
      icon: Phone,
      title: "Phone Number",
      content: contactInfo.phone || "+91 9866085831"
    },
    {
      icon: Mail,
      title: "Email Address",
      content: contactInfo.email || "info@westsiderealty.in"
    },
    {
      icon: Clock,
      title: "Business Hours",
      content: contactInfo.businessHours || "Monday - Saturday\n9:00 AM - 7:00 PM"
    }
  ];

  const handleWhatsAppContact = () => {
    const message = "Hi, I'm interested in your real estate services. Could you please provide more information?";
    const whatsappUrl = `https://wa.me/919866085831?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="Contact Us | RE/MAX Westside Realty"
        description="Get in touch with RE/MAX Westside Realty for expert property advice, resale apartments, investment opportunities, and more. Contact our Hyderabad office or WhatsApp for quick assistance."
        canonicalUrl="https://www.westsiderealty.in/contact"
        imageUrl="https://imqlfztriragzypplbqa.supabase.co/storage/v1/object/public/brand-assets//remax-favicon.png"
        type="website"
        siteName="RE/MAX Westside Realty"
        keywords="contact remax, real estate agent hyderabad, call property advisor, whatsapp remax india, get real estate help"
      />

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-remax-blue/10 to-remax-red/10">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Get In Touch
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Ready to find your perfect property? Our expert team is here to help you 
            navigate the real estate markets in Hyderabad, Goa, and Dubai.
          </p>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MessageSquare className="h-6 w-6 text-remax-red mr-2" />
                  Send Us a Message
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium mb-2">
                        Full Name *
                      </label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your full name"
                        disabled={isSubmitting}
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium mb-2">
                        Phone Number *
                      </label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        required
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 XXXXX XXXXX"
                        disabled={isSubmitting}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium mb-2">
                      Email Address *
                    </label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={handleInputChange}
                      placeholder="your.email@example.com"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium mb-2">
                      What are you looking for?
                    </label>
                    <select
                      id="interest"
                      name="interest"
                      value={formData.interest}
                      onChange={handleInputChange}
                      disabled={isSubmitting}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-remax-red focus:border-transparent disabled:opacity-50"
                    >
                      <option value="">Select your interest</option>
                      <option value="hyderabad-resale">Resale Properties in Hyderabad</option>
                      <option value="goa-investment">Investment Properties in Goa</option>
                      <option value="dubai-investment">Dubai Investment Properties</option>
                      <option value="general-consultation">General Consultation</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium mb-2">
                      Your Message *
                    </label>
                    <Textarea
                      id="message"
                      name="message"
                      required
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="How can we help you?"
                      disabled={isSubmitting}
                      rows={4}
                    />
                  </div>
                  
                  <Button type="submit" className="w-full" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                        Sending Message...
                      </>
                    ) : (
                      <>
                        <Send className="h-5 w-5 mr-2" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>

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
                    <Button variant="outline" className="mt-4 w-full" onClick={handleWhatsAppContact}>
                      <span className="mr-2">Chat on WhatsApp</span>
                      <Send className="h-5 w-5" />
                    </Button>
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
};

export default Contact;
