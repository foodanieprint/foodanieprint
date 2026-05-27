const { mockDb } = require('../src/lib/mockData.ts');

const product = mockDb.getProductBySlug('business-cards');
const globalOptions = mockDb.getGlobalOptions();

console.log('Product CategoryId:', product.categoryId);
console.log('Global Options length:', globalOptions.length);

const catOptions = globalOptions.filter((o) => {
  if (o.categoryId === product.categoryId) return true;
  if (o.categoryIds) {
    const ids = Array.isArray(o.categoryIds)
      ? o.categoryIds
      : typeof o.categoryIds === 'string'
        ? JSON.parse(o.categoryIds)
        : [];
    return ids.includes(product.categoryId);
  }
  return false;
});

console.log('catOptions names:', catOptions.map(o => o.name));
