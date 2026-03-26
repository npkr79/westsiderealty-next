import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";

interface LeadContext {
  city?: string;
  projectName?: string;
  projectSlug?: string;
  propertyType?: string;
  sourceType?: string;
  microMarket?: string;
  landingPage?: string;
}

interface BottomLeadFormSectionProps {
  projectName: string;
  projectId: string;
  developerName?: string | null;
  brochureUrl?: string | null;
  leadContext?: LeadContext;
}

export default function BottomLeadFormSection({
  projectName,
  projectId,
  developerName,
  brochureUrl,
  leadContext,
}: BottomLeadFormSectionProps) {
  return (
    <section className="mt-12 mb-8">
      <ProjectLeadForm
        projectName={projectName}
        projectId={projectId}
        developerName={developerName ?? undefined}
        brochureUrl={brochureUrl}
        leadContext={leadContext}
      />
    </section>
  );
}


