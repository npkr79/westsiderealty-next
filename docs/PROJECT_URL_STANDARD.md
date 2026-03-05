# Project URL Standard

This repository uses a single canonical pattern for project detail pages:

- `/{citySlug}/projects/{projectSlug}`

## Why this matters

- Prevents duplicate URL patterns for the same project
- Keeps SEO signals consolidated on canonical URLs
- Makes sitemap and JSON-LD consistent
- Reduces routing regressions during refactors

## Required helpers

Use helpers from `src/lib/routes.ts`:

- `buildProjectUrl(citySlug, projectSlug)` for relative links
- `buildProjectAbsoluteUrl(citySlug, projectSlug)` for canonical/metadata/schema/sitemap
- `buildProjectsIndexUrl(citySlug)` for city projects index pages

## Do and Don't

- Do: `buildProjectUrl(citySlug, projectSlug)`
- Do: `buildProjectAbsoluteUrl(citySlug, projectSlug)`
- Don't: string templates like `` `/${citySlug}/projects/${projectSlug}` ``
- Don't: absolute string templates like `` `https://www.westsiderealty.in/${citySlug}/projects/${projectSlug}` ``

## Enforcement

- ESLint blocks hardcoded project-detail template literals:
  - `eslint.config.mjs` -> `no-restricted-syntax` rule for project route templates
- If a new project URL use case appears, extend `src/lib/routes.ts` and use the helper everywhere.
