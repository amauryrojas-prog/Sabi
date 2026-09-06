(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.SabiChinaCatalog = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  // CJ listV2 supports 50 products per page. Its native order is relevance / Best Match.
  const CHINA_CATALOG_PAGE_SIZE = 50;
  const CHINA_CATALOG_SORT_LABEL = 'Mejor coincidencia';

  return { CHINA_CATALOG_PAGE_SIZE, CHINA_CATALOG_SORT_LABEL };
});
