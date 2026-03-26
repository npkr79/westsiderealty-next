"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectStickyCard from "./ProjectStickyCard";
import ProjectLeadForm from "./ProjectLeadForm";

interface LeadContext {
  city?: string;
  projectName?: string;
  projectSlug?: string;
  propertyType?: string;
  sourceType?: string;
  microMarket?: string;
  landingPage?: string;
}

interface ProjectStickySidebarProps {
  projectName: string;
  projectId: string;
  address?: string;
  bhkConfig?: string | null;
  carpetArea?: string | number | null;
  possessionDate?: string | null;
  configurationDisplay?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceRangeText?: string | null;
  reraNumber?: string | null;
  developerName?: string | null;
  developerLogo?: string | null;
  brochureUrl?: string;
  microMarketName?: string | null;
  demandContext?: string;
  advisoryYears?: number | null;
  buyersHelped?: number | null;
  leadContext?: LeadContext;
}

export default function ProjectStickySidebar({
  projectName,
  projectId,
  address,
  bhkConfig,
  carpetArea,
  possessionDate,
  configurationDisplay,
  priceMin,
  priceMax,
  priceRangeText,
  reraNumber,
  developerName,
  developerLogo,
  brochureUrl,
  microMarketName,
  demandContext,
  advisoryYears,
  buyersHelped,
  leadContext,
}: ProjectStickySidebarProps) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [leadFormMode, setLeadFormMode] = useState<'brochure' | 'callback'>('brochure');

  const handleBrochure = () => {
    setLeadFormMode('brochure');
    setIsLeadFormOpen(true);
  };

  const handleCallback = () => {
    setLeadFormMode('callback');
    setIsLeadFormOpen(true);
  };

  return (
    <>
      <div className="lg:sticky lg:top-20">
        <div className="space-y-4">
          <ProjectStickyCard
            projectName={projectName}
            address={address}
            bhkConfig={bhkConfig}
            carpetArea={carpetArea}
            possessionDate={possessionDate}
            configurationDisplay={configurationDisplay}
            priceMin={priceMin}
            priceMax={priceMax}
            priceRangeText={priceRangeText}
            reraNumber={reraNumber}
            developerName={developerName}
            microMarketName={microMarketName}
            demandContext={demandContext}
            advisoryYears={advisoryYears}
            buyersHelped={buyersHelped}
            onBrochure={handleBrochure}
            onCallBack={handleCallback}
          />
        </div>
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {leadFormMode === "brochure" ? "Get Brochure and Floor Plans" : "Request a Quick Advisor Callback"}
            </DialogTitle>
            <DialogDescription>
              {leadFormMode === "brochure"
                ? `Share your details for instant brochure access and guided next steps for ${projectName}.`
                : `Share your intent and our local advisory team will call you shortly for ${projectName}.`}
            </DialogDescription>
          </DialogHeader>
          <ProjectLeadForm
            projectName={projectName}
            projectId={projectId}
            developerName={developerName ?? undefined}
            developerLogo={developerLogo}
            brochureUrl={leadFormMode === 'brochure' ? brochureUrl : undefined}
            inModal={true}
            leadPersona="auto"
            triggerContext="modal"
            leadContext={leadContext}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
