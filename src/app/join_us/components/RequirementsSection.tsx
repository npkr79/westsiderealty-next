"use client";

import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, FileText } from "lucide-react";

interface ProcessStep {
  step: number;
  title: string;
  description: string;
}

interface RequirementsSectionProps {
  title: string;
  subtitle?: string | null;
  requirementsList: string[];
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
                  {requirementsList.map((req, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{req}</span>
                    </li>
                  ))}
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
              {processSteps.map((step) => (
                <Card key={step.step} className="relative">
                  <CardContent className="p-6">
                    <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold text-lg">
                      {step.step}
                    </div>
                    <h4 className="text-lg font-bold text-foreground mb-2 mt-2">
                      {step.title}
                    </h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {step.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
