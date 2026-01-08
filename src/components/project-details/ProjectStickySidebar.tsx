"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectStickyCard from "./ProjectStickyCard";
import ProjectLeadForm from "./ProjectLeadForm";

interface ProjectStickySidebarProps {
  projectName: string;
  projectId: string;
  address?: string;
  bhkConfig?: string | null;
  carpetArea?: string | number | null;
  possessionDate?: string | null;
  propertyType?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  priceRangeText?: string | null;
  reraNumber?: string | null;
  developerName?: string | null;
  developerLogo?: string | null;
  brochureUrl?: string;
}

export default function ProjectStickySidebar({
  projectName,
  projectId,
  address,
  bhkConfig,
  carpetArea,
  possessionDate,
  propertyType,
  priceMin,
  priceMax,
  priceRangeText,
  reraNumber,
  developerName,
  developerLogo,
  brochureUrl,
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
      <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto space-y-6">
        <ProjectStickyCard
          projectName={projectName}
          address={address}
          bhkConfig={bhkConfig}
          carpetArea={carpetArea}
          possessionDate={possessionDate}
          propertyType={propertyType}
          priceMin={priceMin}
          priceMax={priceMax}
          priceRangeText={priceRangeText}
          reraNumber={reraNumber}
          developerName={developerName}
          onBrochure={handleBrochure}
          onCallBack={handleCallback}
        />

        {/* Inline Lead Form */}
        <ProjectLeadForm
          projectName={projectName}
          projectId={projectId}
          developerName={developerName ?? undefined}
          developerLogo={developerLogo}
          brochureUrl={brochureUrl}
        />
      </div>

      {/* Lead Form Dialog */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {leadFormMode === 'brochure' ? 'Get Brochure' : 'Request Call Back'}
            </DialogTitle>
            <DialogDescription>
              Fill out the form below {leadFormMode === 'brochure' ? 'to receive the brochure' : 'and we will call you back'} for {projectName}.
            </DialogDescription>
          </DialogHeader>
          <ProjectLeadForm
            projectName={projectName}
            projectId={projectId}
            developerName={developerName ?? undefined}
            developerLogo={developerLogo}
            brochureUrl={leadFormMode === 'brochure' ? brochureUrl : undefined}
            inModal={true}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
