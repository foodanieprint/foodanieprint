const http = require('http');

console.log('Sending request to /api/products/business-cards...');
const req = http.get('http://localhost:3000/api/products/business-cards', (res) => {
  console.log(`STATUS CODE: ${res.statusCode}`);
  console.log('HEADERS:', JSON.stringify(res.headers, null, 2));

  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('BODY:', data);
    process.exit(0);
  });
});

req.on('error', (err) => {
  console.error('Fetch error:', err.message);
  process.exit(1);
});

// Timeout after 4 seconds
setTimeout(() => {
  console.error('Request timed out after 4s');
  process.exit(1);
}, 4000);
