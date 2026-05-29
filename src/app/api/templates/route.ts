import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET: Obtener templates (opcionalmente filtrado por productId y specs de variante)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const productId = searchParams.get('productId');
    const specsStr = searchParams.get('specs');

    if (id) {
      const template = await (db as any).template.findUnique({
        where: { id },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
            }
          }
        }
      });
      return NextResponse.json(template);
    }

    const whereClause = productId ? { productId } : {};

    let templates = await (db as any).template.findMany({
      where: whereClause,
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

    if (specsStr) {
      try {
        const querySpecs = JSON.parse(specsStr);
        templates = (templates as any[]).filter(tpl => {
          if (!tpl.targetSpecs) return true; // Si la plantilla no tiene specs objetivo, es compatible con todo
          const target = typeof tpl.targetSpecs === 'string' ? JSON.parse(tpl.targetSpecs) : tpl.targetSpecs;
          // Verificar si todas las especificaciones de target coinciden con querySpecs
          return Object.entries(target).every(([key, val]) => {
            if (querySpecs[key] === undefined) return true;
            return String(querySpecs[key]).toLowerCase() === String(val).toLowerCase();
          });
        });
      } catch (e) {
        console.error('Error parsing specs query param:', e);
      }
    }

    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json({ error: 'Error fetching templates' }, { status: 500 });
  }
}

// POST: Crear un nuevo template (Admin únicamente)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id, productId, name, canvasData, previewUrl, targetSpecs } = await req.json();

    if (id) {
      const updatedTemplate = await (db as any).template.update({
        where: { id },
        data: {
          name,
          canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
          previewUrl: previewUrl || undefined,
          targetSpecs: targetSpecs ? (typeof targetSpecs === 'string' ? JSON.parse(targetSpecs) : targetSpecs) : undefined,
        } as any,
      });
      return NextResponse.json(updatedTemplate, { status: 200 });
    }

    if (!productId || !name || !canvasData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const newTemplate = await (db as any).template.create({
      data: {
        productId,
        name,
        canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
        previewUrl: previewUrl || 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
        targetSpecs: targetSpecs ? (typeof targetSpecs === 'string' ? JSON.parse(targetSpecs) : targetSpecs) : null,
      } as any,
    });

    return NextResponse.json(newTemplate, { status: 201 });
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

// DELETE: Eliminar un template (Admin únicamente)
export async function DELETE(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing template ID' }, { status: 400 });
    }

    await (db as any).template.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
