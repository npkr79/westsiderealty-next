import Link from "next/link";
import { getLocalityStats, generateFilterSlug } from "@/lib/utils/localityStats";

interface SmartLinkGridProps {
  microMarketId: string;
  cityId: string;
  microMarketName: string;
  microMarketSlug: string;
  citySlug: string;
  cityName: string;
}

export default async function SmartLinkGrid({
  microMarketId,
  cityId,
  microMarketName,
  microMarketSlug,
  citySlug,
  cityName,
}: SmartLinkGridProps) {
  // Fetch locality stats
  const stats = await getLocalityStats(microMarketId, cityId);

  // If no stats available, don't render
  if (stats.totalProjects === 0) {
    return null;
  }

  // Generate links for each category
  const configLinks = stats.availableConfigs
    .filter((config) => config && config.trim() !== "")
    .map((config) => {
      const slug = generateFilterSlug("config", config, microMarketName);
      const label = `${config} Apartments in ${microMarketName}`;
      return { slug, label };
    });

  const typeLinks = stats.availableTypes
    .filter((type) => type && type.trim() !== "")
    .map((type) => {
      const slug = generateFilterSlug("type", type, microMarketName);
      // Capitalize first letter for display
      const displayType = type.charAt(0).toUpperCase() + type.slice(1);
      const label = `Luxury ${displayType}s in ${microMarketName}`;
      return { slug, label };
    });

  const statusLinks = stats.availableStatuses
    .filter((status) => status && status.trim() !== "")
    .map((status) => {
      const slug = generateFilterSlug("status", status, microMarketName);
      const label = `${status} Projects in ${microMarketName}`;
      return { slug, label };
    });

  // Don't render if no links available
  if (configLinks.length === 0 && typeLinks.length === 0 && statusLinks.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-10 px-4 mt-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
          EXPLORE PROPERTIES IN {microMarketName.toUpperCase()}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* By Configuration */}
          {configLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">By Configuration</h3>
              <div className="space-y-2">
                {configLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/homes/${link.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* By Property Type */}
          {typeLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">By Property Type</h3>
              <div className="space-y-2">
                {typeLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/homes/${link.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* By Status */}
          {statusLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">By Status</h3>
              <div className="space-y-2">
                {statusLinks.map((link) => (
                  <Link
                    key={link.slug}
                    href={`/homes/${link.slug}`}
                    className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
