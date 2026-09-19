// Mock Database Fallback for Printear (UPrinting Redesign)
// Fully localized to English.
// This file acts as a fully functional mock database so the app works flawlessly
// even if PostgreSQL is offline or credentials in .env are not valid.

export interface MockProductSpec {
  id: string;
  productId: string;
  group: string;
  value: string;
  priceMarkup: number;
  position?: number;
  horizontal?: number;
  vertical?: number;
}

export interface MockProduct {
  id: string;
  name: string;
  slug: string;
  description?: string;
  basePrice: number;
  thumbnail: string;
  images?: string[];
  widthPx: number;
  heightPx: number;
  bleedMm: number;
  specs: MockProductSpec[];
  globalOptionIds?: string[];
  categoryId?: string;
  isFeatured?: boolean;
}

export interface MockUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN' | 'CUSTOMER';
  createdAt: Date;
}

export interface MockGlobalAttribute {
  id: string;
  optionId: string;
  value: string;
  metric: string;
  priceMarkup: number;
  horizontal?: number;
  vertical?: number;
}

export interface MockGlobalOption {
  id: string;
  name: string;
  description?: string;
  attributes: MockGlobalAttribute[];
  categoryId?: string;
  categoryIds?: string[];
}

export interface MockCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

// 0. Static mock categories
export const MOCK_CATEGORIES: MockCategory[] = [
  { id: 'cat-cards', name: 'Business Cards', slug: 'business-cards', description: 'Premium custom business cards and corporate stationery.' },
  { id: 'cat-tshirts', name: 'T-Shirts', slug: 'custom-tshirts', description: 'Custom team & corporate printed apparel.' },
  { id: 'cat-mugs', name: 'Mugs', slug: 'gradient-mugs', description: 'Custom printed ceramic mugs.' },
  { id: 'cat-flyers', name: 'Flyers', slug: 'promotional-flyers', description: 'High-impact promotional and marketing flyers.' }
];

// 1. Static mock products in English
export const MOCK_PRODUCTS: MockProduct[] = [
  {
    id: 'prod-cards',
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
    widthPx: 1050, // Standard 3.5" x 2" at 300dpi (1050x600 px)
    heightPx: 600,
    bleedMm: 2.0,
    specs: [
      // Size Group
      { id: 'spec-c1', productId: 'prod-cards', group: 'Size', value: '2" x 3.5" U.S. Standard', priceMarkup: 0.0 },
      { id: 'spec-c2', productId: 'prod-cards', group: 'Size', value: '2" x 2" Square', priceMarkup: 2.0 },
      // Orientation Group
      { id: 'spec-c3', productId: 'prod-cards', group: 'Orientation', value: 'Horizontal', priceMarkup: 0.0 },
      { id: 'spec-c4', productId: 'prod-cards', group: 'Orientation', value: 'Vertical', priceMarkup: 0.0 },
      // Paper Group
      { id: 'spec-c5', productId: 'prod-cards', group: 'Paper', value: '14 pt. Gloss', priceMarkup: 0.0 },
      { id: 'spec-c6', productId: 'prod-cards', group: 'Paper', value: '16 pt. Premium Matte', priceMarkup: 3.50 },
      // Color Group
      { id: 'spec-c7', productId: 'prod-cards', group: 'Color', value: 'Full Color Front, No Back', priceMarkup: 0.0 },
      { id: 'spec-c8', productId: 'prod-cards', group: 'Color', value: 'Full Color Both Sides', priceMarkup: 8.50 },
      // Quantity Group
      { id: 'spec-c9', productId: 'prod-cards', group: 'Quantity', value: '50', priceMarkup: 0.0 },
      { id: 'spec-c10', productId: 'prod-cards', group: 'Quantity', value: '100', priceMarkup: 5.00 },
      { id: 'spec-c11', productId: 'prod-cards', group: 'Quantity', value: '250', priceMarkup: 12.00 },
      { id: 'spec-c12', productId: 'prod-cards', group: 'Quantity', value: '500', priceMarkup: 20.00 },
      // Rounded Corner Group
      { id: 'spec-c13', productId: 'prod-cards', group: 'Rounded Corner', value: 'None', priceMarkup: 0.0 },
      { id: 'spec-c14', productId: 'prod-cards', group: 'Rounded Corner', value: '1/4" Rounded Corners', priceMarkup: 3.0 },
      // Coating Group
      { id: 'spec-c15', productId: 'prod-cards', group: 'Coating', value: 'High Gloss UV Coating Front', priceMarkup: 0.0 },
      { id: 'spec-c16', productId: 'prod-cards', group: 'Coating', value: 'Matte Finish', priceMarkup: 2.0 },
      { id: 'spec-c17', productId: 'prod-cards', group: 'Coating', value: 'None', priceMarkup: 0.0 }
    ],
    globalOptionIds: ['opt-size', 'opt-orientation', 'opt-paper', 'opt-color', 'opt-qty', 'opt-corner', 'opt-coating'],
    categoryId: 'cat-cards',
    isFeatured: true
  },
  {
    id: 'prod-tshirts',
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
    widthPx: 800,
    heightPx: 900,
    bleedMm: 0.0,
    specs: [
      // Size Group
      { id: 'spec-t1', productId: 'prod-tshirts', group: 'Size', value: 'S', priceMarkup: 0.0 },
      { id: 'spec-t2', productId: 'prod-tshirts', group: 'Size', value: 'M', priceMarkup: 0.0 },
      { id: 'spec-t3', productId: 'prod-tshirts', group: 'Size', value: 'L', priceMarkup: 0.0 },
      { id: 'spec-t4', productId: 'prod-tshirts', group: 'Size', value: 'XL', priceMarkup: 2.0 },
      { id: 'spec-t5', productId: 'prod-tshirts', group: 'Size', value: 'XXL', priceMarkup: 3.50 },
      // Color Group
      { id: 'spec-t6', productId: 'prod-tshirts', group: 'Color', value: 'Obsidian Black', priceMarkup: 0.0 },
      { id: 'spec-t7', productId: 'prod-tshirts', group: 'Color', value: 'Snow White', priceMarkup: 0.0 },
      { id: 'spec-t8', productId: 'prod-tshirts', group: 'Color', value: 'Electric Blue', priceMarkup: 1.50 },
      { id: 'spec-t9', productId: 'prod-tshirts', group: 'Color', value: 'Fire Red', priceMarkup: 1.50 },
      // Material Group
      { id: 'spec-t10', productId: 'prod-tshirts', group: 'Material', value: '100% Organic Combed Cotton', priceMarkup: 0.0 },
      { id: 'spec-t11', productId: 'prod-tshirts', group: 'Material', value: 'Premium Breathable Polyester', priceMarkup: 2.50 }
    ],
    categoryId: 'cat-tshirts',
    isFeatured: true
  },
  {
    id: 'prod-mugs',
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
    widthPx: 900,
    heightPx: 450,
    bleedMm: 1.5,
    specs: [
      // Capacity Group
      { id: 'spec-m1', productId: 'prod-mugs', group: 'Capacity', value: '11 oz (Standard)', priceMarkup: 0.0 },
      { id: 'spec-m2', productId: 'prod-mugs', group: 'Capacity', value: '15 oz (Large)', priceMarkup: 3.0 },
      // Inside Color Group
      { id: 'spec-m3', productId: 'prod-mugs', group: 'Inside Color', value: 'Pure White', priceMarkup: 0.0 },
      { id: 'spec-m4', productId: 'prod-mugs', group: 'Inside Color', value: 'Matte Black', priceMarkup: 1.50 },
      { id: 'spec-m5', productId: 'prod-mugs', group: 'Inside Color', value: 'Cobalt Blue', priceMarkup: 2.00 },
      { id: 'spec-m6', productId: 'prod-mugs', group: 'Inside Color', value: 'Crimson Red', priceMarkup: 2.00 }
    ],
    categoryId: 'cat-mugs'
  },
  {
    id: 'prod-flyers',
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
    widthPx: 750,
    heightPx: 1050,
    bleedMm: 2.0,
    specs: [
      // Size Group
      { id: 'spec-f1', productId: 'prod-flyers', group: 'Size', value: 'Half Page (5.5" x 8.5")', priceMarkup: 0.0 },
      { id: 'spec-f2', productId: 'prod-flyers', group: 'Size', value: 'Full Page (8.5" x 11")', priceMarkup: 6.0 },
      // Paper Group
      { id: 'spec-f3', productId: 'prod-flyers', group: 'Paper', value: 'Satin Paper 150g (Light)', priceMarkup: 0.0 },
      { id: 'spec-f4', productId: 'prod-flyers', group: 'Paper', value: 'Premium Cardstock 250g (Thick)', priceMarkup: 5.0 },
      // Printing Group
      { id: 'spec-f5', productId: 'prod-flyers', group: 'Printing', value: 'Single-Sided (Front Only)', priceMarkup: 0.0 },
      { id: 'spec-f6', productId: 'prod-flyers', group: 'Printing', value: 'Double-Sided (Front & Back)', priceMarkup: 9.00 },
      // Quantity Group
      { id: 'spec-f7', productId: 'prod-flyers', group: 'Quantity', value: '100 Units', priceMarkup: 0.0 },
      { id: 'spec-f8', productId: 'prod-flyers', group: 'Quantity', value: '250 Units', priceMarkup: 10.0 },
      { id: 'spec-f9', productId: 'prod-flyers', group: 'Quantity', value: '500 Units', priceMarkup: 18.0 }
    ],
    categoryId: 'cat-flyers'
  }
];

// Reusable global options and attributes in English
export const MOCK_GLOBAL_OPTIONS: MockGlobalOption[] = [
  {
    id: 'opt-size',
    name: 'Size',
    description: 'Physical dimensions for e-commerce printing blueprints.',
    attributes: [
      { id: 'attr-s1', optionId: 'opt-size', value: '2" x 3.5" U.S. Standard', metric: 'inches', priceMarkup: 0.0 },
      { id: 'attr-s2', optionId: 'opt-size', value: '2" x 2" Square', metric: 'inches', priceMarkup: 2.0 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards', 'cat-tshirts', 'cat-flyers']
  },
  {
    id: 'opt-orientation',
    name: 'Orientation',
    description: 'Canvas print orientation.',
    attributes: [
      { id: 'attr-o1', optionId: 'opt-orientation', value: 'Horizontal', metric: 'direction', priceMarkup: 0.0 },
      { id: 'attr-o2', optionId: 'opt-orientation', value: 'Vertical', metric: 'direction', priceMarkup: 0.0 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards']
  },
  {
    id: 'opt-paper',
    name: 'Paper',
    description: 'Density and fiber texture of the paper materials.',
    attributes: [
      { id: 'attr-p1', optionId: 'opt-paper', value: '14 pt. Gloss', metric: 'pts', priceMarkup: 0.0 },
      { id: 'attr-p2', optionId: 'opt-paper', value: '16 pt. Premium Matte', metric: 'pts', priceMarkup: 3.50 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards', 'cat-flyers']
  },
  {
    id: 'opt-color',
    name: 'Color',
    description: 'Sides printing configuration.',
    attributes: [
      { id: 'attr-c1', optionId: 'opt-color', value: 'Full Color Front, No Back', metric: 'ink', priceMarkup: 0.0 },
      { id: 'attr-c2', optionId: 'opt-color', value: 'Full Color Both Sides', metric: 'ink', priceMarkup: 8.50 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards', 'cat-tshirts']
  },
  {
    id: 'opt-qty',
    name: 'Quantity',
    description: 'Total wholesale printing pack quantity.',
    attributes: [
      { id: 'attr-q1', optionId: 'opt-qty', value: '50', metric: 'units', priceMarkup: 0.0 },
      { id: 'attr-q2', optionId: 'opt-qty', value: '100', metric: 'units', priceMarkup: 5.00 },
      { id: 'attr-q3', optionId: 'opt-qty', value: '250', metric: 'units', priceMarkup: 12.00 },
      { id: 'attr-q4', optionId: 'opt-qty', value: '500', metric: 'units', priceMarkup: 20.00 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards', 'cat-flyers']
  },
  {
    id: 'opt-corner',
    name: 'Rounded Corner',
    description: 'Specifies corner trimming options.',
    attributes: [
      { id: 'attr-cr1', optionId: 'opt-corner', value: 'None', metric: 'radius', priceMarkup: 0.0 },
      { id: 'attr-cr2', optionId: 'opt-corner', value: '1/4" Rounded Corners', metric: 'radius', priceMarkup: 3.0 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards']
  },
  {
    id: 'opt-coating',
    name: 'Coating',
    description: 'Protective top layer gloss or matte coat finish.',
    attributes: [
      { id: 'attr-ct1', optionId: 'opt-coating', value: 'High Gloss UV Coating Front', metric: 'layer', priceMarkup: 0.0 },
      { id: 'attr-ct2', optionId: 'opt-coating', value: 'Matte Finish', metric: 'layer', priceMarkup: 2.0 },
      { id: 'attr-ct3', optionId: 'opt-coating', value: 'None', metric: 'layer', priceMarkup: 0.0 }
    ],
    categoryId: 'cat-cards',
    categoryIds: ['cat-cards']
  },
  {
    id: 'opt-material',
    name: 'Material',
    description: 'Substrate or fabric material standard.',
    attributes: [
      { id: 'attr-m1', optionId: 'opt-material', value: '100% Organic Combed Cotton', metric: 'cotton', priceMarkup: 0.0 },
      { id: 'attr-m2', optionId: 'opt-material', value: 'Premium Breathable Polyester', metric: 'polyester', priceMarkup: 2.50 }
    ],
    categoryId: 'cat-tshirts',
    categoryIds: ['cat-tshirts']
  },
  {
    id: 'opt-capacity',
    name: 'Capacity',
    description: 'Volume capacity of custom mugs.',
    attributes: [
      { id: 'attr-cp1', optionId: 'opt-capacity', value: '11 oz (Standard)', metric: 'volume', priceMarkup: 0.0 },
      { id: 'attr-cp2', optionId: 'opt-capacity', value: '15 oz (Large)', metric: 'volume', priceMarkup: 3.00 }
    ],
    categoryId: 'cat-mugs',
    categoryIds: ['cat-mugs']
  },
  {
    id: 'opt-insidecolor',
    name: 'Inside Color',
    description: 'Color of the inside wall of ceramic mugs.',
    attributes: [
      { id: 'attr-ic1', optionId: 'opt-insidecolor', value: 'Pure White', metric: 'color', priceMarkup: 0.0 },
      { id: 'attr-ic2', optionId: 'opt-insidecolor', value: 'Matte Black', metric: 'color', priceMarkup: 1.50 },
      { id: 'attr-ic3', optionId: 'opt-insidecolor', value: 'Cobalt Blue', metric: 'color', priceMarkup: 2.00 },
      { id: 'attr-ic4', optionId: 'opt-insidecolor', value: 'Crimson Red', metric: 'color', priceMarkup: 2.00 }
    ],
    categoryId: 'cat-mugs',
    categoryIds: ['cat-mugs']
  },
  {
    id: 'opt-printing',
    name: 'Printing',
    description: 'Single or double sided promotional layout prints.',
    attributes: [
      { id: 'attr-pr1', optionId: 'opt-printing', value: 'Single-Sided (Front Only)', metric: 'sides', priceMarkup: 0.0 },
      { id: 'attr-pr2', optionId: 'opt-printing', value: 'Double-Sided (Front & Back)', metric: 'sides', priceMarkup: 9.00 }
    ],
    categoryId: 'cat-flyers',
    categoryIds: ['cat-flyers']
  }
];

// 2. In-Memory user list matching seed credentials in English
export const MOCK_USERS: MockUser[] = [
  {
    id: 'user-admin',
    email: 'admin@printear.com',
    name: 'Printear Administrator',
    role: 'ADMIN',
    createdAt: new Date()
  },
  {
    id: 'user-customer',
    email: 'cliente@printear.com',
    name: 'Charles Printings',
    role: 'CUSTOMER',
    createdAt: new Date()
  }
];

// 3. In-Memory volatile storage for designs and orders to keep the editor and dashboard responsive
let mockDesigns: any[] = [
  {
    id: 'design-sample',
    productId: 'prod-cards',
    userId: 'user-customer',
    name: 'My ACME Corporate Card',
    canvasData: JSON.stringify([
      { id: 'text-1', type: 'text', x: 100, y: 150, width: 400, height: 60, angle: 0, text: 'ACME CORPORATION', fontSize: 32, fontFamily: 'Outfit', color: '#002447' },
      { id: 'text-2', type: 'text', x: 100, y: 220, width: 300, height: 30, angle: 0, text: 'Premium Printing Solutions', fontSize: 16, fontFamily: 'Inter', color: '#6b7280' },
      { id: 'shape-1', type: 'shape', x: 100, y: 270, width: 150, height: 4, angle: 0, shapeType: 'rect', color: '#ff6600' }
    ]),
    previewUrl: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    product: {
      name: 'Premium Custom Business Cards',
      slug: 'business-cards',
      thumbnail: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&q=80&w=400'
    }
  }
];

let mockOrders: any[] = [];

// Helper utility functions for local mocking
export const mockDb = {
  getProducts: () => {
    return MOCK_PRODUCTS.map(p => ({
      ...p,
      specs: [...p.specs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    }));
  },
  
  getProductBySlug: (slug: string) => {
    let prod = MOCK_PRODUCTS.find(p => p.slug === slug);
    if (!prod && (slug.includes('card') || slug === 'business-cards' || slug === 'premium-business-cards' || slug === 'premium-custom-business-cards')) {
      prod = MOCK_PRODUCTS.find(p => p.id === 'prod-cards');
    }
    if (!prod) return null;
    return {
      ...prod,
      specs: [...prod.specs].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    };
  },
  
  getDesigns: (userId: string | null) => {
    if (!userId) return [];
    return mockDesigns.filter(d => d.userId === userId || !d.userId);
  },

  getDesignById: (id: string) => {
    return mockDesigns.find(d => d.id === id) || null;
  },
  
  saveDesign: (design: { id?: string; productId: string; userId: string | null; name: string; canvasData: any; previewUrl: string }) => {
    const targetProduct = MOCK_PRODUCTS.find(p => p.id === design.productId) || MOCK_PRODUCTS[0];
    
    if (design.id) {
      // Update
      const idx = mockDesigns.findIndex(d => d.id === design.id);
      if (idx !== -1) {
        mockDesigns[idx] = {
          ...mockDesigns[idx],
          name: design.name,
          canvasData: typeof design.canvasData === 'string' ? design.canvasData : JSON.stringify(design.canvasData),
          previewUrl: design.previewUrl,
          updatedAt: new Date().toISOString()
        };
        return mockDesigns[idx];
      }
    }
    
    // Create new
    const newDesign = {
      id: design.id || `design-${Math.random().toString(36).substr(2, 9)}`,
      productId: design.productId,
      userId: design.userId,
      name: design.name || 'My Custom Design',
      canvasData: typeof design.canvasData === 'string' ? design.canvasData : JSON.stringify(design.canvasData),
      previewUrl: design.previewUrl,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      product: {
        name: targetProduct.name,
        slug: targetProduct.slug,
        thumbnail: targetProduct.thumbnail
      }
    };
    mockDesigns.unshift(newDesign);
    return newDesign;
  },

  getOrders: (userId: string | null, isAdmin: boolean) => {
    if (isAdmin) return mockOrders;
    return mockOrders.filter(o => o.userId === userId);
  },

  createOrder: (orderData: { userId: string | null; totalAmount: number; shippingName: string; shippingAddress: string; shippingCity: string; shippingZip: string; shippingPhone: string; items: any[] }) => {
    const newOrderId = `order-${Math.random().toString(36).substr(2, 9)}`;
    const mappedItems = orderData.items.map((item, idx) => {
      const targetProduct = MOCK_PRODUCTS.find(p => p.id === item.productId) || MOCK_PRODUCTS[0];
      const targetDesign = mockDesigns.find(d => d.id === item.customDesignId) || null;
      return {
        id: `item-${idx}-${Math.random().toString(36).substr(2, 5)}`,
        orderId: newOrderId,
        productId: item.productId,
        customDesignId: item.customDesignId,
        quantity: parseInt(item.quantity),
        selectedSpecs: item.selectedSpecs,
        unitPrice: parseFloat(item.unitPrice),
        product: targetProduct,
        customDesign: targetDesign
      };
    });

    const newOrder = {
      id: newOrderId,
      userId: orderData.userId,
      status: 'PAID',
      totalAmount: orderData.totalAmount,
      shippingName: orderData.shippingName,
      shippingAddress: orderData.shippingAddress,
      shippingCity: orderData.shippingCity,
      shippingZip: orderData.shippingZip,
      shippingPhone: orderData.shippingPhone,
      createdAt: new Date().toISOString(),
      items: mappedItems,
      user: orderData.userId ? { name: orderData.shippingName, email: orderData.userId === 'user-admin' ? 'admin@printear.com' : 'cliente@printear.com' } : null
    };

    mockOrders.unshift(newOrder);
    return newOrder;
  },

  updateOrderStatus: (orderId: string, newStatus: string) => {
    const idx = mockOrders.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      mockOrders[idx] = {
        ...mockOrders[idx],
        status: newStatus
      };
      return mockOrders[idx];
    }
    return null;
  },

  createProduct: (data: any) => {
    const newId = `prod-${Math.random().toString(36).substr(2, 9)}`;
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const newProduct = {
      id: newId,
      name: data.name,
      slug,
      description: data.description,
      basePrice: parseFloat(data.basePrice || '0'),
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
      images: data.images || [],
      widthPx: parseInt(data.widthPx || '1000'),
      heightPx: parseInt(data.heightPx || '600'),
      bleedMm: parseFloat(data.bleedMm || '2.0'),
      isFeatured: !!data.isFeatured,
      specs: (data.specs || []).map((spec: any, idx: number) => ({
        id: `spec-${newId}-${idx}`,
        productId: newId,
        group: spec.group,
        value: spec.value,
        priceMarkup: parseFloat(spec.priceMarkup || '0'),
        position: typeof spec.position === 'number' ? spec.position : idx,
        horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
        vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
      })),
      globalOptionIds: data.globalOptionIds || [],
      categoryId: data.categoryId || null
    };

    MOCK_PRODUCTS.unshift(newProduct);
    return newProduct;
  },

  updateProduct: (id: string, data: any) => {
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      // Retain existing slug to prevent breaking SEO URLs and hardcoded product page references
      const slug = MOCK_PRODUCTS[idx].slug || data.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      MOCK_PRODUCTS[idx] = {
        ...MOCK_PRODUCTS[idx],
        name: data.name,
        slug,
        description: data.description,
        basePrice: parseFloat(data.basePrice || '0'),
        thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
        images: data.images || [],
        widthPx: parseInt(data.widthPx || '1000'),
        heightPx: parseInt(data.heightPx || '600'),
        bleedMm: parseFloat(data.bleedMm || '2.0'),
        isFeatured: data.isFeatured !== undefined ? !!data.isFeatured : MOCK_PRODUCTS[idx].isFeatured,
        specs: (data.specs || []).map((spec: any, sIdx: number) => ({
          id: spec.id || `spec-${id}-${sIdx}`,
          productId: id,
          group: spec.group,
          value: spec.value,
          priceMarkup: parseFloat(spec.priceMarkup || '0'),
          position: typeof spec.position === 'number' ? spec.position : sIdx,
          horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
          vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
        })),
        globalOptionIds: data.globalOptionIds || [],
        categoryId: data.categoryId || null
      };
      return MOCK_PRODUCTS[idx];
    }
    return null;
  },

  deleteProduct: (id: string) => {
    const idx = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (idx !== -1) {
      MOCK_PRODUCTS.splice(idx, 1);
      return true;
    }
    return false;
  },

  duplicateProduct: (id: string) => {
    const original = MOCK_PRODUCTS.find(p => p.id === id);
    if (!original) return null;
    const newId = `prod-${Date.now()}`;
    const newName = `${original.name} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now().toString().slice(-4)}`;
    const copy: MockProduct = {
      ...JSON.parse(JSON.stringify(original)),
      id: newId,
      name: newName,
      slug: newSlug,
      isFeatured: false,
      specs: (original.specs || []).map((s: any, idx: number) => ({
        ...s,
        id: `spec-${newId}-${idx}`,
        productId: newId
      }))
    };
    MOCK_PRODUCTS.unshift(copy);
    return copy;
  },

  getGlobalOptions: () => MOCK_GLOBAL_OPTIONS,

  saveGlobalOption: (data: any) => {
    if (data.id) {
      // Edit
      const idx = MOCK_GLOBAL_OPTIONS.findIndex(o => o.id === data.id);
      if (idx !== -1) {
        MOCK_GLOBAL_OPTIONS[idx] = {
          ...MOCK_GLOBAL_OPTIONS[idx],
          name: data.name,
          description: data.description,
          categoryId: data.categoryId || null,
          categoryIds: data.categoryIds || [],
          attributes: (data.attributes || []).map((attr: any, aIdx: number) => ({
            id: attr.id || `attr-${data.id}-${aIdx}`,
            optionId: data.id,
            value: attr.value,
            metric: attr.metric || '',
            priceMarkup: parseFloat(attr.priceMarkup || '0'),
            horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
            vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
          }))
        };
        return MOCK_GLOBAL_OPTIONS[idx];
      }
    }
    
    // Create new
    const newId = `opt-${Math.random().toString(36).substr(2, 9)}`;
    const newOption = {
      id: newId,
      name: data.name,
      description: data.description,
      categoryId: data.categoryId || null,
      categoryIds: data.categoryIds || [],
      attributes: (data.attributes || []).map((attr: any, aIdx: number) => ({
        id: `attr-${newId}-${aIdx}`,
        optionId: newId,
        value: attr.value,
        metric: attr.metric || '',
        priceMarkup: parseFloat(attr.priceMarkup || '0'),
        horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
        vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
      }))
    };
    MOCK_GLOBAL_OPTIONS.unshift(newOption);
    return newOption;
  },

  deleteGlobalOption: (id: string) => {
    const idx = MOCK_GLOBAL_OPTIONS.findIndex(o => o.id === id);
    if (idx !== -1) {
      MOCK_GLOBAL_OPTIONS.splice(idx, 1);
      return true;
    }
    return false;
  },

  getCategories: () => MOCK_CATEGORIES,

  saveCategory: (data: any) => {
    const slug = data.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    if (data.id) {
      // Edit
      const idx = MOCK_CATEGORIES.findIndex(c => c.id === data.id);
      if (idx !== -1) {
        MOCK_CATEGORIES[idx] = {
          ...MOCK_CATEGORIES[idx],
          name: data.name,
          slug,
          description: data.description || ''
        };
        return MOCK_CATEGORIES[idx];
      }
    }
    
    // Create new
    const newId = `cat-${Math.random().toString(36).substr(2, 9)}`;
    const newCat = {
      id: newId,
      name: data.name,
      slug,
      description: data.description || ''
    };
    MOCK_CATEGORIES.unshift(newCat);
    return newCat;
  },

  deleteCategory: (id: string) => {
    const idx = MOCK_CATEGORIES.findIndex(c => c.id === id);
    if (idx !== -1) {
      MOCK_CATEGORIES.splice(idx, 1);
      // Unlink products and options
      MOCK_PRODUCTS.forEach(p => {
        if (p.categoryId === id) p.categoryId = undefined;
      });
      MOCK_GLOBAL_OPTIONS.forEach(o => {
        if (o.categoryId === id) o.categoryId = undefined;
        if (o.categoryIds) {
          o.categoryIds = o.categoryIds.filter(cid => cid !== id);
        }
      });
      return true;
    }
    return false;
  }
};
