const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Querying database for product with slug: business-cards...');
  try {
    const product = await prisma.product.findUnique({
      where: { slug: 'business-cards' },
      include: { specs: true }
    });
    console.log('Result:', JSON.stringify(product, null, 2));
  } catch (error) {
    console.error('Error occurred:', error.message || error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
