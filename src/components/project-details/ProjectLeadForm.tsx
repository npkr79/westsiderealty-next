"use client";

import { useState } from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Building2, Loader2, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { submitLead } from "@/app/actions/submit-lead";
import { z } from "zod";
import { buildProjectsIndexUrl } from "@/lib/routes";
import { getAdvisoryTrackingContext, trackListingsEvent } from "@/lib/analytics/listingsTracking";
import { trackBehaviorEvent } from "@/lib/analytics/behaviorTracking";

interface ProjectLeadFormProps {
  projectName: string;
  projectId: string;
  developerName?: string;
  developerLogo?: string | null;
  inModal?: boolean;
  brochureUrl?: string | null;
  leadPersona?: "auto" | "investor" | "end-user";
  triggerContext?: "sidebar-sticky" | "inline-mobile" | "modal";
  initialIntent?: "investment" | "end-use" | "upgrade" | "nri";
  compactMode?: boolean;
}

const leadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  email: z.string().trim().email("Enter valid email address").min(1, "Email is required").max(255),
});

const compactLeadSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  phone: z.string().trim().regex(/^[6-9]\d{9}$/, "Enter valid 10-digit mobile number"),
  email: z.string().trim().optional(),
});

const intentOptionsByPersona: Record<NonNullable<ProjectLeadFormProps["leadPersona"]>, string[]> = {
  auto: [
    "End-use home purchase",
    "Investment / rental yield",
    "Upgrade from current home",
    "Shortlist and compare",
  ],
  investor: [
    "Rental yield focus",
    "Long-term appreciation",
    "Portfolio diversification",
    "Shortlist and compare",
  ],
  "end-user": [
    "Primary family home",
    "Upgrade from current home",
    "Near-work convenience",
    "Shortlist and compare",
  ],
};

const budgetOptions = [
  "Below 1 Cr",
  "1 Cr to 2 Cr",
  "2 Cr to 3 Cr",
  "Above 3 Cr",
];

const advisoryTrustPoints = [
  "Senior advisor support from local market specialists.",
  "Corridor-level guidance on fit, stage confidence, and daily livability.",
  "No spam. Your details stay private and are never sold.",
];

export default function ProjectLeadForm({
  projectName,
  projectId,
  developerName,
  developerLogo,
  inModal = false,
  brochureUrl,
  leadPersona = "auto",
  triggerContext = "sidebar-sticky",
  initialIntent,
  compactMode = false,
}: ProjectLeadFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(compactMode ? 3 : 1);
  const initialIntentOption = (() => {
    if (!initialIntent) return "";
    if (initialIntent === "investment") return "Investment / rental yield";
    if (initialIntent === "end-use") return "End-use home purchase";
    if (initialIntent === "upgrade") return "Upgrade from current home";
    return "Investment / rental yield";
  })();
  const [intent, setIntent] = useState(initialIntentOption);
  const [budgetBand, setBudgetBand] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const intentOptions = intentOptionsByPersona[leadPersona];

  const formTitle =
    triggerContext === "inline-mobile"
      ? "Talk to a Local Property Advisor"
      : triggerContext === "modal"
        ? "Get Personalized Project Guidance"
        : "Advisor-Led Decision Support";

  const formSubtitle =
    triggerContext === "inline-mobile"
      ? "Premium guidance in simple steps. We help you decide, not push."
      : triggerContext === "modal"
        ? "Share your intent and get focused recommendations from our advisory desk."
        : "Compare with confidence using senior local advisory and clear, practical recommendations.";

  const progressPercent = compactMode ? 100 : step === 1 ? 33 : step === 2 ? 66 : 100;
  const completionTimeHint = compactMode ? "Takes about 20 seconds" : "Takes about 45 seconds";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    try {
      if (!intent) {
        setErrors({ intent: "Please select your intent" });
        return;
      }
      if (!compactMode && !budgetBand) {
        setErrors({ budget: "Please select your budget range" });
        return;
      }

      const validated = (compactMode ? compactLeadSchema : leadSchema).parse(formData);
      setLoading(true);

      // Prepare details object
      const details: Record<string, unknown> = {
        projectName,
        projectId,
        developerName: developerName || null,
        brochureUrl: brochureUrl || null,
        buyerIntent: intent,
        budgetBand: compactMode ? null : budgetBand,
        qualificationStep: "intent-budget-v1",
        leadPersona,
        triggerContext,
      };

      // Get current page URL
      const sourcePage =
        typeof window !== "undefined" ? window.location.href : buildProjectsIndexUrl("hyderabad");

      const result = await submitLead({
        name: validated.name,
        phone: validated.phone,
        email: validated.email,
        type: "PROJECT_INTEREST",
        source_page: sourcePage,
        details,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to submit form");
      }

      const advisoryContext = getAdvisoryTrackingContext();
      const conversionMs =
        advisoryContext.startedAt && Number.isFinite(advisoryContext.startedAt)
          ? Date.now() - advisoryContext.startedAt
          : null;
      trackListingsEvent("lead_submitted", {
        projectId,
        projectName,
        triggerContext,
        leadPersona,
        selectedIntent: intent || null,
        initialIntent: initialIntent || null,
        viewedSections: advisoryContext.sectionsViewed || [],
        sectionViewMs: advisoryContext.sectionViewMs || {},
        scrollDepth: advisoryContext.maxScrollDepth ?? null,
        timeToConversionMs: conversionMs,
      });

      // Show success state
      setIsSubmitted(true);

      // Trigger brochure download if available
      if (brochureUrl) {
        void trackBehaviorEvent("brochure_download", {
          project_id: projectId,
          project_name: projectName,
          brochure_url: brochureUrl,
        });
        window.open(brochureUrl, '_blank');
      }

      setFormData({ name: "", phone: "", email: "" });
      setIntent("");
      setBudgetBand("");
      setStep(compactMode ? 3 : 1);
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
          description: error instanceof Error ? error.message : "Failed to submit. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Render form content without Card wrapper when in modal
  const formContent = (
    <>
      {isSubmitted ? (
        // Success Message
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            Interest Registered!
          </h2>
          <p className="text-base text-gray-700 mb-6">
            A sales representative for {projectName} will contact you soon.
            {brochureUrl && " Brochure downloading..."}
          </p>
          <Button
            onClick={() => setIsSubmitted(false)}
            variant="outline"
            size="sm"
          >
            Submit Another
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{completionTimeHint}</span>
              <span>{progressPercent}% complete</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-slate-200">
              <div
                className="h-1.5 rounded-full bg-emerald-600 transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          {compactMode ? null : (
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className={step >= 1 ? "font-semibold text-foreground" : ""}>Step 1: Intent</span>
              <span className={step >= 2 ? "font-semibold text-foreground" : ""}>Step 2: Budget</span>
              <span className={step >= 3 ? "font-semibold text-foreground" : ""}>Contact</span>
            </div>
          )}

          <div className="rounded-md bg-emerald-50 border border-emerald-100 p-3">
            <p className="text-xs font-semibold text-emerald-800">Why share your details</p>
            <ul className="mt-1.5 space-y-1 text-xs text-emerald-700">
              {advisoryTrustPoints.map((point) => (
                <li key={point}>• {point}</li>
              ))}
            </ul>
          </div>

          {compactMode ? null : step === 1 ? (
            <div className="space-y-2">
              <Label>What best describes your intent?</Label>
              <p className="text-xs text-muted-foreground">
                This helps us personalize guidance for end-use priorities or investment/yield goals.
              </p>
              {initialIntent ? (
                <p className="text-xs text-emerald-700">
                  Personalization prefilled from your preference. You can change it anytime.
                </p>
              ) : null}
              <div className="grid gap-2">
                {intentOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setIntent(option);
                      setErrors((prev) => ({ ...prev, intent: "" }));
                    }}
                    className={`rounded-md border px-3 py-2 text-left text-sm ${
                      intent === option ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.intent && <p className="text-xs text-destructive">{errors.intent}</p>}
              <Button type="button" className="w-full" onClick={() => intent && setStep(2)}>
                Continue
              </Button>
            </div>
          ) : null}

          {compactMode ? null : step === 2 ? (
            <div className="space-y-2">
              <Label>What is your expected budget range?</Label>
              <p className="text-xs text-muted-foreground">A range is enough. We use this only to shortlist relevant options.</p>
              <div className="grid gap-2">
                {budgetOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => {
                      setBudgetBand(option);
                      setErrors((prev) => ({ ...prev, budget: "" }));
                    }}
                    className={`rounded-md border px-3 py-2 text-left text-sm ${
                      budgetBand === option ? "border-primary bg-primary/5" : "border-border"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
              {errors.budget && <p className="text-xs text-destructive">{errors.budget}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="w-1/2" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button type="button" className="w-1/2" onClick={() => budgetBand && setStep(3)}>
                  Continue
                </Button>
              </div>
            </div>
          ) : null}

          {compactMode || step === 3 ? (
            <>
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

              {compactMode ? null : (
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
                  <p className="text-xs text-muted-foreground">
                    We respect your privacy. No third-party sharing.
                  </p>
                </div>
              )}

              <div className={compactMode ? "flex" : "flex gap-2"}>
                {compactMode ? null : (
                  <Button type="button" variant="outline" className="w-1/3" onClick={() => setStep(2)}>
                    Back
                  </Button>
                )}
                <Button
                  type="submit"
                  className={compactMode ? "w-full bg-green-600 hover:bg-green-700" : "w-2/3 bg-green-600 hover:bg-green-700"}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    compactMode ? "Request Concierge Callback" : "Get Advisory Call"
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </form>
      )}
    </>
  );

  if (inModal) {
    return formContent;
  }

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 shadow-lg">
        <CardContent className="pt-6 space-y-5">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">Guided advisory</p>
            <p className="mt-1 text-base font-semibold text-foreground">{formTitle}</p>
            <p className="text-xs text-muted-foreground mt-1.5">
              {formSubtitle}
            </p>
          </div>
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
