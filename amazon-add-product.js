// Helper to expand a SiteStripe-affiliated URL into ASIN + tag + canonical URL.
// SiteStripe produces three link kinds: text, image, and both. They all follow
// the pattern /dp/{ASIN} or /gp/product/{ASIN} with ?tag=sabafiliados-20&linkCode=ogi&th=1.
//
// Canonicalization strategy:
//   - input: any Amazon URL
//   - extract: ASIN (10 alphanumeric chars starting with B)
//   - rebuild: /dp/{ASIN}?tag={tag}&linkCode=ogi&th=1

(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.SabiAmazonSiteStripe = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SABI_TAG = 'sabafiliados-20';
  const ASIN_RE = /\/([A-Z0-9]{10})(?:\/|\?|$)/i;
  const TAG_RE = /[?&]tag=([a-zA-Z0-9-]{2,30})/;

  function extractAsinAndTagFromSiteStripe(url, allowedTag = SABI_TAG) {
    let u;
    try {
      u = new URL(url);
    } catch {
      return null;
    }
    if (!/amazon\.com/i.test(u.hostname)) return null;
    const pathMatch = u.pathname.match(ASIN_RE);
    let asin = pathMatch ? pathMatch[1].toUpperCase() : null;
    if (!asin) {
      const gp = u.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (gp) asin = gp[1].toUpperCase();
    }
    if (!asin) return null;
    const tagMatch = u.search.match(TAG_RE);
    const tag = tagMatch ? tagMatch[1] : null;
    if (!tag) return null;
    if (allowedTag && tag !== allowedTag) return null; // refuse foreign tags
    return { asin, tag, kind: 'product' };
  }

  function canonicalize(url) {
    const parsed = extractAsinAndTagFromSiteStripe(url);
    if (!parsed) return null;
    return `https://www.amazon.com/dp/${parsed.asin}?tag=${parsed.tag}&linkCode=ogi&th=1`;
  }

  function tagOk(url) {
    const m = extractAsinAndTagFromSiteStripe(url);
    return !!m && m.tag === SABI_TAG;
  }

  return {
    SABI_TAG,
    extractAsinAndTagFromSiteStripe,
    canonicalize,
    tagOk,
  };
});
