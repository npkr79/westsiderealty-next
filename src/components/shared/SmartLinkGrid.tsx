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
  const residentialLinks = stats.residentialTypes
    .filter((type) => type && type.trim() !== "")
    .map((type) => {
      const slug = generateFilterSlug("residential", type, microMarketName);
      // Format: "{Type} in {Market}"
      const label = `${type} in ${microMarketName}`;
      return { slug, label };
    });

  const commercialLinks = stats.commercialTypes
    .filter((type) => type && type.trim() !== "")
    .map((type) => {
      const slug = generateFilterSlug("commercial", type, microMarketName);
      // Format: "{Type}s in {Market}" (pluralize)
      const pluralType = type.endsWith("Space") 
        ? type.replace("Space", "Spaces")
        : type.endsWith("s")
        ? type
        : `${type}s`;
      const label = `${pluralType} in ${microMarketName}`;
      return { slug, label };
    });

  const priceLinks = stats.priceRanges
    .filter((price) => price && price.trim() !== "")
    .map((price) => {
      const slug = generateFilterSlug("price", price, microMarketName);
      const label = `Properties ${price} in ${microMarketName}`;
      return { slug, label };
    });

  const statusLinks = stats.statuses
    .filter((status) => status && status.trim() !== "")
    .map((status) => {
      const slug = generateFilterSlug("status", status, microMarketName);
      const label = `${status} Projects in ${microMarketName}`;
      return { slug, label };
    });

  // Don't render if no links available
  if (residentialLinks.length === 0 && commercialLinks.length === 0 && priceLinks.length === 0 && statusLinks.length === 0) {
    return null;
  }

  return (
    <section className="bg-gray-50 py-10 px-4 mt-12">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
          EXPLORE PROPERTIES IN {microMarketName.toUpperCase()}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Residential Properties */}
          {residentialLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Residential Properties in {microMarketName}</h3>
              <div className="space-y-2">
                {residentialLinks.map((link) => (
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

          {/* Commercial Properties */}
          {commercialLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Commercial Properties in {microMarketName}</h3>
              <div className="space-y-2">
                {commercialLinks.map((link) => (
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

          {/* Browse by Price */}
          {priceLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Browse by Price in {microMarketName}</h3>
              <div className="space-y-2">
                {priceLinks.map((link) => (
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

          {/* Browse by Status */}
          {statusLinks.length > 0 && (
            <div>
              <h3 className="text-base font-semibold text-gray-900 mb-3">Browse by Status in {microMarketName}</h3>
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
