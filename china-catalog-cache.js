(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.SabiChinaCatalog = api;
  root.SabiChinaCatalogCache = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SUPABASE_URL = 'https://bfbqiocegzjqbogvjlux.supabase.co';
  const CACHE_ENDPOINT = `${SUPABASE_URL}/functions/v1/china-catalog-cache`;
  const PAGE_SIZE = 50;
  const SOURCE_LABEL = 'Mejor coincidencia';
  const SOURCE_NOTE = 'Catálogo cacheado · 50 productos';

  function getAnonKey() {
    return (typeof window !== 'undefined' && window.SUPABASE_ANON_KEY)
      || 'sb_publishable_EIvJY4hLqsnZbgC-AVs76Q_yey2GIAE';
  }

  async function callCache(action, params) {
    const res = await fetch(CACHE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getAnonKey()}`,
      },
      body: JSON.stringify({ action, ...(params || {}) }),
    });
    if (!res.ok) {
      let detail = '';
      try { detail = await res.text(); } catch (e) { /* ignore */ }
      throw new Error(`china-catalog-cache ${res.status}: ${detail.slice(0, 220)}`);
    }
    return res.json();
  }

  async function fetchCategory(categoryId) {
    return callCache('fetch', { categoryId });
  }

  return {
    PAGE_SIZE,
    SOURCE_LABEL,
    SOURCE_NOTE,
    CACHE_ENDPOINT,
    fetchCategory,
    callCache,
  };
});
