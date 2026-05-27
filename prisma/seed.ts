import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Clear existing database tables
  await prisma.orderItem.deleteMany({});
  await prisma.order.deleteMany({});
  await prisma.customDesign.deleteMany({});
  await prisma.productSpec.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.user.deleteMany({});
  
  try {
    await (prisma as any).globalAttribute.deleteMany({});
    await (prisma as any).globalOption.deleteMany({});
    await (prisma as any).category.deleteMany({});
  } catch (err) {
    console.log('Skipping delete categories/options/attributes if tables not active.');
  }

  console.log('🧹 Database tables cleared.');

  // 2. Create Users (Administrator and Test Customer)
  const adminPassword = await bcrypt.hash('admin123', 10);
  const customerPassword = await bcrypt.hash('cliente123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@printear.com',
      name: 'Printear Administrator',
      password: adminPassword,
      role: Role.ADMIN,
    },
  });

  const customer = await prisma.user.create({
    data: {
      email: 'cliente@printear.com',
      name: 'Charles Printings',
      password: customerPassword,
      role: Role.CUSTOMER,
    },
  });

  console.log(`👤 Seeded Users: Admin (${admin.email}) and Customer (${customer.email})`);

  // 2b. Create Categories
  const cardsCategory = await (prisma as any).category.create({
    data: {
      name: 'Business Cards',
      slug: 'business-cards',
      description: 'Premium custom business cards and corporate stationery.',
    }
  });

  const tshirtsCategory = await (prisma as any).category.create({
    data: {
      name: 'T-Shirts',
      slug: 'custom-tshirts',
      description: 'Custom team & corporate printed apparel.',
    }
  });

  const mugsCategory = await (prisma as any).category.create({
    data: {
      name: 'Mugs',
      slug: 'gradient-mugs',
      description: 'Custom printed ceramic mugs.',
    }
  });

  const flyersCategory = await (prisma as any).category.create({
    data: {
      name: 'Flyers',
      slug: 'promotional-flyers',
      description: 'High-impact promotional and marketing flyers.',
    }
  });

  console.log('📁 Seeded Categories: Business Cards, T-Shirts, Mugs, Flyers');

  // 2c. Create Global Options & Attributes linked to their corresponding Categories
  await (prisma as any).globalOption.create({
    data: {
      name: 'Size',
      description: 'Physical dimensions for e-commerce printing blueprints.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id, tshirtsCategory.id, flyersCategory.id],
      attributes: {
        create: [
          { value: '3.5x2', metric: 'in', horizontal: 3.5, vertical: 2, priceMarkup: 0.0 },
          { value: '2X3.5', metric: 'in', horizontal: 2, vertical: 3.5, priceMarkup: 0.0 },
          { value: 'S', metric: 'none', horizontal: 0, vertical: 0, priceMarkup: 0.0 },
          { value: 'M', metric: 'none', horizontal: 0, vertical: 0, priceMarkup: 0.0 },
          { value: 'L', metric: 'none', horizontal: 0, vertical: 0, priceMarkup: 0.0 },
          { value: 'Half Page', metric: 'in', horizontal: 5.5, vertical: 8.5, priceMarkup: 0.0 },
          { value: 'Full Page', metric: 'in', horizontal: 8.5, vertical: 11, priceMarkup: 6.0 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Orientation',
      description: 'Canvas print orientation (Horizontal or Vertical).',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id],
      attributes: {
        create: [
          { value: 'Horizontal', metric: 'direction', priceMarkup: 0.0 },
          { value: 'Vertical', metric: 'direction', priceMarkup: 0.0 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Paper',
      description: 'Density and fiber texture of the paper materials.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id, flyersCategory.id],
      attributes: {
        create: [
          { value: '14 pt. Gloss', metric: 'pts', priceMarkup: 0.0 },
          { value: '16 pt. Premium Matte', metric: 'pts', priceMarkup: 3.50 },
          { value: 'Satin Paper 150g', metric: 'gsm', priceMarkup: 0.0 },
          { value: 'Premium Cardstock 250g', metric: 'gsm', priceMarkup: 5.0 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Color',
      description: 'Ink colors and sides printing configuration.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id, tshirtsCategory.id],
      attributes: {
        create: [
          { value: 'Full Color Front, No Back', metric: 'ink', priceMarkup: 0.0 },
          { value: 'Full Color Both Sides', metric: 'ink', priceMarkup: 8.50 },
          { value: 'Obsidian Black', metric: 'ink', priceMarkup: 0.0 },
          { value: 'Snow White', metric: 'ink', priceMarkup: 0.0 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Quantity',
      description: 'Total wholesale printing pack quantity.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id, flyersCategory.id],
      attributes: {
        create: [
          { value: '50', metric: 'units', priceMarkup: 0.0 },
          { value: '100', metric: 'units', priceMarkup: 5.00 },
          { value: '250', metric: 'units', priceMarkup: 12.00 },
          { value: '500', metric: 'units', priceMarkup: 20.00 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Rounded Corner',
      description: 'Specifies corner trimming options.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id],
      attributes: {
        create: [
          { value: 'None', metric: 'radius', priceMarkup: 0.0 },
          { value: '1/4" Rounded Corners', metric: 'radius', priceMarkup: 3.00 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Coating',
      description: 'Protective top layer gloss or matte coat finish.',
      categoryId: cardsCategory.id,
      categoryIds: [cardsCategory.id],
      attributes: {
        create: [
          { value: 'High Gloss UV Coating Front', metric: 'layer', priceMarkup: 0.0 },
          { value: 'Matte Finish', metric: 'layer', priceMarkup: 2.0 },
          { value: 'None', metric: 'layer', priceMarkup: 0.0 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Material',
      description: 'Substrate or fabric material standard.',
      categoryId: tshirtsCategory.id,
      categoryIds: [tshirtsCategory.id],
      attributes: {
        create: [
          { value: '100% Organic Combed Cotton', metric: 'cotton', priceMarkup: 0.0 },
          { value: 'Premium Breathable Polyester', metric: 'polyester', priceMarkup: 2.50 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Capacity',
      description: 'Volume capacity of custom mugs.',
      categoryId: mugsCategory.id,
      categoryIds: [mugsCategory.id],
      attributes: {
        create: [
          { value: '11 oz (Standard)', metric: 'volume', priceMarkup: 0.0 },
          { value: '15 oz (Large)', metric: 'volume', priceMarkup: 3.00 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Inside Color',
      description: 'Color of the inside wall of ceramic mugs.',
      categoryId: mugsCategory.id,
      categoryIds: [mugsCategory.id],
      attributes: {
        create: [
          { value: 'Pure White', metric: 'color', priceMarkup: 0.0 },
          { value: 'Matte Black', metric: 'color', priceMarkup: 1.50 },
          { value: 'Cobalt Blue', metric: 'color', priceMarkup: 2.00 },
          { value: 'Crimson Red', metric: 'color', priceMarkup: 2.00 }
        ]
      }
    }
  });

  await (prisma as any).globalOption.create({
    data: {
      name: 'Printing',
      description: 'Single or double sided promotional layout prints.',
      categoryId: flyersCategory.id,
      categoryIds: [flyersCategory.id],
      attributes: {
        create: [
          { value: 'Single-Sided (Front Only)', metric: 'sides', priceMarkup: 0.0 },
          { value: 'Double-Sided (Front & Back)', metric: 'sides', priceMarkup: 9.00 }
        ]
      }
    }
  });

  console.log('⚙️ Seeded Global Options linked to all categories successfully.');

  // 3. Create Core Products
  // Product 1: Business Cards
  const cardProduct = await prisma.product.create({
    data: {
      name: 'Premium Custom Business Cards',
      slug: 'business-cards',
      description: 'Elegant corporate business cards printed in high definition. Make a premium first impression. Customize with optional gold foil edges, spot UV, or rounded corners.',
      basePrice: 9.99,
      thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400',
      images: [
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1606293926075-69a00dbfde81?auto=format&fit=crop&q=80&w=800'
      ],
      widthPx: 1050,  // Proporción estándar 3.5" x 2" a 300dpi (1050x600 px)
      heightPx: 600,
      bleedMm: 2.0,
      categoryId: cardsCategory.id
    },
  });

  await prisma.productSpec.createMany({
    data: [
      // Size Group
      { productId: cardProduct.id, group: 'Size', value: '3.5x2', horizontal: 3.5, vertical: 2, priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Size', value: '2 X 2', horizontal: 2, vertical: 2, priceMarkup: 2.00 },
      // Orientation Group
      { productId: cardProduct.id, group: 'Orientation', value: 'Horizontal', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Orientation', value: 'Vertical', priceMarkup: 0.00 },
      // Paper Group
      { productId: cardProduct.id, group: 'Paper', value: '14 pt. Gloss', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Paper', value: '16 pt. Premium Matte', priceMarkup: 3.50 },
      // Color Group
      { productId: cardProduct.id, group: 'Color', value: 'Full Color Front, No Back', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Color', value: 'Full Color Both Sides', priceMarkup: 8.50 },
      // Quantity Group
      { productId: cardProduct.id, group: 'Quantity', value: '50', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Quantity', value: '100', priceMarkup: 5.00 },
      { productId: cardProduct.id, group: 'Quantity', value: '250', priceMarkup: 12.00 },
      { productId: cardProduct.id, group: 'Quantity', value: '500', priceMarkup: 20.00 },
      // Rounded Corner Group
      { productId: cardProduct.id, group: 'Rounded Corner', value: 'None', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Rounded Corner', value: '1/4" Rounded Corners', priceMarkup: 3.00 },
      // Coating Group
      { productId: cardProduct.id, group: 'Coating', value: 'High Gloss UV Coating Front', priceMarkup: 0.00 },
      { productId: cardProduct.id, group: 'Coating', value: 'Matte Finish', priceMarkup: 2.00 },
      { productId: cardProduct.id, group: 'Coating', value: 'None', priceMarkup: 0.00 }
    ],
  });

  // Product 2: Shirts
  const tshirtProduct = await prisma.product.create({
    data: {
      name: 'Custom Team & Corporate T-Shirts',
      slug: 'custom-tshirts',
      description: 'High-quality printed t-shirts made of 100% organic cotton or breathable athletic polyester. Durable direct-to-garment prints that withstand countless washes.',
      basePrice: 19.99,
      thumbnail: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400',
      images: [
        'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1562157873-818bc0726f68?auto=format&fit=crop&q=80&w=800'
      ],
      widthPx: 800,  // Lienzo cuadrado/vertical para el área del pecho
      heightPx: 900,
      bleedMm: 0.0,
      categoryId: tshirtsCategory.id
    },
  });

  await prisma.productSpec.createMany({
    data: [
      // Size Group
      { productId: tshirtProduct.id, group: 'Size', value: 'S', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Size', value: 'M', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Size', value: 'L', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Size', value: 'XL', priceMarkup: 2.00 },
      { productId: tshirtProduct.id, group: 'Size', value: 'XXL', priceMarkup: 3.50 },
      // Color Group
      { productId: tshirtProduct.id, group: 'Color', value: 'Obsidian Black', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Color', value: 'Snow White', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Color', value: 'Electric Blue', priceMarkup: 1.50 },
      { productId: tshirtProduct.id, group: 'Color', value: 'Fire Red', priceMarkup: 1.50 },
      // Material Group
      { productId: tshirtProduct.id, group: 'Material', value: '100% Organic Combed Cotton', priceMarkup: 0.00 },
      { productId: tshirtProduct.id, group: 'Material', value: 'Premium Breathable Polyester', priceMarkup: 2.50 },
    ],
  });

  // Product 3: Ceramic Mug
  const mugProduct = await prisma.product.create({
    data: {
      name: 'Custom Ceramic Color-Inside Mugs',
      slug: 'gradient-mugs',
      description: 'Start your mornings with a fully customized mug. Heat-resistant ceramic, dishwasher and microwave safe. Personalize the entire outer wrap.',
      basePrice: 12.99,
      thumbnail: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=400',
      images: [
        'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1517256064527-09c53b2d0bc6?auto=format&fit=crop&q=80&w=800'
      ],
      widthPx: 900,  // Proporción panorámica envolvente
      heightPx: 450,
      bleedMm: 1.5,
      categoryId: mugsCategory.id
    },
  });

  await prisma.productSpec.createMany({
    data: [
      // Capacity Group
      { productId: mugProduct.id, group: 'Capacity', value: '11 oz (Standard)', priceMarkup: 0.00 },
      { productId: mugProduct.id, group: 'Capacity', value: '15 oz (Large)', priceMarkup: 3.00 },
      // Inside Color Group
      { productId: mugProduct.id, group: 'Inside Color', value: 'Pure White', priceMarkup: 0.00 },
      { productId: mugProduct.id, group: 'Inside Color', value: 'Matte Black', priceMarkup: 1.50 },
      { productId: mugProduct.id, group: 'Inside Color', value: 'Cobalt Blue', priceMarkup: 2.00 },
      { productId: mugProduct.id, group: 'Inside Color', value: 'Crimson Red', priceMarkup: 2.00 },
    ],
  });

  // Product 4: Flyers
  const flyerProduct = await prisma.product.create({
    data: {
      name: 'High-Impact Promotional Flyers',
      slug: 'promotional-flyers',
      description: 'Boost your business visibility with high-impact promotional flyers. Printed in full vibrant color on glossy satin or thick matte cardstock.',
      basePrice: 14.99,
      thumbnail: 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
      images: [
        'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&q=80&w=800',
        'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&q=80&w=800'
      ],
      widthPx: 750,  // Flyer vertical 5" x 7" aprox
      heightPx: 1050,
      bleedMm: 2.0,
      categoryId: flyersCategory.id
    },
  });

  await prisma.productSpec.createMany({
    data: [
      // Size Group
      { productId: flyerProduct.id, group: 'Size', value: 'Half Page', horizontal: 5.5, vertical: 8.5, priceMarkup: 0.00 },
      { productId: flyerProduct.id, group: 'Size', value: 'Full Page', horizontal: 8.5, vertical: 11, priceMarkup: 6.00 },
      // Paper Group
      { productId: flyerProduct.id, group: 'Paper', value: 'Satin Paper 150g (Light)', priceMarkup: 0.00 },
      { productId: flyerProduct.id, group: 'Paper', value: 'Premium Cardstock 250g (Thick)', priceMarkup: 5.00 },
      // Printing Group
      { productId: flyerProduct.id, group: 'Printing', value: 'Single-Sided (Front Only)', priceMarkup: 0.00 },
      { productId: flyerProduct.id, group: 'Printing', value: 'Double-Sided (Front & Back)', priceMarkup: 9.00 },
      // Quantity Group
      { productId: flyerProduct.id, group: 'Quantity', value: '100 Units', priceMarkup: 0.00 },
      { productId: flyerProduct.id, group: 'Quantity', value: '250 Units', priceMarkup: 10.00 },
      { productId: flyerProduct.id, group: 'Quantity', value: '500 Units', priceMarkup: 18.00 },
    ],
  });

  console.log('📦 B2B Products and variants seeded successfully in English.');

  // 4. Create Sample Initial Custom Design for test user
  const sampleCanvasData = [
    {
      id: 'text-1',
      type: 'text',
      x: 100,
      y: 150,
      width: 400,
      height: 60,
      angle: 0,
      text: 'ACME CORPORATION',
      fontSize: 32,
      fontFamily: 'Outfit',
      color: '#002447',
    },
    {
      id: 'text-2',
      type: 'text',
      x: 100,
      y: 220,
      width: 300,
      height: 30,
      angle: 0,
      text: 'Premium Printing Solutions',
      fontSize: 16,
      fontFamily: 'Inter',
      color: '#6b7280',
    },
    {
      id: 'shape-1',
      type: 'shape',
      x: 100,
      y: 270,
      width: 150,
      height: 4,
      angle: 0,
      shapeType: 'rect',
      color: '#ff6600',
    },
  ];

  const design = await prisma.customDesign.create({
    data: {
      productId: cardProduct.id,
      userId: customer.id,
      name: 'My ACME Corporate Card',
      canvasData: JSON.stringify(sampleCanvasData),
      previewUrl: '', // Will be generated in the editor
    },
  });

  console.log(`🎨 Sample design record created for client with ID: ${design.id}`);
  console.log('🎉 Seeding successfully completed!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
