"use client";

import { useState } from "react";
import { Home, TrendingUp, Shield, Users, Phone, Mail, ArrowRight, Loader2, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { submitLead } from "@/app/actions/submit-lead";

type PropertyType = "apartment" | "villa" | "commercial" | "plot";

interface BuyingRequirementFormData {
  location: string;
  propertyTypes: PropertyType[];
  budgetMin: string;
  budgetMax: string;
  timeline: "immediate" | "3months" | "researching" | "";
  purpose: "selfuse" | "investment" | "";
  name: string;
  phone: string;
}

const propertyTypeOptions: { id: PropertyType; label: string }[] = [
  { id: "apartment", label: "Apartment" },
  { id: "villa", label: "Villa" },
  { id: "commercial", label: "Commercial" },
  { id: "plot", label: "Plot" },
];

const timelineOptions = [
  { id: "immediate", label: "Immediate" },
  { id: "3months", label: "3 Months" },
  { id: "researching", label: "Just Researching" },
];

const purposeOptions = [
  { id: "selfuse", label: "Self Use" },
  { id: "investment", label: "Investment" },
];

export default function BuyingRequirementPage() {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState<BuyingRequirementFormData>({
    location: "",
    propertyTypes: [],
    budgetMin: "",
    budgetMax: "",
    timeline: "",
    purpose: "",
    name: "",
    phone: "",
  });

  const handlePropertyTypeToggle = (type: PropertyType) => {
    setFormData((prev) => ({
      ...prev,
      propertyTypes: prev.propertyTypes.includes(type)
        ? prev.propertyTypes.filter((t) => t !== type)
        : [...prev.propertyTypes, type],
    }));
  };

  const handleInputChange = (field: keyof BuyingRequirementFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare details object with all extra fields
      const details: Record<string, any> = {
        location: formData.location,
        propertyTypes: formData.propertyTypes,
        budgetMin: formData.budgetMin,
        budgetMax: formData.budgetMax,
        timeline: formData.timeline,
        purpose: formData.purpose,
      };

      // Get current page URL
      const sourcePage = typeof window !== "undefined" ? window.location.pathname : "/buying-requirement";

      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: null,
        type: "BUYER_REQUIREMENT",
        source_page: sourcePage,
        details,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit form");
      }

      // Show success state
      setIsSubmitted(true);

      // Reset form
      setFormData({
        location: "",
        propertyTypes: [],
        budgetMin: "",
        budgetMax: "",
        timeline: "",
        purpose: "",
        name: "",
        phone: "",
      });
    } catch (error: any) {
      console.error("Error submitting buying requirement form:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canSubmit = formData.location.trim() !== "" && formData.propertyTypes.length > 0 && formData.name.trim() !== "" && formData.phone.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left: Form */}
          <Card className="shadow-xl">
            <CardContent className="p-8">
              {isSubmitted ? (
                // Success Message
                <div className="text-center py-12">
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-6" />
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Request Received!
                  </h2>
                  <p className="text-lg text-gray-700 mb-8">
                    We are scanning our network for properties that match your needs.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    variant="outline"
                    size="lg"
                  >
                    Submit Another Requirement
                  </Button>
                </div>
              ) : (
                <>
              <h1 className="text-3xl font-bold mb-2">Find Your Perfect Property</h1>
              <p className="text-muted-foreground mb-8">Tell us what you're looking for, and we'll match you with the best options.</p>

              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Section 1: Location & Type */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="location" className="text-base font-semibold mb-2 block">
                      Where are you looking?
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. Neopolis, Kokapet, Gachibowli"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Property Type? (Select all that apply)</Label>
                    <div className="flex flex-wrap gap-3">
                      {propertyTypeOptions.map((option) => {
                        const isSelected = formData.propertyTypes.includes(option.id);
                        return (
                          <Badge
                            key={option.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`px-4 py-2 text-sm cursor-pointer transition-all ${
                              isSelected
                                ? "bg-primary text-primary-foreground hover:bg-primary/90"
                                : "hover:bg-primary/10 hover:border-primary/50"
                            }`}
                            onClick={() => handlePropertyTypeToggle(option.id)}
                          >
                            {option.label}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Section 2: Budget & Timeline */}
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Budget Range</Label>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Input
                          placeholder="Min: ₹80L"
                          value={formData.budgetMin}
                          onChange={(e) => handleInputChange("budgetMin", e.target.value)}
                          className="h-12"
                        />
                      </div>
                      <div>
                        <Input
                          placeholder="Max: ₹3Cr"
                          value={formData.budgetMax}
                          onChange={(e) => handleInputChange("budgetMax", e.target.value)}
                          className="h-12"
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Timeline</Label>
                    <div className="flex flex-wrap gap-3">
                      {timelineOptions.map((option) => (
                        <Badge
                          key={option.id}
                          variant={formData.timeline === option.id ? "default" : "outline"}
                          className={`px-4 py-2 text-sm cursor-pointer transition-all ${
                            formData.timeline === option.id
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-primary/10 hover:border-primary/50"
                          }`}
                          onClick={() => handleInputChange("timeline", option.id)}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Purpose</Label>
                    <div className="flex flex-wrap gap-3">
                      {purposeOptions.map((option) => (
                        <Badge
                          key={option.id}
                          variant={formData.purpose === option.id ? "default" : "outline"}
                          className={`px-4 py-2 text-sm cursor-pointer transition-all ${
                            formData.purpose === option.id
                              ? "bg-primary text-primary-foreground hover:bg-primary/90"
                              : "hover:bg-primary/10 hover:border-primary/50"
                          }`}
                          onClick={() => handleInputChange("purpose", option.id)}
                        >
                          {option.label}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Section 3: Contact */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name" className="text-base font-semibold mb-2 block">
                      Name
                    </Label>
                    <Input
                      id="name"
                      type="text"
                      placeholder="Your full name"
                      value={formData.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-base font-semibold mb-2 block flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Phone Number
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+91 98765 43210"
                      value={formData.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={!canSubmit || isSubmitting}
                  size="lg"
                  className="w-full bg-primary hover:bg-primary/90 text-lg py-6"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      Find My Match <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>
              </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Right: Why Trust Us */}
          <div className="flex flex-col justify-center space-y-8">
            <div className="space-y-6">
              <h2 className="text-3xl font-bold">Why Trust Us?</h2>
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Verified Properties Only</h3>
                    <p className="text-muted-foreground">
                      We verify all listings for authenticity, ensuring you only see legitimate properties.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Users className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Expert Advisory Team</h3>
                    <p className="text-muted-foreground">
                      Our experienced advisors understand the local market and can guide you to the best decisions.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Market Insights</h3>
                    <p className="text-muted-foreground">
                      Get access to comprehensive market analysis and investment insights for informed decision-making.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Home className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Personalized Matching</h3>
                    <p className="text-muted-foreground">
                      We match you with properties that align with your specific requirements, budget, and timeline.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-primary/5 rounded-xl p-6 border border-primary/20">
              <p className="text-sm text-muted-foreground italic">
                "Our team has helped hundreds of buyers find their perfect property. Let us help you too."
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
