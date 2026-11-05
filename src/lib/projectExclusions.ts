/** Permanent, verified identity. Database triggers enforce this across imports. */
export const INDUS_AMALFI_EXCLUSION = {
  id: "48bcf1c3-589f-4a8d-92e3-b46de46252a1",
  reraId: "PRGO03262676",
  slug: "indus-amalfi-suites",
  citySlug: "goa",
} as const;

export function isExcludedProjectPath(pathname: string): boolean {
  const parts = pathname.replace(/\/$/, "").split("/");
  return parts.length === 4 && parts[2] === "projects" &&
    parts[3].toLowerCase() === INDUS_AMALFI_EXCLUSION.slug;
}
