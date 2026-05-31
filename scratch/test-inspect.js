const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  const templates = await prisma.template.findMany();
  templates.forEach(t => {
    console.log("Template:", t.id, t.name, "productId:", t.productId);
    console.log("targetSpecs:", JSON.stringify(t.targetSpecs));
  });
  const products = await prisma.product.findMany();
  products.forEach(p => {
    console.log("Product:", p.id, p.name, p.slug);
  });
}
main();
