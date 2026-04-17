/**
 * Schema Gap Detector — westsiderealty.in
 *
 * Audits page template source files for missing or incomplete structured data.
 * Based on recommendations from the SEO analysis (PDF) and Google's Rich Results guide.
 *
 * Checks per template type:
 *   homepage            → RealEstateAgent, Organization ✓ (already good)
 *   project-detail      → ApartmentComplex + Offer (price range) + BreadcrumbList
 *   micro-market        → ItemList (listing projects), FAQPage, BreadcrumbList
 *   city-hub            → LocalBusiness / RealEstateAgent for the city, BreadcrumbList
 *   blog/insight        → Article schema, BreadcrumbList
 *   property-listing    → RealEstateListing, Offer with price
 *   developer-profile   → Organization / LocalBusiness for the developer
 *
 * Output: list of schema gap findings — reported in PR body but NOT auto-applied,
 * since schema changes touch component/utility files and require human review.
 *
 * For each gap we generate the recommended schema JSON snippet to make it
 * easy for the developer to add it.
 */

import fs from "fs";
import path from "path";

// ─── Schema type presence checks ─────────────────────────────────────────────

function hasSchemaType(content, ...types) {
  return types.some((t) => content.includes(`"@type": "${t}"`) || content.includes(`'@type': '${t}'`));
}

function hasSchemaProperty(content, property) {
  return content.includes(`"${property}"`) || content.includes(`'${property}'`);
}

// ─── Template-specific gap rules ─────────────────────────────────────────────

const TEMPLATE_RULES = [
  {
    template: "homepage",
    file: "src/app/page.tsx",
    checks: [
      {
        id: "homepage-telephone",
        severity: "medium",
        description: "RealEstateAgent schema missing telephone number",
        check: (c) =>
          hasSchemaType(c, "RealEstateAgent") && !hasSchemaProperty(c, "telephone"),
        recommendation: `Add telephone to localBusinessSchema:
  telephone: "+91-40-XXXX-XXXX",`,
      },
      {
        id: "homepage-aggregate-rating",
        severity: "high",
        description: "No AggregateRating on RealEstateAgent — star ratings boost CTR significantly",
        check: (c) =>
          hasSchemaType(c, "RealEstateAgent") && !hasSchemaType(c, "AggregateRating"),
        recommendation: `Add to localBusinessSchema (once you have reviews):
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.8",
    reviewCount: "47",
    bestRating: "5",
    worstRating: "1"
  },`,
      },
      {
        id: "homepage-canonical",
        severity: "high",
        description: "Homepage metadata has no canonical URL",
        check: (c) =>
          /export const metadata/.test(c) && !/canonical/.test(c),
        recommendation: `Add to metadata export:
  alternates: {
    canonical: "https://www.westsiderealty.in/",
  },`,
      },
    ],
  },
  {
    template: "project-detail",
    file: "src/app/[citySlug]/projects/[projectSlug]/page.tsx",
    checks: [
      {
        id: "project-offer-price",
        severity: "high",
        description: "ApartmentComplex schema lacks Offer/price — prevents price rich snippets in SERP",
        check: (c) => !hasSchemaType(c, "Offer") && !hasSchemaProperty(c, "offers"),
        recommendation: `In ProjectSEO.tsx, add to the ApartmentComplex schema:
  offers: {
    "@type": "Offer",
    priceCurrency: "INR",
    price: project.price_min,           // use actual min price from DB
    priceSpecification: {
      "@type": "UnitPriceSpecification",
      price: project.price_min,
      priceCurrency: "INR",
      referenceQuantity: {
        "@type": "QuantitativeValue",
        value: 1,
        unitCode: "SQF"                 // per sq ft
      }
    },
    availability: "https://schema.org/InStock"
  },`,
      },
      {
        id: "project-rera-identifier",
        severity: "medium",
        description: "Missing identifier (RERA number) in ApartmentComplex schema",
        check: (c) => !hasSchemaProperty(c, "identifier"),
        recommendation: `Add RERA identifier to ApartmentComplex schema:
  identifier: {
    "@type": "PropertyValue",
    name: "RERA Registration Number",
    value: project.rera_id
  },`,
      },
    ],
  },
  {
    template: "micro-market",
    file: "src/app/[citySlug]/[microMarketSlug]/page.tsx",
    checks: [
      {
        id: "micromarket-itemlist",
        severity: "high",
        description: "No ItemList schema — listing pages benefit from rich snippets showing project count",
        check: (c) => !hasSchemaType(c, "ItemList") && !hasSchemaType(c, "CollectionPage"),
        recommendation: `Add an ItemList to the micro-market page's generateUnifiedSchema call:
  primaryEntityType: "ItemList",
  primaryEntity: {
    "@type": "ItemList",
    name: \`\${microMarket.name} Real Estate Projects\`,
    numberOfItems: projects.length,
    itemListElement: projects.slice(0, 10).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: buildProjectAbsoluteUrl(citySlug, p.slug),
      name: p.name,
    })),
  },`,
      },
      {
        id: "micromarket-local-business",
        severity: "medium",
        description: "No LocalBusiness/RealEstateAgent for the service area — helps map pack visibility",
        check: (c) => !hasSchemaType(c, "LocalBusiness", "RealEstateAgent"),
        recommendation: `Add a LocalBusiness node to the @graph via generateUnifiedSchema extensions:
  // Add as an extra JSON-LD script
  {
    "@type": "RealEstateAgent",
    "@id": "https://www.westsiderealty.in/#realestateagent-{microMarketSlug}",
    name: "RE/MAX Westside Realty — {microMarket.name}",
    url: "https://www.westsiderealty.in/{citySlug}/{microMarketSlug}",
    areaServed: {
      "@type": "Place",
      name: microMarket.name,
      containedInPlace: { "@type": "City", name: cityName }
    }
  }`,
      },
    ],
  },
  {
    template: "city-hub",
    file: "src/app/[citySlug]/page.tsx",
    checks: [
      {
        id: "city-breadcrumb",
        severity: "medium",
        description: "City hub page may lack BreadcrumbList — check generateMetadata includes breadcrumbs",
        check: (c) => !hasSchemaType(c, "BreadcrumbList") && !hasSchemaProperty(c, "breadcrumbs"),
        recommendation: `Pass breadcrumbs to generateUnifiedSchema:
  breadcrumbs: [
    { name: "Home", item: "https://www.westsiderealty.in/" },
    { name: cityName, item: buildCityAbsoluteUrl(citySlug) },
  ],`,
      },
    ],
  },
  {
    template: "blog-article",
    file: "src/app/blog/[slug]/page.tsx",
    checks: [
      {
        id: "blog-article-schema",
        severity: "high",
        description: "Blog pages need Article schema with datePublished/dateModified for news-style snippets",
        check: (c) => !hasSchemaType(c, "Article", "BlogPosting", "NewsArticle"),
        recommendation: `Add Article schema in generateMetadata or via JsonLd component:
  {
    "@type": "Article",
    "@id": articleUrl + "#article",
    headline: article.title,
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: { "@type": "Organization", name: "RE/MAX Westside Realty" },
    publisher: { "@id": "https://www.westsiderealty.in/#organization" },
    image: article.hero_image_url,
    mainEntityOfPage: { "@id": articleUrl + "#webpage" }
  }`,
      },
      {
        id: "blog-faq-schema",
        severity: "medium",
        description: "Blog posts with FAQ sections should use FAQPage schema — enables People Also Ask expansion",
        check: (c) =>
          !hasSchemaType(c, "FAQPage") &&
          (c.includes("FAQ") || c.includes("faq") || c.includes("Frequently Asked")),
        recommendation: `Add FAQPage schema when article has Q&A content:
  {
    "@type": "FAQPage",
    mainEntity: faqs.map(faq => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer }
    }))
  }`,
      },
    ],
  },
  {
    template: "property-listing",
    file: "src/app/hyderabad/buy/[listingSlug]/page.tsx",
    checks: [
      {
        id: "listing-realestate-schema",
        severity: "high",
        description: "Property listings should use RealEstateListing or Residence schema with price",
        check: (c) =>
          !hasSchemaType(c, "RealEstateListing", "Residence", "Apartment", "House") &&
          !hasSchemaProperty(c, "offers"),
        recommendation: `Add structured data for property listings:
  {
    "@type": "RealEstateListing",
    name: property.title,
    url: listingAbsoluteUrl,
    offers: {
      "@type": "Offer",
      price: property.price,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock"
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: property.locality,
      addressRegion: "Telangana",
      addressCountry: "IN"
    }
  }`,
      },
    ],
  },
  {
    template: "developer-profile",
    file: "src/app/developers/[slug]/page.tsx",
    checks: [
      {
        id: "developer-organization-schema",
        severity: "high",
        description: "Developer profile pages should have Organization schema to appear in Knowledge Panel",
        check: (c) => !hasSchemaType(c, "Organization", "Corporation", "LocalBusiness"),
        recommendation: `Add Organization schema to developer profile:
  {
    "@type": "Organization",
    "@id": developerUrl + "#organization",
    name: developer.name,
    url: developerUrl,
    logo: developer.logo_url,
    description: developer.hero_description,
    foundingDate: developer.founding_year,
    numberOfEmployees: { "@type": "QuantitativeValue", value: developer.team_size },
    areaServed: "Hyderabad, Telangana, India"
  }`,
      },
      {
        id: "developer-aggregate-rating",
        severity: "medium",
        description: "Developer profiles with reviews should include AggregateRating for SERP star ratings",
        check: (c) => !hasSchemaType(c, "AggregateRating"),
        recommendation: `Add AggregateRating once you have review data:
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: developer.avg_rating,
    reviewCount: developer.review_count,
    bestRating: "5",
    worstRating: "1"
  }`,
      },
    ],
  },
  {
    template: "micro-market-faq",
    file: "src/app/[citySlug]/[microMarketSlug]/page.tsx",
    checks: [
      {
        id: "micromarket-faq",
        severity: "medium",
        description: "Micro-market pages with FAQ/insight sections should use FAQPage schema",
        check: (c) =>
          !hasSchemaType(c, "FAQPage") &&
          (c.includes("faq") || c.includes("FAQ") || c.includes("frequently")),
        recommendation: `Add FAQPage schema to micro-market pages with Q&A content:
  {
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is the average property price in " + microMarket.name + "?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Property prices in " + microMarket.name + " range from ₹X to ₹Y per sq ft..."
        }
      }
    ]
  }`,
      },
    ],
  },
  {
    template: "about-page",
    file: "src/app/about/page.tsx",
    checks: [
      {
        id: "about-local-business-schema",
        severity: "high",
        description: "About page should have LocalBusiness / RealEstateAgent schema with full address and hours",
        check: (c) => !hasSchemaType(c, "LocalBusiness", "RealEstateAgent"),
        recommendation: `Add LocalBusiness schema to about page:
  {
    "@type": "RealEstateAgent",
    name: "RE/MAX Westside Realty",
    address: {
      "@type": "PostalAddress",
      streetAddress: "Office address here",
      addressLocality: "Kokapet",
      addressRegion: "Telangana",
      postalCode: "500075",
      addressCountry: "IN"
    },
    geo: { "@type": "GeoCoordinates", latitude: 17.385, longitude: 78.327 },
    telephone: "+91-40-XXXX-XXXX",
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],
        opens: "09:00",
        closes: "19:00"
      }
    ]
  }`,
      },
    ],
  },
];

// ─── Main audit ───────────────────────────────────────────────────────────────

/**
 * Audit all template files for schema gaps.
 *
 * @returns {Array<SchemaGap>}
 */
export function runSchemaAudit() {
  const gaps = [];

  for (const templateRule of TEMPLATE_RULES) {
    const filePath = path.resolve(templateRule.file);

    if (!fs.existsSync(filePath)) {
      gaps.push({
        template: templateRule.template,
        file: templateRule.file,
        checkId: "file-missing",
        severity: "info",
        description: `Template file not found (may not exist yet): ${templateRule.file}`,
        recommendation: null,
      });
      continue;
    }

    const content = fs.readFileSync(filePath, "utf8");

    for (const rule of templateRule.checks) {
      try {
        if (rule.check(content)) {
          gaps.push({
            template: templateRule.template,
            file: templateRule.file,
            checkId: rule.id,
            severity: rule.severity,
            description: rule.description,
            recommendation: rule.recommendation,
          });
        }
      } catch (err) {
        console.error(`[schema-gaps] Check ${rule.id} threw:`, err.message);
      }
    }
  }

  const highCount = gaps.filter((g) => g.severity === "high").length;
  const mediumCount = gaps.filter((g) => g.severity === "medium").length;
  console.error(
    `[schema-gaps] Found ${gaps.length} gap(s): ${highCount} high, ${mediumCount} medium`
  );

  return gaps;
}
