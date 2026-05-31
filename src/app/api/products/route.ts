import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mockDb } from '@/lib/mockData';

const prismaDb = db as any;

// GET: Obtener todos los productos con sus especificaciones
export async function GET() {
  try {
    const products = await prismaDb.product.findMany({
      include: {
        specs: {
          orderBy: {
            position: 'asc'
          }
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.warn('PostgreSQL offline o credenciales no válidas. Cargando catálogo mock de respaldo...', error);
    return NextResponse.json(mockDb.getProducts());
  }
}

// POST: Crear un nuevo producto (Solo Administrador)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { name, description, basePrice, thumbnail, images, widthPx, heightPx, bleedMm, dpi, specs, globalOptionIds, categoryId } = await req.json();

    if (!name || !description || !basePrice || !thumbnail || !widthPx || !heightPx) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    // Generar slug
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      // Verificar si el slug ya existe en PostgreSQL
      const existingProduct = await prismaDb.product.findUnique({
        where: { slug },
      });

      if (existingProduct) {
        return NextResponse.json({ error: 'A product with a similar name already exists' }, { status: 409 });
      }

      // Crear producto y sus especificaciones en una transacción
      const product = await prismaDb.$transaction(async (tx: any) => {
        const newProduct = await tx.product.create({
          data: {
            name,
            slug,
            description,
            basePrice: parseFloat(basePrice),
            thumbnail,
            images: images || [],
            widthPx: parseInt(widthPx),
            heightPx: parseInt(heightPx),
            bleedMm: parseFloat(bleedMm || '0'),
            dpi: dpi ? parseInt(dpi) : null,
            globalOptionIds: globalOptionIds || [],
            categoryId: categoryId || null
          },
        });

        if (specs && Array.isArray(specs)) {
          const specsData = specs.map((spec: any, idx: number) => ({
            productId: newProduct.id,
            group: spec.group,
            value: spec.value,
            priceMarkup: parseFloat(spec.priceMarkup || '0'),
            markupType: spec.markupType || 'FLAT',
            isBasePrice: spec.isBasePrice ?? false,
            position: typeof spec.position === 'number' ? spec.position : idx,
            horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
            vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
          }));

          await tx.productSpec.createMany({
            data: specsData,
          });
        }

        return tx.product.findUnique({
          where: { id: newProduct.id },
          include: { specs: true },
        });
      });

      return NextResponse.json(product, { status: 201 });
    } catch (dbError) {
      console.warn('PostgreSQL offline al crear producto. Usando memoria...', dbError);
      const newMock = mockDb.createProduct({
        name,
        description,
        basePrice,
        thumbnail,
        images,
        widthPx,
        heightPx,
        bleedMm,
        specs,
        globalOptionIds,
        categoryId
      });
      return NextResponse.json(newMock, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error al crear producto:', error);
    return NextResponse.json({ error: 'Internal server error while creating product' }, { status: 500 });
  }
}

// PUT: Actualizar un producto existente (Solo Administrador)
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { id, name, description, basePrice, thumbnail, images, widthPx, heightPx, bleedMm, dpi, specs, globalOptionIds, categoryId } = await req.json();

    if (!id || !name || !description || !basePrice || !thumbnail || !widthPx || !heightPx) {
      return NextResponse.json({ error: 'Missing mandatory fields' }, { status: 400 });
    }

    try {
      // 1. Fetch the existing product to retain its slug and prevent breaking hardcoded/SEO links
      const existing = await prismaDb.product.findUnique({
        where: { id },
        select: { slug: true }
      });
      const slug = existing?.slug || name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');

      // 2. Eliminar especificaciones antiguas del producto
      await prismaDb.productSpec.deleteMany({
        where: { productId: id }
      });

      // 3. Actualizar producto e insertar nuevas especificaciones
      const updatedProduct = await prismaDb.product.update({
        where: { id },
        data: {
          name,
          slug,
          description,
          basePrice: parseFloat(basePrice),
          thumbnail,
          images: images || [],
          widthPx: parseInt(widthPx),
          heightPx: parseInt(heightPx),
          bleedMm: parseFloat(bleedMm || '0'),
          dpi: dpi ? parseInt(dpi) : null,
          globalOptionIds: globalOptionIds || [],
          categoryId: categoryId || null,
          specs: {
            createMany: {
              data: (specs || []).map((spec: any, idx: number) => ({
                group: spec.group,
                value: spec.value,
                priceMarkup: parseFloat(spec.priceMarkup || '0'),
                markupType: spec.markupType || 'FLAT',
                isBasePrice: spec.isBasePrice ?? false,
                position: typeof spec.position === 'number' ? spec.position : idx,
                horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
                vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
              }))
            }
          }
        },
        include: {
          specs: true
        }
      });

      return NextResponse.json(updatedProduct);
    } catch (dbError) {
      console.warn('PostgreSQL offline al actualizar producto. Usando memoria...', dbError);
      const updatedMock = mockDb.updateProduct(id, {
        name,
        description,
        basePrice,
        thumbnail,
        images,
        widthPx,
        heightPx,
        bleedMm,
        specs,
        globalOptionIds,
        categoryId
      });
      if (!updatedMock) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json(updatedMock);
    }
  } catch (error: any) {
    console.error('Error al actualizar producto:', error);
    return NextResponse.json({ error: 'Internal server error while updating product' }, { status: 500 });
  }
}

// DELETE: Eliminar un producto (Solo Administrador)
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    try {
      // 1. Borrar especificaciones asociadas de PostgreSQL
      await prismaDb.productSpec.deleteMany({
        where: { productId: id }
      });

      // 2. Borrar producto
      const deletedProduct = await prismaDb.product.delete({
        where: { id }
      });

      return NextResponse.json({ success: true, deleted: deletedProduct });
    } catch (dbError) {
      console.warn('PostgreSQL offline al eliminar producto. Usando memoria...', dbError);
      const success = mockDb.deleteProduct(id);
      if (!success) {
        return NextResponse.json({ error: 'Product not found in memory' }, { status: 404 });
      }
      return NextResponse.json({ success: true, id });
    }
  } catch (error: any) {
    console.error('Error al eliminar producto:', error);
    return NextResponse.json({ error: 'Internal server error while deleting product' }, { status: 500 });
  }
}
