import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockDb } from '@/lib/mockData';

const prismaDb = db as any;

export async function GET(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  let product: any = null;
  let globalOptions: any[] = [];

  // 1. Intentar cargar desde base de datos relacional
  try {
    product = await prismaDb.product.findUnique({
      where: { slug },
      include: {
        specs: {
          orderBy: {
            position: 'asc'
          }
        },
      },
    });

    if (product) {
      try {
        globalOptions = await prismaDb.globalOption.findMany({
          include: { attributes: true }
        });
      } catch (err) {
        console.warn("PostgreSQL globalOptions query failed, utilizing mock options fallback.");
        globalOptions = mockDb.getGlobalOptions();
      }
    }
  } catch (error) {
    console.warn(`PostgreSQL offline. Cargando producto slug "${slug}" desde mock local...`, error);
  }

  // 2. Fallback a mock data si no se encontró en PostgreSQL
  if (!product) {
    const rawMock = mockDb.getProductBySlug(slug);
    if (rawMock) {
      // Copia profunda para no mutar el seed estático en memoria
      product = JSON.parse(JSON.stringify(rawMock));
    }
    globalOptions = mockDb.getGlobalOptions();
  }

  if (!product) {
    return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 });
  }

  // 3. Serializar y resolver herencia de especificaciones globales
  let specs = [...(product.specs || [])];
  
  let catOptions: any[] = [];
  if (product.categoryId) {
    catOptions = globalOptions.filter((o: any) => {
      if (o.categoryId === product.categoryId) return true;
      if (o.categoryIds) {
        const ids = Array.isArray(o.categoryIds)
          ? o.categoryIds
          : typeof o.categoryIds === 'string'
            ? JSON.parse(o.categoryIds)
            : [];
        return ids.includes(product.categoryId);
      }
      return false;
    });
    // Filter product.specs to only keep groups that are linked to this category to prevent display of mismatching options
    const allowedOptionNames = new Set(catOptions.map((o: any) => o.name));
    specs = specs.filter((s: any) => allowedOptionNames.has(s.group));
  } else {
    // Fallback behavior: use individual globalOptionIds
    const optionIds = Array.isArray(product.globalOptionIds) 
      ? product.globalOptionIds 
      : typeof product.globalOptionIds === 'string'
        ? JSON.parse(product.globalOptionIds || '[]')
        : [];
    catOptions = globalOptions.filter((o: any) => optionIds.includes(o.id));

    if (catOptions.length > 0) {
      catOptions.forEach((globalOpt: any) => {
        if (Array.isArray(globalOpt.attributes)) {
          globalOpt.attributes.forEach((attr: any, idx: number) => {
            // Evitar duplicados
            const exists = specs.some(s => s.group === globalOpt.name && s.value === attr.value);
            if (!exists) {
              specs.push({
                id: attr.id || `inherited-spec-${globalOpt.id}-${idx}`,
                productId: product.id,
                group: globalOpt.name,
                value: attr.value,
                priceMarkup: attr.priceMarkup,
                horizontal: attr.horizontal || 0,
                vertical: attr.vertical || 0,
              });
            }
          });
        }
      });
    }
  }

  // Enrich specs with metric and dimensions from global options if available
  specs = specs.map((spec: any) => {
    const globalOpt = globalOptions.find((o: any) => o.name === spec.group);
    if (globalOpt && Array.isArray(globalOpt.attributes)) {
      const match = globalOpt.attributes.find((a: any) => a.value === spec.value);
      if (match) {
        return {
          ...spec,
          metric: spec.metric || match.metric || 'none',
          horizontal: spec.horizontal || match.horizontal || 0,
          vertical: spec.vertical || match.vertical || 0
        };
      }
    }
    return {
      ...spec,
      metric: spec.metric || 'none'
    };
  });

  // Retornar el producto enriquecido con las especificaciones globales heredadas
  // Sort specs by position before returning (fallback to 0 if undefined)
  specs.sort((a: any, b: any) => {
    const posA = typeof a.position === 'number' ? a.position : 0;
    const posB = typeof b.position === 'number' ? b.position : 0;
    return posA - posB;
  });

  return NextResponse.json({
    ...product,
    specs
  });
}
