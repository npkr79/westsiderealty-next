"use client";

import { useState } from "react";
import { Building2, Home, LandPlot, Store, Phone, Mail, ArrowRight, ArrowLeft, Check, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { submitLead } from "@/app/actions/submit-lead";

type PropertyType = "apartment" | "villa" | "plot" | "commercial" | null;

interface SellPropertyFormData {
  propertyType: PropertyType;
  location: string;
  configuration: string;
  expectedPrice: string;
  additionalDetails: string;
  name: string;
  phone: string;
  email: string;
}

const propertyTypes = [
  { id: "apartment" as const, label: "Apartment", icon: Building2 },
  { id: "villa" as const, label: "Villa", icon: Home },
  { id: "plot" as const, label: "Plot", icon: LandPlot },
  { id: "commercial" as const, label: "Commercial Space", icon: Store },
];

export default function SellPropertyPage() {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<SellPropertyFormData>({
    propertyType: null,
    location: "",
    configuration: "",
    expectedPrice: "",
    additionalDetails: "",
    name: "",
    phone: "",
    email: "",
  });

  const handlePropertyTypeSelect = (type: PropertyType) => {
    setFormData({ ...formData, propertyType: type });
  };

  const handleInputChange = (field: keyof SellPropertyFormData, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare details object with all extra fields
      const details: Record<string, any> = {
        propertyType: formData.propertyType,
        location: formData.location,
        configuration: formData.configuration,
        expectedPrice: formData.expectedPrice,
        additionalDetails: formData.additionalDetails,
      };

      // Get current page URL
      const sourcePage = typeof window !== "undefined" ? window.location.pathname : "/sell-property";

      const result = await submitLead({
        name: formData.name,
        phone: formData.phone,
        email: formData.email || null,
        type: "SELLER_VALUATION",
        source_page: sourcePage,
        details,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit form");
      }

      toast({
        title: "Thank you!",
        description: "We'll contact you soon with your property valuation and buyer list.",
      });

      // Reset form
      setFormData({
        propertyType: null,
        location: "",
        configuration: "",
        expectedPrice: "",
        additionalDetails: "",
        name: "",
        phone: "",
        email: "",
      });
      setStep(1);
    } catch (error: any) {
      console.error("Error submitting sell property form:", error);
      toast({
        title: "Error",
        description: error?.message || "Failed to submit. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceedStep1 = formData.propertyType !== null;
  const canProceedStep2 = formData.location.trim() !== "" && formData.configuration.trim() !== "" && formData.expectedPrice.trim() !== "";
  const canProceedStep3 = formData.name.trim() !== "" && formData.phone.trim() !== "" && formData.email.trim() !== "";

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                    s === step
                      ? "bg-primary text-primary-foreground"
                      : s < step
                      ? "bg-green-500 text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}
                >
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                {s < 3 && (
                  <div
                    className={`w-16 h-1 mx-1 transition-colors ${s < step ? "bg-green-500" : "bg-gray-200"}`}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-xl">
          <CardContent className="p-8">
            {/* Step 1: Property Type */}
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-8">What type of property are you selling?</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {propertyTypes.map((type) => {
                    const Icon = type.icon;
                    const isSelected = formData.propertyType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => handlePropertyTypeSelect(type.id)}
                        className={`p-6 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? "border-primary bg-primary/5 shadow-lg scale-105"
                            : "border-gray-200 bg-white hover:border-primary/50 hover:shadow-md"
                        }`}
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                              isSelected ? "bg-primary text-white" : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>
                          <span className={`text-lg font-semibold ${isSelected ? "text-primary" : "text-gray-900"}`}>
                            {type.label}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-end pt-4">
                  <Button
                    onClick={() => setStep(2)}
                    disabled={!canProceedStep1}
                    size="lg"
                    className="min-w-[150px]"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 2: Property Details */}
            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-8">Tell us about your property</h2>
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div>
                    <Label htmlFor="location" className="text-base font-semibold mb-2 block">
                      Location
                    </Label>
                    <Input
                      id="location"
                      placeholder="e.g. Gachibowli, Hyderabad"
                      value={formData.location}
                      onChange={(e) => handleInputChange("location", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="configuration" className="text-base font-semibold mb-2 block">
                      Configuration
                    </Label>
                    <Input
                      id="configuration"
                      placeholder="e.g. 3 BHK, 1800 sft"
                      value={formData.configuration}
                      onChange={(e) => handleInputChange("configuration", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expectedPrice" className="text-base font-semibold mb-2 block">
                      Expected Price
                    </Label>
                    <Input
                      id="expectedPrice"
                      placeholder="e.g. ₹2.5 Cr"
                      value={formData.expectedPrice}
                      onChange={(e) => handleInputChange("expectedPrice", e.target.value)}
                      className="h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="additionalDetails" className="text-base font-semibold mb-2 block">
                      Additional Details
                    </Label>
                    <Textarea
                      id="additionalDetails"
                      placeholder="Any specific highlights, facing, floor, etc.?"
                      value={formData.additionalDetails}
                      onChange={(e) => handleInputChange("additionalDetails", e.target.value)}
                      rows={4}
                      className="resize-none"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(1)} size="lg">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    onClick={() => setStep(3)}
                    disabled={!canProceedStep2}
                    size="lg"
                    className="min-w-[150px]"
                  >
                    Next <ArrowRight className="ml-2 w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Step 3: Contact & Submit */}
            {step === 3 && (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-3xl font-bold text-center mb-8">Where should we send the valuation?</h2>
                <div className="space-y-6 max-w-2xl mx-auto">
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

                  <div>
                    <Label htmlFor="email" className="text-base font-semibold mb-2 block flex items-center gap-2">
                      <Mail className="w-4 h-4" /> Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.email}
                      onChange={(e) => handleInputChange("email", e.target.value)}
                      required
                      className="h-12"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4">
                  <Button variant="outline" onClick={() => setStep(2)} type="button" size="lg">
                    <ArrowLeft className="mr-2 w-4 h-4" /> Back
                  </Button>
                  <Button
                    type="submit"
                    disabled={!canProceedStep3 || isSubmitting}
                    size="lg"
                    className="min-w-[220px] bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Get Free Valuation & Buyer List <ArrowRight className="ml-2 w-4 h-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
