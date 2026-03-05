import { getTopPicks } from "@/services/microMarketProjectsService";
import MicroMarketTopPicks from "./MicroMarketTopPicks";

interface MicroMarketTopPicksAsyncProps {
  citySlug: string;
  microMarketSlug: string;
}

export default async function MicroMarketTopPicksAsync({
  citySlug,
  microMarketSlug,
}: MicroMarketTopPicksAsyncProps) {
  const projects = await getTopPicks(citySlug, microMarketSlug, 8);

  return (
    <MicroMarketTopPicks
      projects={projects}
      citySlug={citySlug}
      microMarketSlug={microMarketSlug}
    />
  );
}
