"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";
import ProjectMobileActions from "@/components/project-details/ProjectMobileActions";
import ProjectStickyNav from "@/components/project-details/ProjectStickyNav";
import ProjectKeyFactsStrip from "@/components/project-details/ProjectKeyFactsStrip";
import StickyOfferBanner from "@/components/project-details/StickyOfferBanner";
import type { ProjectWithRelations } from "@/services/projectService";

interface ProjectDetailClientActionsProps {
  projectName: string;
  brochureUrl?: string;
  project?: ProjectWithRelations;
  citySlug?: string;
}

export default function ProjectDetailClientActions({ 
  projectName, 
  brochureUrl,
  project,
  citySlug 
}: ProjectDetailClientActionsProps) {
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);

  const handleWhatsApp = () => {
    if (typeof window !== 'undefined') {
      const message = `Hi, I'm interested in ${projectName}. ${window.location.href}`;
      window.open(`https://wa.me/919866085831?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  return (
    <>
      {/* Sticky Navigation */}
      <ProjectStickyNav projectName={projectName} onWhatsApp={handleWhatsApp} />

      {/* Key Facts Strip */}
      {project && (
        <ProjectKeyFactsStrip
          priceDisplay={(project as any).price_display_string || project.price_range_text}
          reraId={(project as any).rera_id}
          reraLink={(project as any).rera_link}
          status={(project as any).completion_status}
          onEnquire={() => setIsLeadFormOpen(true)}
        />
      )}

      {/* Sticky Offer Banner */}
      {project && (project as any).special_offers && (
        <StickyOfferBanner
          offerData={(project as any).special_offers}
          onClaim={() => setIsLeadFormOpen(true)}
        />
      )}

      {/* Mobile Actions */}
      <ProjectMobileActions
        onWhatsApp={handleWhatsApp}
        onEnquire={() => setIsLeadFormOpen(true)}
      />

      {/* Lead Form Dialog */}
      <Dialog open={isLeadFormOpen} onOpenChange={setIsLeadFormOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Get More Information</DialogTitle>
            <DialogDescription>
              Fill out the form below to receive detailed information about {projectName}.
            </DialogDescription>
          </DialogHeader>
          <ProjectLeadForm
            projectName={projectName}
            projectId={project?.id || ""}
            developerName={project?.developer?.developer_name}
            brochureUrl={brochureUrl}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
