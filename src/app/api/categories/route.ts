import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mockDb } from '@/lib/mockData';

const prismaDb = db as any;

// GET: Obtener todas las categorías
export async function GET() {
  try {
    const categories = await prismaDb.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(categories);
  } catch (error) {
    console.warn('PostgreSQL offline o esquema Category no cargado. Cargando categorías mock...', error);
    return NextResponse.json(mockDb.getCategories());
  }
}

// POST: Crear una nueva categoría (Solo Administrador)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { name, description } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      // Verificar si ya existe
      const existing = await prismaDb.category.findUnique({
        where: { slug }
      });

      if (existing) {
        return NextResponse.json({ error: 'A category with a similar name already exists' }, { status: 409 });
      }

      const category = await prismaDb.category.create({
        data: {
          name,
          slug,
          description: description || ''
        }
      });

      return NextResponse.json(category, { status: 201 });
    } catch (dbError) {
      console.warn('PostgreSQL offline al crear categoría. Usando memoria...', dbError);
      const newMock = mockDb.saveCategory({ name, description });
      return NextResponse.json(newMock, { status: 201 });
    }
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return NextResponse.json({ error: 'Internal server error while creating category' }, { status: 500 });
  }
}

// PUT: Actualizar una categoría existente (Solo Administrador)
export async function PUT(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { id, name, description } = await req.json();

    if (!id || !name) {
      return NextResponse.json({ error: 'Category ID and name are required' }, { status: 400 });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const category = await prismaDb.category.update({
        where: { id },
        data: {
          name,
          slug,
          description: description || ''
        }
      });

      return NextResponse.json(category);
    } catch (dbError) {
      console.warn('PostgreSQL offline al actualizar categoría. Usando memoria...', dbError);
      const updatedMock = mockDb.saveCategory({ id, name, description });
      if (!updatedMock) {
        return NextResponse.json({ error: 'Category not found' }, { status: 404 });
      }
      return NextResponse.json(updatedMock);
    }
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    return NextResponse.json({ error: 'Internal server error while updating category' }, { status: 500 });
  }
}

// DELETE: Eliminar una categoría (Solo Administrador)
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized. Admin permissions required.' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Category ID is required' }, { status: 400 });
    }

    try {
      const deleted = await prismaDb.category.delete({
        where: { id }
      });
      return NextResponse.json({ success: true, deleted });
    } catch (dbError) {
      console.warn('PostgreSQL offline al eliminar categoría. Usando memoria...', dbError);
      const success = mockDb.deleteCategory(id);
      if (!success) {
        return NextResponse.json({ error: 'Category not found in memory' }, { status: 404 });
      }
      return NextResponse.json({ success: true, id });
    }
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    return NextResponse.json({ error: 'Internal server error while deleting category' }, { status: 500 });
  }
}
