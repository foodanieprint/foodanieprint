const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    const templates = await prisma.template.findMany({
      include: {
        product: {
          select: {
            name: true,
            slug: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    console.log("Success! Found:", templates.length);
  } catch (error) {
    console.error("Prisma error fetching templates:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
