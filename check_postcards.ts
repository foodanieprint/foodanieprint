import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const postcards = await prisma.product.findFirst({
    where: {
      name: {
        contains: 'Postcard',
        mode: 'insensitive'
      }
    },
    include: { specs: true }
  });
  console.log('POSTCARD PRODUCT DETAILS:');
  console.log(JSON.stringify(postcards, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
