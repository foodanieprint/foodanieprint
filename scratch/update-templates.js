const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.template.findMany();
  console.log(`Found ${templates.length} templates.`);
  
  let updatedCount = 0;
  for (const tpl of templates) {
    if (!tpl.targetSpecs) continue;
    
    let specs = tpl.targetSpecs;
    if (typeof specs === 'string') {
      try {
        specs = JSON.parse(specs);
      } catch (e) {
        continue;
      }
    }
    
    let changed = false;
    for (const key of Object.keys(specs)) {
      if (specs[key] === '3.75x2.25') {
        specs[key] = '3.5x2';
        changed = true;
      }
    }
    
    if (changed) {
      await prisma.template.update({
        where: { id: tpl.id },
        data: { targetSpecs: specs }
      });
      console.log(`Updated template: ${tpl.name}`);
      updatedCount++;
    }
  }
  
  console.log(`Finished updating. Total templates updated: ${updatedCount}`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
