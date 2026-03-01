export const SITE_URL = "https://www.westsiderealty.in";

const normalizeSegment = (value: string): string => value.trim().replace(/^\/+|\/+$/g, "");

export const buildProjectUrl = (citySlug: string, projectSlug: string): string => {
  const city = normalizeSegment(citySlug);
  const project = normalizeSegment(projectSlug);
  return `/${city}/projects/${project}`;
};

export const buildProjectsIndexUrl = (citySlug: string): string => {
  const city = normalizeSegment(citySlug);
  return `/${city}/projects`;
};

export const buildMicroMarketProjectsUrl = (citySlug: string, microMarketSlug: string): string => {
  const city = normalizeSegment(citySlug);
  const mm = normalizeSegment(microMarketSlug);
  return `/${city}/projects?microMarket=${encodeURIComponent(mm)}`;
};

export const buildProjectAbsoluteUrl = (citySlug: string, projectSlug: string): string =>
  `${SITE_URL}${buildProjectUrl(citySlug, projectSlug)}`;
