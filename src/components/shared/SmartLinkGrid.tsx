import Link from "next/link";
import { getLocalityStats, generateFilterSlug } from "@/lib/utils/localityStats";
import { 
  getDeveloperStats, 
  getCityStats, 
  getMicroMarketDeveloperStats,
  generateSmartLinkUrl,
  type SmartLinkStats 
} from "@/lib/utils/smartLinkGenerator";
import { createClient } from "@/lib/supabase/server";

interface SmartLinkGridProps {
  // Micro Market mode (existing - required for backward compatibility)
  microMarketId?: string;
  cityId?: string;
  microMarketName?: string;
  microMarketSlug?: string;
  citySlug: string;
  cityName: string;
  
  // Developer mode (optional)
  developerId?: string;
  developerName?: string;
  developerSlug?: string;
  
  // City mode (optional)
  mode?: "microMarket" | "developer" | "city" | "microMarketDeveloper";
}

/**
 * Render a single smartlink grid section
 */
function renderGridSection(
  title: string,
  links: Array<{ url: string; label: string }>,
  citySlug: string,
  locationName: string
) {
  if (links.length === 0) return null;

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-3">{title}</h3>
      <div className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.url}
            href={link.url}
            className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

/**
 * Generate links from stats for the new 2x3 grid layout (matching sample)
 */
function generateSmartLinks(
  stats: SmartLinkStats,
  citySlug: string,
  locationName: string,
  context?: { microMarketSlug?: string; developerSlug?: string }
) {
  const links: Array<{ category: string; title: string; links: Array<{ url: string; label: string }> }> = [];

  // Category 1: Discover Dream Home (Property Types)
  if (stats.propertyTypes.length > 0) {
    const propertyTypeLinks = stats.propertyTypes
      .filter(type => ["Apartment", "Villa", "Penthouse"].includes(type))
      .map(type => ({
        url: generateSmartLinkUrl(citySlug, "propertyType", type, context),
        label: `${type}${type === "Apartment" ? "s" : ""} for sale in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`
      }));
    
    if (propertyTypeLinks.length > 0) {
      links.push({
        category: "discover",
        title: `Discover Dream Home in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: propertyTypeLinks
      });
    }
  }

  // Category 2: Choose Ideal Home (Budget Categories)
  if (stats.budgetCategories.length > 0) {
    const budgetLinks = stats.budgetCategories.map(budget => ({
      url: generateSmartLinkUrl(citySlug, "budget", budget, context),
      label: `${budget} Homes for sale in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`
    }));
    
    if (budgetLinks.length > 0) {
      links.push({
        category: "choose",
        title: `Choose Ideal Home in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: budgetLinks
      });
    }
  }

  // Category 3: Find Home by Budget (Price Ranges)
  if (stats.priceRanges.length > 0) {
    const priceLinks = stats.priceRanges.map(price => ({
      url: generateSmartLinkUrl(citySlug, "priceRange", price, context),
      label: `Homes for sale in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)} ${price}`
    }));
    
    if (priceLinks.length > 0) {
      links.push({
        category: "budget",
        title: `Find Home by Budget in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: priceLinks
      });
    }
  }

  // Category 4: Search Home by BHK
  if (stats.bhkConfigs.length > 0) {
    const bhkLinks = stats.bhkConfigs.map(bhk => ({
      url: generateSmartLinkUrl(citySlug, "bhk", bhk, context),
      label: `${bhk} Homes for sale in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`
    }));
    
    if (bhkLinks.length > 0) {
      links.push({
        category: "bhk",
        title: `Search Home by BHK in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: bhkLinks
      });
    }
  }

  // Category 5: Explore New Projects (Status)
  if (stats.statuses.length > 0) {
    const statusLinks = stats.statuses.map(status => ({
      url: generateSmartLinkUrl(citySlug, "status", status, context),
      label: `${status} in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)} for sale`
    }));
    
    if (statusLinks.length > 0) {
      links.push({
        category: "projects",
        title: `Explore New Projects in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: statusLinks
      });
    }
  }

  // Category 6: Find Perfect View Home (View Types - if available)
  if (stats.viewTypes.length > 0) {
    const viewLinks = stats.viewTypes.map(view => ({
      url: generateSmartLinkUrl(citySlug, "view", view, context),
      label: `${view} Homes for sale in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`
    }));
    
    if (viewLinks.length > 0) {
      links.push({
        category: "view",
        title: `Find Perfect View Home in ${locationName} ${citySlug === "hyderabad" ? "Hyderabad" : citySlug.charAt(0).toUpperCase() + citySlug.slice(1)}`,
        links: viewLinks
      });
    }
  }

  return links;
}

export default async function SmartLinkGrid({
  microMarketId,
  cityId,
  microMarketName,
  microMarketSlug,
  citySlug,
  cityName,
  developerId,
  developerName,
  developerSlug,
  mode = "microMarket",
}: SmartLinkGridProps) {
  try {
    // Determine mode based on provided props
    let actualMode = mode;
    if (!actualMode) {
      if (microMarketId && developerId) {
        actualMode = "microMarketDeveloper";
      } else if (developerId) {
        actualMode = "developer";
      } else if (microMarketId) {
        actualMode = "microMarket";
      } else {
        actualMode = "city";
      }
    }

    const locationName = microMarketName || developerName || cityName;
    const displayName = citySlug === "hyderabad" ? "Hyderabad" : cityName;

    // Fetch stats based on mode
    if (actualMode === "microMarket" && microMarketId && cityId) {
      // Existing micro market mode (backward compatible)
      const stats = await getLocalityStats(microMarketId, cityId);

      if (stats.totalProjects === 0) {
        return null;
      }

      // Generate links using existing format
      const residentialLinks = stats.residentialTypes
        .filter((type) => type && type.trim() !== "")
        .map((type) => {
          const slug = generateFilterSlug("residential", type, microMarketName!);
          const label = `${type} in ${microMarketName}`;
          return { slug, label };
        });

      const commercialLinks = stats.commercialTypes
        .filter((type) => type && type.trim() !== "")
        .map((type) => {
          const slug = generateFilterSlug("commercial", type, microMarketName!);
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
          const slug = generateFilterSlug("price", price, microMarketName!);
          const label = `Properties ${price} in ${microMarketName}`;
          return { slug, label };
        });

      const statusLinks = stats.statuses
        .filter((status) => status && status.trim() !== "")
        .map((status) => {
          const slug = generateFilterSlug("status", status, microMarketName!);
          const label = `${status} Projects in ${microMarketName}`;
          return { slug, label };
        });

      if (residentialLinks.length === 0 && commercialLinks.length === 0 && priceLinks.length === 0 && statusLinks.length === 0) {
        return null;
      }

      // Render existing format for backward compatibility
      return (
        <section className="bg-gray-50 py-10 px-4 mt-12">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
              EXPLORE PROPERTIES IN {microMarketName!.toUpperCase()}
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {renderGridSection(
                `Residential Properties in ${microMarketName}`,
                residentialLinks.map(l => ({ url: `/homes/${l.slug}`, label: l.label })),
                citySlug,
                microMarketName!
              )}
              {renderGridSection(
                `Commercial Properties in ${microMarketName}`,
                commercialLinks.map(l => ({ url: `/homes/${l.slug}`, label: l.label })),
                citySlug,
                microMarketName!
              )}
              {renderGridSection(
                `Browse by Price in ${microMarketName}`,
                priceLinks.map(l => ({ url: `/homes/${l.slug}`, label: l.label })),
                citySlug,
                microMarketName!
              )}
              {renderGridSection(
                `Browse by Status in ${microMarketName}`,
                statusLinks.map(l => ({ url: `/homes/${l.slug}`, label: l.label })),
                citySlug,
                microMarketName!
              )}
            </div>
          </div>
        </section>
      );
    }

    // New modes: developer, city, or microMarketDeveloper
    let stats: SmartLinkStats | null = null;
    let microMarketStats: SmartLinkStats | null = null;
    let developerStats: SmartLinkStats | null = null;

    if (actualMode === "developer" && developerId && developerName && cityId) {
      stats = await getDeveloperStats(developerId, developerName, cityId, citySlug);
    } else if (actualMode === "city") {
      // For city mode, we need cityId - try to get it if not provided
      let resolvedCityId = cityId;
      if (!resolvedCityId) {
        const supabase = await createClient();
        const { data: city } = await supabase
          .from('cities')
          .select('id')
          .eq('url_slug', citySlug)
          .maybeSingle();
        resolvedCityId = city?.id || null;
      }
      if (resolvedCityId) {
        stats = await getCityStats(resolvedCityId, citySlug);
      } else {
        // If we still don't have cityId, return null
        return null;
      }
    } else if (actualMode === "microMarketDeveloper" && microMarketId && cityId) {
      const result = await getMicroMarketDeveloperStats(
        microMarketId,
        microMarketName || "",
        developerId || null,
        developerName || null,
        cityId,
        citySlug
      );
      microMarketStats = result.microMarket;
      developerStats = result.developer;
    }

    // Check if we have any stats to display
    const hasStats = stats && (stats.totalProperties > 0 || stats.totalProjects > 0);
    const hasMicroMarketStats = microMarketStats && (microMarketStats.totalProperties > 0 || microMarketStats.totalProjects > 0);
    const hasDeveloperStats = developerStats && (developerStats.totalProperties > 0 || developerStats.totalProjects > 0);

    if (!hasStats && !hasMicroMarketStats && !hasDeveloperStats) {
      return null;
    }

    // Generate smartlinks for new 2x3 grid layout
    const context = {
      microMarketSlug: microMarketSlug || undefined,
      developerSlug: developerSlug || undefined,
    };

    const sections: Array<{ category: string; title: string; links: Array<{ url: string; label: string }> }> = [];

    // For microMarketDeveloper mode, show both micro market and developer sections
    if (actualMode === "microMarketDeveloper") {
      if (hasMicroMarketStats && microMarketName) {
        const microMarketSections = generateSmartLinks(microMarketStats, citySlug, microMarketName, context);
        sections.push(...microMarketSections);
      }
      if (hasDeveloperStats && developerName) {
        const developerSections = generateSmartLinks(developerStats, citySlug, developerName, context);
        sections.push(...developerSections);
      }
    } else if (stats) {
      const generatedSections = generateSmartLinks(stats, citySlug, locationName, context);
      sections.push(...generatedSections);
    }

    if (sections.length === 0) {
      return null;
    }

    // Render new 2x3 grid layout (matching sample)
    return (
      <section className="bg-gray-50 py-10 px-4 mt-12">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-sm font-bold tracking-widest text-gray-500 uppercase mb-6">
            EXPLORE PROPERTIES IN {locationName.toUpperCase()}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {sections.slice(0, 6).map((section) => (
              <div key={section.category}>
                <h3 className="text-base font-semibold text-gray-900 mb-3">{section.title}</h3>
                <div className="space-y-2">
                  {section.links.map((link) => (
                    <Link
                      key={link.url}
                      href={link.url}
                      className="text-sm text-gray-600 hover:text-blue-600 transition-colors py-1 block"
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('[SmartLinkGrid] Error rendering grid:', error);
    return null;
  }
}
