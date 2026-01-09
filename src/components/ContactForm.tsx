"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Send, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { contactService } from "@/services/admin/contactService";
import { locationSettingsService } from "@/services/admin/locationSettingsService";
import { submitLead } from "@/app/actions/submit-lead";

interface ContactFormProps {
  propertyId?: string;
  agentId?: string;
  projectName?: string; // For project inquiry forms
}

export default function ContactForm({ propertyId, agentId, projectName }: ContactFormProps = {}) {
  const [contactInfo, setContactInfo] = useState<any>({});
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
    interest: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setContactInfo(contactService.getContactInfo());
    
    // If this is a project inquiry form (propertyId exists), pre-fill the message
    if (propertyId) {
      // Use provided projectName, or try to get from page title, or use fallback
      let nameToUse: string | undefined = projectName;
      if (!nameToUse && typeof window !== "undefined") {
        const pageTitle = document.title;
        nameToUse = pageTitle.split("|")[0]?.trim() || pageTitle.split("-")[0]?.trim() || undefined;
      }
      const finalProjectName = nameToUse || "this project";
      setFormData(prev => ({
        ...prev,
        message: `I am interested in ${finalProjectName}. Please share more details.`,
      }));
    }
  }, [propertyId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Determine lead type based on context
      let leadType: "GENERAL_CONTACT" | "PROJECT_INTEREST" | "DEVELOPER_INQUIRY" = "GENERAL_CONTACT";
      if (propertyId) {
        leadType = "PROJECT_INTEREST";
      } else if (agentId) {
        // If agentId is provided (could be developer), use developer inquiry
        leadType = "DEVELOPER_INQUIRY";
      }

      // Prepare details object with all extra fields
      const details: Record<string, any> = {
        message: formData.message,
        interest: formData.interest,
        propertyId: propertyId || null,
        agentId: agentId || null,
        projectName: projectName || (propertyId ? (typeof window !== "undefined" ? document.title.split("|")[0]?.trim() : null) : null),
        formType: propertyId ? "property_inquiry" : "contact_form",
      };

      // Get current page URL
      const sourcePage = typeof window !== "undefined" ? window.location.pathname : "/contact";

      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        type: leadType,
        source_page: sourcePage,
        details,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit form");
      }

      // Determine success message based on context
      let successTitle = "Message Sent!";
      let successDescription = "We will get back to you within 24 hours.";
      
      if (propertyId) {
        // This is a project inquiry
        const displayProjectName = projectName || "this project";
        successTitle = "Interest Registered!";
        successDescription = `A sales representative for ${displayProjectName} will contact you soon.`;
      }

      toast({
        title: successTitle,
        description: successDescription,
      });

      setFormData({
        name: "",
        email: "",
        phone: "",
        message: "",
        interest: "",
      });
    } catch (error: any) {
      console.error("Contact form error:", error);
      toast({
        title: "Error Sending Message",
        description:
          error?.message ||
          "There was a problem sending your message. Please try again or contact us directly.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
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

          {/* Only show "What are you looking for?" dropdown if NOT a project inquiry */}
          {!propertyId && (
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
                <option value="hyderabad-resale">Properties in Hyderabad</option>
                <option value="goa-investment">Investment Properties in Goa</option>
                <option value="dubai-investment">Dubai Investment Properties</option>
                <option value="general-consultation">General Consultation</option>
              </select>
            </div>
          )}

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
  );
}


