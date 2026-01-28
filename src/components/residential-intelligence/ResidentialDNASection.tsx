import type { ProjectIntelligenceResult } from "@/services/projectIntelligenceService";
import ProjectDNASection from "@/components/project-dna/ProjectDNASection";

interface ResidentialDNASectionProps {
  intelligence: ProjectIntelligenceResult | null;
}

export default function ResidentialDNASection({ intelligence }: ResidentialDNASectionProps) {
  return <ProjectDNASection intelligenceData={intelligence} />;
}
