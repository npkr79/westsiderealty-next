/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2 } from "lucide-react";
import { landingPageLeadsService } from "@/services/admin/landingPageLeadsService";
import { useToast } from "@/hooks/use-toast";
import { z } from "zod";

interface ProjectLeadFormProps {
  projectName: string;
  projectId: string;
  developerName?: string;
  developerLogo?: string | null;
  inModal?: boolean;
  brochureUrl?: string | null;
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  email: z.string().trim().email("Enter valid email address").min(1, "Email is required").max(255),
});

export default function ProjectLeadForm({ projectName, projectId, developerName, developerLogo, inModal = false, brochureUrl }: ProjectLeadFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      const validated = leadSchema.parse(formData);
      setLoading(true);

      // Submit to all_leads table for unified lead management
      const { supabase } = await import('@/integrations/supabase/client');
      const { error: insertError } = await supabase.from('all_leads').insert({
        full_name: validated.name,
        phone: validated.phone,
        email: validated.email,
        lead_type: 'project',
        project_id: projectId,
        source_page_url: window.location.href,
        status: 'new',
      });
      
      if (insertError) throw insertError;

      toast({
        title: "Thank you!",
        description: brochureUrl ? "Brochure downloading..." : "Our team will contact you shortly.",
      });

      // Trigger brochure download if available
      if (brochureUrl) {
        window.open(brochureUrl, '_blank');
      }

      setFormData({ name: "", phone: "", email: "" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        const fieldErrors: Record<string, string> = {};
        error.issues.forEach((err) => {
          if (err.path[0]) {
            fieldErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(fieldErrors);
      } else {
        toast({
          title: "Error",
          description: "Failed to submit. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form content without Card wrapper when in modal
  const formContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Your name"
          disabled={loading}
          className={errors.name ? "border-destructive" : ""}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone *</Label>
        <Input
          id="phone"
          type="tel"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="10-digit mobile number"
          disabled={loading}
          maxLength={10}
          className={errors.phone ? "border-destructive" : ""}
        />
        {errors.phone && <p className="text-xs text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="your@email.com"
          disabled={loading}
          required
          className={errors.email ? "border-destructive" : ""}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
      </div>

      <Button type="submit" className="w-full bg-green-600 hover:bg-green-700" disabled={loading}>
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Submitting...
          </>
        ) : (
          "Get Best Price"
        )}
      </Button>
    </form>
  );

  if (inModal) {
    return formContent;
  }

  return (
    <div className="space-y-4">
      <Card className="shadow-lg">
        <CardHeader className="space-y-1">
          <CardTitle className="text-xl">Interested in {projectName}?</CardTitle>
          <p className="text-sm text-muted-foreground">Get best price and floor plans</p>
        </CardHeader>
        <CardContent>
          {formContent}
        </CardContent>
      </Card>

      {/* Developer Info Card */}
      {developerName && (
        <Card className="shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {developerLogo ? (
                  <Image
                    src={developerLogo || "/placeholder.svg"}
                    alt={developerName}
                    className="w-full h-full object-cover"
                    width={48}
                    height={48}
                  />
                ) : (
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Developed by</p>
                <p className="font-semibold text-sm">{developerName}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
