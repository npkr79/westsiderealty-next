# Indus Amalfi Suites permanent removal

Verified identity: Goa / Anjuna, RERA `PRGO03262676`, slug `indus-amalfi-suites`, advisory UUID `48bcf1c3-589f-4a8d-92e3-b46de46252a1`.

On 2026-11-05 the single matching `advisor_project_intelligence` row was backed up and explicitly deleted using ID, RERA, slug and name predicates. Its only foreign-key dependents were `advisor_project_configurations` and `advisor_project_sources`; both had zero matching rows. No cascading child deletion occurred. All 550 other advisory rows were compared before/after and were unchanged. One matching historical CRM lead was compared in full and was unchanged. Backups containing private CRM data are retained locally outside Git.

The SQL migration registers the identity in `project_import_exclusions`. BEFORE INSERT/UPDATE triggers reject matching IDs, RERA numbers or exact slugs on the advisory, RERA and alternate inventory tables, including dependent advisory display tables. This covers PostgREST manual imports, bulk upserts, scheduled imports and regeneration regardless of which caller writes the rows. Imports must handle SQLSTATE `23514` as an excluded project; a transaction including that project will fail rather than silently republish it. The application service role can read, but cannot alter, the exclusion registry. A database owner could explicitly remove these protections; ordinary imports cannot.

The checked-in enrichment worker updates existing project data; it does not provide a separate exclusion bypass. No standalone RERA importer is present in this website repository. The database boundary therefore enforces exclusion for external import processes too.

Middleware returns HTTP 410 with `X-Robots-Tag: noindex, nofollow` for the retired project URL. Similar project slugs remain unaffected. The deleted row no longer feeds advisory details, market recommendations, portfolios, search, static params or either advisory sitemap query. Stored micro-market and advisory caches had zero matching references.

Validation commands:

```sh
node --import tsx scripts/test-project-exclusions.ts
node --env-file=.env.local scripts/test-project-import-exclusion.mjs
npm run build
```

The integration test deliberately attempts rejected writes and requires the migration to be installed first. It verifies insert, upsert, a renamed slug with the same RERA, a new ID with the original slug, and both RERA and main-project import paths. Local production HTTP verification returned 410. Production build passed. Targeted lint passed for new TypeScript files; middleware has a pre-existing `no-explicit-any` violation unrelated to this change.
