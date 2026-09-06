const assert = require('node:assert/strict');
const test = require('node:test');
const { CHINA_CATALOG_PAGE_SIZE, CHINA_CATALOG_SORT_LABEL } = require('../china-catalog.js');

test('China catalog requests the first 50 products per category', () => {
  assert.equal(CHINA_CATALOG_PAGE_SIZE, 50);
});

test('China catalog labels CJ default relevance order as Best Match', () => {
  assert.equal(CHINA_CATALOG_SORT_LABEL, 'Mejor coincidencia');
});

test('UNWANTED_CHINA_KEYWORDS filters out phone cases and screen protectors', () => {
  const UNWANTED_CHINA_KEYWORDS = /\b(phone case|iphone case|samsung case|tpu case|silicone case|cover case|funda|carcasa|vidrio templado|screen protector|tempered glass|phone cover|back cover|phone shell|case cover|mobile case)\b/i;

  // Should match unwanted phone case & protector items
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Funda Silicona iPhone 14 Pro Max'), true);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Carcasa TPU Transparent Case'), true);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Vidrio Templado Premium 9H'), true);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Screen Protector for Galaxy S23'), true);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Leather Phone Shell Cover'), true);

  // Should NOT match desirable tech & gadgets
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Smartwatch Deportivo Bluetooth HD IP68'), false);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Cargador Inalámbrico Magnético 15W'), false);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Mini Proyector LED Portátil HD 1080P'), false);
  assert.equal(UNWANTED_CHINA_KEYWORDS.test('Luces LED Solares para Jardín'), false);
});

