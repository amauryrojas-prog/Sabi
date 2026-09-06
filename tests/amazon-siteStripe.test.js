const assert = require('node:assert/strict');
const test = require('node:test');
const { extractAsinAndTagFromSiteStripe } = require('../amazon-add-product.js');

test('SiteStripe text link -> ASIN + tag', () => {
  const url = 'https://www.amazon.com/Apple-AirTag/dp/B0BN72Y2QF?tag=sabafiliados-20&linkCode=ogi&th=1&psc=1';
  const out = extractAsinAndTagFromSiteStripe(url);
  assert.equal(out.asin, 'B0BN72Y2QF');
  assert.equal(out.tag, 'sabafiliados-20');
  assert.equal(out.kind, 'product');
});

test('SiteStripe image link -> ASIN + tag', () => {
  const url = 'https://www.amazon.com/dp/B0BN72Y2QF?tag=sabafiliados-20&linkCode=ogi&th=1';
  const out = extractAsinAndTagFromSiteStripe(url);
  assert.equal(out.asin, 'B0BN72Y2QF');
  assert.equal(out.tag, 'sabafiliados-20');
});

test('URL without ASIN -> null', () => {
  const out = extractAsinAndTagFromSiteStripe('https://amazon.com/some/non-asin/page');
  assert.equal(out, null);
});

test('URL without our tag -> null (safety)', () => {
  const out = extractAsinAndTagFromSiteStripe('https://amazon.com/dp/B0BN72Y2QF?tag=somebodyelse-20');
  assert.equal(out, null);
});
