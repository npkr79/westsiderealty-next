import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import ProjectLeadForm from "@/components/project-details/ProjectLeadForm";

interface BottomLeadFormSectionProps {
  projectName: string;
  projectId: string;
  developerName?: string | null;
  brochureUrl?: string | null;
}

export default function BottomLeadFormSection({
  projectName,
  projectId,
  developerName,
  brochureUrl,
}: BottomLeadFormSectionProps) {
  return (
    <section className="mt-12 mb-8">
      <ProjectLeadForm
        projectName={projectName}
        projectId={projectId}
        developerName={developerName ?? undefined}
        brochureUrl={brochureUrl}
      />
    </section>
  );
}


