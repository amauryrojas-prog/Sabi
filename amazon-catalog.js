(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.SabiAmazonCatalog = api;
  root.SabiAmazonCatalogCache = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const SUPABASE_URL = 'https://bfbqiocegzjqbogvjlux.supabase.co';
  const CACHE_ENDPOINT = `${SUPABASE_URL}/functions/v1/amazon-pa-api`;
  const PAGE_SIZE = 50;
  const SOURCE_LABEL = 'Mejor valorados';
  const SOURCE_NOTE = 'Catálogo Amazon · 50 productos';

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
      throw new Error(`amazon-pa-api ${res.status}: ${detail.slice(0, 220)}`);
    }
    return res.json();
  }

  async function fetchCategory(categoryId) {
    return callCache('fetch', { categoryId });
  }

  // Convert a number of categories of Amazon payload into the same shape the
  // China cache already exposes, so renderSabiImportShop can be category-agnostic.
  function normalizeForUi(item) {
    return {
      productId: item.asin || item.productId,
      title: item.title || item.nameEn || item.productName,
      description: '',
      image: item.image || 'placeholder.png',
      priceUSD: typeof item.priceUsd === 'number' ? item.priceUsd : null,
      rating: typeof item.rating === 'number' ? item.rating : null,
      reviewCount: typeof item.reviewCount === 'number' ? item.reviewCount : null,
      isPrime: !!item.isPrime,
      isAmazonChoice: !!item.isAmazonChoice,
      shipsToAruba: !!item.shipsToAruba,
      affiliateUrl: item.affiliateUrl || item.detailPageUrl,
      sabiRank: item.sabiRank,
    };
  }

  return {
    PAGE_SIZE,
    SOURCE_LABEL,
    SOURCE_NOTE,
    CACHE_ENDPOINT,
    CATEGORY_IDS: [
      'electronics',
      'home_kitchen',
      'beauty',
      'baby',
      'sports_outdoors',
      'tools',
      'automotive',
      'toys',
      'computers',
      'fashion',
      'pet_supplies',
      'health',
    ],
    CATEGORY_LABELS: {
      electronics: 'Tecnología',
      home_kitchen: 'Hogar & Cocina',
      beauty: 'Belleza',
      baby: 'Bebés',
      sports_outdoors: 'Deporte & Playa',
      tools: 'Herramientas',
      automotive: 'Automotriz',
      toys: 'Juguetes',
      computers: 'Computación',
      fashion: 'Moda',
      pet_supplies: 'Mascotas',
      health: 'Salud',
    },
    fetchCategory,
    callCache,
    normalizeForUi,
  };
});
