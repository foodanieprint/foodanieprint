const http = require('http');

console.log('Fetching all products from /api/products...');
const req = http.get('http://localhost:3000/api/products', (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const products = JSON.parse(data);
      console.log('Status Code:', res.statusCode);
      console.log('Total Products:', products.length);
      console.log('Products:', JSON.stringify(products.map(p => ({ id: p.id, name: p.name, slug: p.slug })), null, 2));
    } catch (e) {
      console.error('Failed to parse JSON:', e.message);
      console.log('Raw response:', data);
    }
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Fetch error:', err.message);
  process.exit(1);
});
