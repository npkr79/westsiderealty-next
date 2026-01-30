import WestsideDensityIndexCard from "@/components/project-dna/WestsideDensityIndexCard";
import type { WestsideDensityIndex } from "@/intelligence/westsideDensityIndex";

interface WestsideDensityIndexPanelProps {
  index: WestsideDensityIndex;
}

export default function WestsideDensityIndexPanel({
  index,
}: WestsideDensityIndexPanelProps) {
  return <WestsideDensityIndexCard index={index} />;
}
