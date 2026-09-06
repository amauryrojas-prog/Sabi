const assert = require('node:assert/strict');
const test = require('node:test');
const { roundChinaRetailPrice } = require('../china-pricing.js');

test('roundChinaRetailPrice rounds up to the next Sabí .99 retail step', () => {
  assert.equal(roundChinaRetailPrice(7.13), 9.99);
  assert.equal(roundChinaRetailPrice(21.17), 24.99);
  assert.equal(roundChinaRetailPrice(36.45), 39.99);
});

test('roundChinaRetailPrice keeps an existing Sabí .99 retail price', () => {
  assert.equal(roundChinaRetailPrice(9.99), 9.99);
  assert.equal(roundChinaRetailPrice(24.99), 24.99);
});
