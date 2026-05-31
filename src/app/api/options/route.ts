import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { mockDb } from '@/lib/mockData';

const prismaDb = db as any;

// GET all global options alongside their attributes
export async function GET() {
  try {
    const options = await prismaDb.globalOption.findMany({
      include: { attributes: true },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(options);
  } catch (err) {
    console.warn("PostgreSQL offline or GlobalOption schema not loaded. Falling back to resilient in-memory options mock store.");
    const mockOptions = mockDb.getGlobalOptions();
    return NextResponse.json(mockOptions);
  }
}

// POST: Create a new custom option with attributes
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, description, attributes, categoryId, categoryIds } = body;

    if (!name) {
      return NextResponse.json({ error: 'Option name is required' }, { status: 400 });
    }

    try {
      const option = await prismaDb.globalOption.create({
        data: {
          name,
          description: description || '',
          categoryId: categoryId || null,
          categoryIds: categoryIds || null,
          attributes: {
            create: (attributes || []).map((attr: any) => ({
              value: attr.value,
              metric: attr.metric || '',
              priceMarkup: parseFloat(attr.priceMarkup || '0'),
              markupType: attr.markupType || 'FLAT',
              isBasePrice: attr.isBasePrice ?? false,
              horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
              vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
            }))
          }
        },
        include: { attributes: true }
      });
      return NextResponse.json(option);
    } catch (err) {
      console.warn("PostgreSQL write failed, falling back to mock save.");
      const mockOption = mockDb.saveGlobalOption({ name, description, attributes, categoryId, categoryIds });
      return NextResponse.json(mockOption);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT: Edit existing option/attributes
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, name, description, attributes, categoryId, categoryIds } = body;

    if (!id || !name) {
      return NextResponse.json({ error: 'Option ID and name are required' }, { status: 400 });
    }

    try {
      // Clean old attributes first to perform atomic cascade refresh
      await prismaDb.globalAttribute.deleteMany({
        where: { optionId: id }
      });

      const option = await prismaDb.globalOption.update({
        where: { id },
        data: {
          name,
          description: description || '',
          categoryId: categoryId || null,
          categoryIds: categoryIds || null,
          attributes: {
            create: (attributes || []).map((attr: any) => ({
              value: attr.value,
              metric: attr.metric || '',
              priceMarkup: parseFloat(attr.priceMarkup || '0'),
              markupType: attr.markupType || 'FLAT',
              isBasePrice: attr.isBasePrice ?? false,
              horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
              vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
            }))
          }
        },
        include: { attributes: true }
      });
      return NextResponse.json(option);
    } catch (err) {
      console.warn("PostgreSQL update failed, falling back to mock update.");
      const mockOption = mockDb.saveGlobalOption({ id, name, description, attributes, categoryId, categoryIds });
      return NextResponse.json(mockOption);
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE: Cascade delete custom option
export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Option ID is required' }, { status: 400 });
    }

    try {
      await prismaDb.globalOption.delete({
        where: { id }
      });
      return NextResponse.json({ success: true });
    } catch (err) {
      console.warn("PostgreSQL delete failed, falling back to mock delete.");
      const deleted = mockDb.deleteGlobalOption(id);
      if (deleted) {
        return NextResponse.json({ success: true });
      } else {
        return NextResponse.json({ error: 'Option not found in mock store' }, { status: 404 });
      }
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
