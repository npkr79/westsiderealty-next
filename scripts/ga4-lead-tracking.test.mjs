import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import test from 'node:test';
import ts from 'typescript';

function load(file, globals = {}, imports = {}) {
  const exports = {};
  const js = ts.transpileModule(readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(js, { exports, URL, Set, console: { log() {}, warn() {}, error() {} },
    require: name => { if (!(name in imports)) throw Error(`Unexpected import: ${name}`); return imports[name]; }, ...globals });
  return exports;
}
const input = { name: 'Private Name', phone: '9999999999', email: 'private@example.com', type: 'GENERAL_CONTACT', source_page: '/contact?email=private@example.com#9999999999', details: { message: 'private message', lead_id: 'private-id' } };
const ok = { success: true, analyticsReceipt: 'test-receipt' };
function tracker(window = { gtag: (...args) => window.calls.push(args), calls: [] }) {
  return { window, ...load('src/lib/analytics/leadTracking.ts', { window }) };
}
test('confirmed success emits once, only after asynchronous save', async () => {
  const t = tracker(); let resolve;
  const save = new Promise(r => { resolve = r; });
  const pending = t.withLeadTracking(() => save, input, 'contact');
  assert.equal(t.window.calls.length, 0);
  resolve(ok); assert.equal(await pending, ok);
  assert.equal(t.window.calls.length, 1);
  assert.equal(t.window.calls[0][1], 'generate_lead');
  assert.equal(t.window.calls[0][2].send_to, 'G-GYG41B6D00');
});
test('failed or unconfirmed saves never emit', async () => {
  const t = tracker();
  for (const response of [{ success: false }, { success: false, analyticsReceipt: 'x' }, { success: true }]) {
    await t.withLeadTracking(async () => response, input, 'contact');
  }
  await assert.rejects(t.withLeadTracking(async () => { throw Error('save failed'); }, input, 'contact'));
  assert.equal(t.window.calls.length, 0);
});
test('repeated callbacks/click responses for one receipt emit once; distinct saves emit separately', async () => {
  const t = tracker();
  await Promise.all([1, 2, 3].map(() => t.withLeadTracking(async () => ({ ...ok }), input, 'contact')));
  assert.equal(t.window.calls.length, 1);
  t.trackSuccessfulLead({ ...ok, analyticsReceipt: 'second-lead' }, input, 'contact');
  assert.equal(t.window.calls.length, 2);
});
test('analytics exceptions cannot alter CRM success', async () => {
  const t = tracker({ gtag() { throw Error('blocked'); } });
  assert.equal(await t.withLeadTracking(async () => ok, input, 'contact'), ok);
});
test('early events enter the standard gtag queue without another initialization', () => {
  const t = tracker({}); t.trackSuccessfulLead(ok, input, 'contact');
  assert.equal(t.window.dataLayer.length, 1);
  assert.equal(t.window.dataLayer[0][0], 'event');
  assert.equal(t.window.dataLayer[0][1], 'generate_lead');
});
test('blocked queue is noncritical', async () => {
  const window = {}; Object.defineProperty(window, 'dataLayer', { get() { throw Error('blocked'); } });
  const t = tracker(window); assert.equal(await t.withLeadTracking(async () => ok, input, 'contact'), ok);
});
test('commercial routes and explicit intent distinguish investment, sale, lease', () => {
  const t = tracker();
  for (const [source_page, type] of [['/commercial-investments','investment'], ['/commercial/pre-leased-mumbai','investment'], ['/commercial/hyderabad/office-space-for-sale','office_sale'], ['/commercial/hyderabad/office-space-for-lease','office_lease'], ['/commercial/hyderabad/office-space-for-lease/gachibowli-financial-district','office_lease'], ['/commercial/hyderabad/managed-office-space','office_lease']]) {
    const p = t.leadParameters({ ...input, source_page }, 'commercial');
    assert.equal(p.lead_category, 'commercial'); assert.equal(p.lead_type, type);
  }
  assert.equal(t.leadParameters({ ...input, source_page: '/commercial/hyderabad', details: { intent: 'office_purchase' } }, 'hub').lead_type, 'office_sale');
});
test('residential project route retains slug/city; description does not classify commercial', () => {
  const p = tracker().leadParameters({ ...input, type: 'PROJECT_INTEREST', source_page: '/hyderabad/projects/example-project', details: { description: 'next to commercial offices' } }, 'project_lead_form');
  assert.equal(p.lead_category, 'residential'); assert.equal(p.project_slug, 'example-project'); assert.equal(p.city, 'hyderabad');
});
test('Godrej Neopolis attribution is preserved', () => {
  const p = tracker().leadParameters({ ...input, type: 'PROJECT_INTEREST', source_page: '/hyderabad/projects/godrej-neopolis', attribution_metadata: { project_slug: 'godrej-neopolis', city: 'hyderabad', micro_market: 'Neopolis / Kokapet', cta_intent: 'eoi' } }, 'godrej_neopolis_client');
  assert.equal(p.project_slug, 'godrej-neopolis'); assert.equal(p.city, 'hyderabad'); assert.equal(p.locality, 'neopolis_kokapet'); assert.equal(p.cta_intent, 'eoi'); assert.equal(p.lead_category, 'residential');
});
test('unknown enquiry remains general and payload excludes PII/receipt/query/hash', () => {
  const t = tracker(); t.trackSuccessfulLead(ok, input, 'contact'); const json = JSON.stringify(t.window.calls);
  for (const value of ['Private Name','9999999999','private@example.com','private message','private-id','test-receipt','?','#']) assert.ok(!json.includes(value), value);
  assert.equal(t.window.calls[0][2].lead_category, 'general');
});
test('brochure tokens and external or unsafe source paths are omitted', () => {
  const t = tracker();
  assert.equal(t.safeSourcePage('/brochure/private-token'), '/brochure');
  for (const value of ['https://example.com/private', '/contact/private@example.com', '/contact/9999999999']) assert.equal(t.safeSourcePage(value), '/');
});
function server(inserted, insertError = null) {
  let payload;
  const chain = { select() { return this; }, ilike() { return this; }, limit() { return this; }, maybeSingle: async () => ({ data: { id: 'source' } }), insert(p) { payload = p; return this; }, single: async () => ({ data: inserted, error: insertError }) };
  const imports = {
    '@/lib/supabase/serviceClient': { createServiceClient: () => ({ from: () => chain }) },
    '@/services/crmLeadRoutingService': { routeLeadByOwnership: async () => {} },
    '@/lib/crm/leadAttribution': { extractLeadAttribution: () => ({ attribution_metadata: {} }) },
    '@/services/behaviorLeadMappingService': { mapBehaviorToLead: async () => {} },
    '@/lib/crm/budget': { toBudgetNumber: () => null },
    '@/services/whatsappAutomationService': { onNewLeadAutomation: async () => {} },
    '@/lib/crm/whatsappAlert': { sendLeadAlertWhatsApp: async () => {} },
  };
  return { ...load('src/app/actions/submit-lead.ts', { process: { env: {} }, crypto: { randomUUID: () => 'random-ack' } }, imports), payload: () => payload };
}
test('real server action acknowledges only confirmed insert, without exposing CRM ID', async () => {
  const s = server({ id: 'CRM-private-id' }); const r = await s.submitLead(input);
  assert.equal(r.success, true); assert.equal(r.analyticsReceipt, 'random-ack'); assert.ok(!JSON.stringify(r).includes('CRM-private-id'));
  assert.equal(s.payload().name, input.name); assert.equal(s.payload().phone, input.phone);
  assert.ok(!('analyticsReceipt' in s.payload()));
});
test('server insert error or missing inserted row cannot create an analytics receipt', async () => {
  for (const [row, error] of [[null, { message: 'failed' }], [null, null]]) {
    const r = await server(row, error).submitLead(input); assert.equal(r.analyticsReceipt, undefined);
  }
});
test('all direct client submitLead call sites use the tracking wrapper with form IDs', () => {
  let count = 0;
  function scan(dir) { for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name); if (entry.isDirectory()) { scan(file); continue; }
    if (!file.endsWith('.tsx')) continue;
    const source = readFileSync(file, 'utf8'); assert.ok(!source.includes('from "@/app/actions/submit-lead"'), file);
    const ast = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    function visit(n) { if (ts.isCallExpression(n) && n.expression.getText(ast) === 'submitLead') { count++; assert.equal(n.arguments.length, 2, file); assert.ok(ts.isStringLiteral(n.arguments[1]), file); } ts.forEachChild(n, visit); } visit(ast);
  } } scan('src/app'); scan('src/components'); assert.ok(count >= 27, String(count));
});
test('commercial project metadata overrides residential lead type without reading descriptions', () => {
  const t = tracker();
  const p = t.leadParameters({ ...input, type: 'PROJECT_INTEREST', property_type: 'Commercial', source_page: '/hyderabad/projects/office-project' }, 'project_lead_form');
  assert.equal(p.lead_category, 'commercial');
  assert.equal(t.leadParameters({ ...input, details: { message: 'commercial investment' } }, 'contact').lead_category, 'general');
});
test('client adapters preserve action arguments/results and track campaign and advisor receipts', async () => {
  const t = tracker(); const calls = [];
  const save = async data => { calls.push(data); return { ...ok, analyticsReceipt: String(calls.length) }; };
  const adapters = load('src/lib/analytics/submitTrackedLead.ts', {}, {
    '@/app/actions/submit-lead': { submitLead: save },
    '@/app/actions/campaignLeads': { submitGodrejLead: save },
    '@/app/actions/submit-advisor-lead': { submitAdvisorLead: save },
    './leadTracking': t,
  });
  await adapters.submitLead(input, 'contact'); assert.equal(calls[0], input);
  const form = new FormData(); form.set('source_page', '/contact?email=private@example.com');
  await adapters.submitGodrejLead(form); assert.equal(calls[1], form);
  assert.equal(t.window.calls[1][2].project_slug, 'godrej-regal-pavilion');
  await adapters.submitAdvisorLead(input); assert.equal(calls[2], input);
  assert.equal(t.window.calls[2][2].form_id, 'advisor_capture');
  assert.equal(t.window.calls.length, 3);
});
test('residential CTA intent is allowlisted; free text is excluded', () => {
  const t = tracker();
  assert.equal(t.leadParameters({ ...input, details: { buyerIntent: 'End-use home purchase' } }, 'project').cta_intent, 'end_use');
  assert.equal(t.leadParameters({ ...input, details: { buyerIntent: 'Call Private Name at 9999999999' } }, 'project').cta_intent, undefined);
});
