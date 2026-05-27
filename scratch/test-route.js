const { mockDb } = require('../src/lib/mockData');
const { PrismaClient } = require('@prisma/client');
const prismaDb = new PrismaClient();

async function testRoute() {
  const slug = 'business-cards';
  let product = null;
  let globalOptions = [];

  console.log('--- Tracing GET route logic for slug:', slug);

  // 1. Relational DB query
  try {
    console.log('Attempting Prisma product.findUnique...');
    product = await prismaDb.product.findUnique({
      where: { slug },
      include: {
        specs: true,
      },
    });
    console.log('Prisma succeeded. Product found:', !!product);
  } catch (error) {
    console.warn(`PostgreSQL offline. Cargando producto slug "${slug}" desde mock local...`, error.message || error);
  }

  // 2. Fallback
  if (!product) {
    console.log('Product is null. Executing fallback logic...');
    const rawMock = mockDb.getProductBySlug(slug);
    console.log('mockDb.getProductBySlug returned:', rawMock ? JSON.stringify(rawMock, null, 2) : 'null');
    if (rawMock) {
      product = JSON.parse(JSON.stringify(rawMock));
    }
    globalOptions = mockDb.getGlobalOptions();
    console.log('Loaded globalOptions from mock:', globalOptions.length);
  }

  console.log('Final product object:', product ? 'Found' : 'Null');
  
  await prismaDb.$disconnect();
}

testRoute();
