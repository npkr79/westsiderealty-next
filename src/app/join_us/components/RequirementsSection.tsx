"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText } from "lucide-react";

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

// Type guard helper
function isRequirementObject(value: unknown): value is Record<string, any> {
  return value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value);
}

interface RequirementsSectionProps {
  title: string;
  subtitle?: string | null;
  requirementsList: (string | Record<string, any>)[];
  whatWeLookFor?: string | null;
  processSteps: ProcessStep[];
}

export function RequirementsSection({
  title,
  subtitle,
  requirementsList,
  whatWeLookFor,
  processSteps,
}: RequirementsSectionProps) {
  return (
    <section className="container mx-auto px-4 py-16 md:py-24">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4">
            {title}
          </h2>
          {subtitle && (
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Requirements List */}
          {requirementsList.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Requirements & Qualifications
                </h3>
                <ul className="space-y-3">
                  {requirementsList && Array.isArray(requirementsList) && requirementsList.length > 0 ? (
                    requirementsList.map((req, index) => {
                      // Handle both string and object formats
                      let requirementText = '';
                      
                      // Type guard: check if it's a string first
                      if (typeof req === 'string') {
                        requirementText = req;
                      } 
                      // Type guard: check if it's an object using helper function
                      else if (isRequirementObject(req)) {
                        // TypeScript now knows req is Record<string, any>
                        requirementText = req.text || req.requirement || req.item || req.content || req.description || '';
                        // If still empty, try to stringify safely
                        if (!requirementText) {
                          requirementText = JSON.stringify(req);
                        }
                      } 
                      // Fallback: convert anything else to string
                      else {
                        requirementText = String(req || '');
                      }
                      
                      // Skip if text is empty
                      if (!requirementText || requirementText.trim() === '') {
                        return null;
                      }
                      
                      return (
                        <li key={index} className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                          <span className="text-muted-foreground">{requirementText}</span>
                        </li>
                      );
                    }).filter(Boolean)
                  ) : (
                    <li className="text-muted-foreground">No requirements listed.</li>
                  )}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* What We Look For */}
          {whatWeLookFor && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-foreground mb-4">
                  What We Look For
                </h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                  {whatWeLookFor}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Application Process Steps */}
        {processSteps.length > 0 && (
          <div>
            <h3 className="text-2xl font-bold text-foreground mb-6 text-center">
              Application Process
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {processSteps && Array.isArray(processSteps) && processSteps.length > 0 ? (
                processSteps.map((step) => {
                  if (!step || typeof step !== 'object') {
                    return null;
                  }
                  
                  const stepNumber = typeof step.step === 'number' ? step.step : 0;
                  const title = typeof step.title === 'string' ? step.title : '';
                  const description = typeof step.description === 'string' ? step.description : '';
                  
                  return (
                    <Card key={stepNumber} className="relative">
                      <CardContent className="p-6">
                        <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                          {stepNumber}
                        </div>
                        <h4 className="text-lg font-bold text-foreground mb-2 mt-2">
                          {title}
                        </h4>
                        <p className="text-muted-foreground text-sm leading-relaxed">
                          {description}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="col-span-full text-center text-muted-foreground py-8">
                  No process steps available.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
