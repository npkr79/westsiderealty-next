// Integration regression: exercises the same PostgREST writes used by import jobs.
// Run only after applying 20261105_exclude_indus_amalfi_suites.sql.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const identity = { id: '48bcf1c3-589f-4a8d-92e3-b46de46252a1', project_name: 'Indus Amalfi Suites', project_slug: 'indus-amalfi-suites', rera_id: 'PRGO03262676', city_slug: 'goa', city: 'goa' };
const {data: exclusion, error} = await db.from('project_import_exclusions').select('rera_id').eq('rera_id', identity.rera_id).single();
assert.equal(error, null); assert.ok(exclusion);
const attempts = [
  ['advisor_project_intelligence', 'insert', identity],
  ['advisor_project_intelligence', 'upsert', identity],
  ['advisor_project_intelligence', 'insert', {...identity, id: crypto.randomUUID(), project_slug: 'regression-renamed-amalfi'}],
  ['advisor_project_intelligence', 'insert', {...identity, id: crypto.randomUUID(), rera_id: null}],
  ['rera_projects', 'upsert', { project_name: identity.project_name, rera_id: identity.rera_id, city_slug: 'goa' }],
  ['projects', 'insert', { project_name: identity.project_name, rera_id: identity.rera_id, url_slug: identity.project_slug }],
];
for (const [table, operation, row] of attempts) {
  const {error} = await db.from(table)[operation](row);
  assert.equal(error?.code, '23514', `${table} ${operation} must be rejected by the exclusion trigger: ${JSON.stringify(error)}`);
  assert.match(error.message, /permanently excluded/);
}
console.log(`${attempts.length} import/republish attempts correctly rejected`);
