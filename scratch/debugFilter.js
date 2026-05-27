async function main() {
  const prodRes = await fetch('http://localhost:3000/api/products/business-cards');
  const product = await prodRes.json();
  
  console.log('--- Server returned specs ---');
  console.log(product.specs.map(s => `${s.group}: ${s.value}`));
  
  const optsRes = await fetch('http://localhost:3000/api/options');
  const globalOptions = await optsRes.json();
  
  console.log('--- Run local replication of inheritance ---');
  let specs = []; // start empty like raw product.specs
  
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

  console.log('Matched catOptions:', catOptions.map(o => o.name));
  
  catOptions.forEach((globalOpt) => {
    if (Array.isArray(globalOpt.attributes)) {
      globalOpt.attributes.forEach((attr, idx) => {
        const exists = specs.some(s => s.group === globalOpt.name && s.value === attr.value);
        if (!exists) {
          specs.push({
            id: attr.id,
            productId: product.id,
            group: globalOpt.name,
            value: attr.value,
            priceMarkup: attr.priceMarkup
          });
        }
      });
    } else {
      console.log(`Option ${globalOpt.name} attributes is not an array!`, typeof globalOpt.attributes);
    }
  });

  console.log('Replicated inherited specs:', specs.map(s => `${s.group}: ${s.value}`));
}

main().catch(console.error);
