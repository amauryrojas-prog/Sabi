(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.SabiChinaPricing = api;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  const RETAIL_STEP_AWG = 5;
  const RETAIL_ENDING_OFFSET_AWG = 0.01;

  /**
   * Rounds a calculated China-import price up to Sabí's public retail ladder:
   * 7.13 → 9.99, 21.17 → 24.99, 36.45 → 39.99.
   */
  function roundChinaRetailPrice(rawPriceAwg) {
    const raw = Number(rawPriceAwg);
    if (!Number.isFinite(raw) || raw <= 0) return 0;

    const nextRetailStep = Math.ceil((raw + RETAIL_ENDING_OFFSET_AWG) / RETAIL_STEP_AWG) * RETAIL_STEP_AWG;
    return Number((nextRetailStep - RETAIL_ENDING_OFFSET_AWG).toFixed(2));
  }

  return { roundChinaRetailPrice };
});
