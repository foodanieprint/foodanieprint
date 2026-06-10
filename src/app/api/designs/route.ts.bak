import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mockDb } from '@/lib/mockData';

// GET: Obtener diseños guardados del usuario actual
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 });
    }

    let designs;

    try {
      designs = await db.customDesign.findMany({
        where: { userId: user.id },
        include: {
          product: {
            select: {
              name: true,
              slug: true,
              thumbnail: true,
            },
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    } catch (dbError) {
      console.warn('PostgreSQL offline. Obteniendo diseños guardados desde mock local...', dbError);
      designs = mockDb.getDesigns(user.id);
    }

    return NextResponse.json(designs);
  } catch (error) {
    console.error('Error al obtener diseños:', error);
    return NextResponse.json({ error: 'Error del servidor al obtener diseños' }, { status: 500 });
  }
}

// POST: Crear o actualizar un diseño personalizado
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    
    // Permitimos guardar diseños como invitado si es necesario, pero guardamos bajo el usuario si está logueado
    const { id, productId, name, canvasData, previewUrl } = await req.json();

    if (!productId || !canvasData) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let resultDesign;

    try {
      // Si se provee un ID, intentamos actualizar
      if (id) {
        // Si el diseño pertenece a un usuario, validar que sea el propietario
        const existingDesign = await db.customDesign.findUnique({
          where: { id },
        });

        if (!existingDesign) {
          return NextResponse.json({ error: 'Diseño no encontrado' }, { status: 404 });
        }

        if (existingDesign.userId && (!user || existingDesign.userId !== user.id)) {
          return NextResponse.json({ error: 'No autorizado para editar este diseño' }, { status: 403 });
        }

        resultDesign = await db.customDesign.update({
          where: { id },
          data: {
            name: name || existingDesign.name,
            canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
            previewUrl: previewUrl !== undefined ? previewUrl : existingDesign.previewUrl,
          },
        });
      } else {
        // Crear un nuevo diseño
        resultDesign = await db.customDesign.create({
          data: {
            productId,
            userId: user ? user.id : null,
            name: name || 'Mi Diseño Personalizado',
            canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
            previewUrl: previewUrl || '',
          },
        });
      }
    } catch (dbError) {
      console.warn('PostgreSQL offline. Guardando / actualizando diseño en mock local...', dbError);
      resultDesign = mockDb.saveDesign({
        id,
        productId,
        userId: user ? user.id : null,
        name,
        canvasData,
        previewUrl
      });
    }

    return NextResponse.json(resultDesign, { status: 201 });
  } catch (error: any) {
    console.error('Error al guardar diseño:', error);
    return NextResponse.json({ error: 'Error interno al guardar el diseño' }, { status: 500 });
  }
}
