import assert from 'node:assert/strict';
const origin = process.env.AUDIT_BASE_URL || 'http://localhost:3100';
const canonicalOrigin = 'https://www.westsiderealty.in';
const base = '/commercial/hyderabad/office-space-for-lease';
const leasing = [base, `${base}/hitec-city-madhapur`, `${base}/gachibowli-financial-district`];
const routes = [...leasing, '/commercial', '/commercial/hyderabad', '/commercial/hyderabad/managed-office-space', '/commercial/hyderabad/office-space-for-sale', '/', '/hyderabad/projects/godrej-neopolis'];
const sitemapResponse = await fetch(`${origin}/sitemap.xml`);
assert.equal(sitemapResponse.status, 200);
const sitemap = await sitemapResponse.text();
const results = [];
const anchors = new Set();
for (const route of routes) {
  const response = await fetch(origin + route, { redirect: 'manual' });
  assert.equal(response.status, 200, route);
  const html = await response.text();
  const values = pattern => [...html.matchAll(pattern)].map(m => m[1]);
  const title = values(/<title>(.*?)<\/title>/g);
  const h1 = values(/<h1[^>]*>(.*?)<\/h1>/g);
  const canonical = values(/<link rel="canonical" href="([^"]+)"/g);
  const description = values(/<meta name="description" content="([^"]+)"/g);
  const robots = values(/<meta name="robots" content="([^"]+)"/g);
  const schemas = values(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g).map(JSON.parse);
  if (leasing.includes(route)) {
    assert.equal(title.length, 1, route); assert.equal(description.length, 1, route); assert.equal(h1.length, 1, route);
    assert.deepEqual(canonical, [canonicalOrigin + route]);
    assert.ok(robots.some(v => v.includes('index') && !v.includes('noindex')));
    assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'));
    assert.ok(sitemap.includes(`${canonicalOrigin + route}</loc>`), route);
    assert.equal(values(/id="(office-requirement)"/g).length, 1);
    assert.ok(html.includes('10,000+ sq ft'));
    assert.ok(html.includes('Discuss Your Leasing Requirement'));
    assert.ok(schemas.length >= 2);
    assert.ok(!JSON.stringify(schemas).includes('AggregateRating'));
  }
  for (const href of values(/href="([^"]+)"/g)) {
    if (href.startsWith('#') && href.length > 1) assert.ok(html.includes(`id="${href.slice(1)}"`), `${route}: broken ${href}`);
    if (href.startsWith('/commercial') && !href.includes('?')) anchors.add(href.split('#')[0]);
  }
  results.push({route,status:response.status,title,description,h1,canonical,robots,schemaCount:schemas.length});
}
for (const route of anchors) {
  const r = await fetch(origin + route, { redirect: 'manual' });
  assert.equal(r.status, 200, `commercial link ${route}`);
}
console.log(JSON.stringify({origin,results,commercialLinksChecked:[...anchors]},null,2));
