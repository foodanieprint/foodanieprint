import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { mockDb } from '@/lib/mockData';

// GET: Obtener órdenes (Todos los pedidos para Admin, historial propio para Cliente)
export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'No autorizado. Debe iniciar sesión.' }, { status: 401 });
    }

    let orders;

    try {
      if (user.role === 'ADMIN') {
        orders = await db.order.findMany({
          include: {
            user: {
              select: {
                name: true,
                email: true,
              },
            },
            items: {
              include: {
                product: true,
                customDesign: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      } else {
        orders = await db.order.findMany({
          where: { userId: user.id },
          include: {
            items: {
              include: {
                product: true,
                customDesign: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        });
      }
    } catch (dbError) {
      console.warn('PostgreSQL offline. Cargando historial de pedidos desde mock local...', dbError);
      orders = mockDb.getOrders(user.id, user.role === 'ADMIN');
    }

    return NextResponse.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json({ error: 'Error del servidor al obtener pedidos' }, { status: 500 });
  }
}

// POST: Crear un nuevo pedido (Checkout)
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const {
      shippingName,
      shippingAddress,
      shippingCity,
      shippingZip,
      shippingPhone,
      items, // Array de { productId, customDesignId, quantity, selectedSpecs, unitPrice }
    } = await req.json();

    if (!shippingName || !shippingAddress || !shippingCity || !shippingZip || !shippingPhone || !items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Faltan campos obligatorios para el envío o el carrito' }, { status: 400 });
    }

    // Calcular el total
    let calculatedTotal = 0;
    for (const item of items) {
      calculatedTotal += parseFloat(item.unitPrice) * parseInt(item.quantity);
    }

    let order;

    try {
      // Crear la orden en una transacción de Prisma
      order = await db.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId: user ? user.id : null,
            status: 'PAID', // En una simulación, asumimos que el pago fue procesado con éxito
            totalAmount: calculatedTotal,
            shippingName,
            shippingAddress,
            shippingCity,
            shippingZip,
            shippingPhone,
          },
        });

        // Crear los ítems de la orden
        const itemsData = items.map((item: any) => ({
          orderId: newOrder.id,
          productId: item.productId,
          customDesignId: item.customDesignId,
          quantity: parseInt(item.quantity),
          selectedSpecs: typeof item.selectedSpecs === 'string' ? JSON.parse(item.selectedSpecs) : item.selectedSpecs,
          unitPrice: parseFloat(item.unitPrice),
        }));

        await tx.orderItem.createMany({
          data: itemsData,
        });

        return tx.order.findUnique({
          where: { id: newOrder.id },
          include: {
            items: {
              include: {
                product: true,
                customDesign: true,
              },
            },
          },
        });
      });
    } catch (dbError) {
      console.warn('PostgreSQL offline. Procesando y guardando compra en mock local...', dbError);
      order = mockDb.createOrder({
        userId: user ? user.id : null,
        totalAmount: calculatedTotal,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingZip,
        shippingPhone,
        items
      });
    }

    return NextResponse.json({
      success: true,
      orderId: order?.id,
      order,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error al crear pedido:', error);
    return NextResponse.json({ error: 'Error interno del servidor al procesar el pedido' }, { status: 500 });
  }
}

// PATCH: Actualizar estado de orden (Solo Administrador)
export async function PATCH(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
    }

    const { id, status } = await req.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'Faltan campos obligatorios' }, { status: 400 });
    }

    let updatedOrder;

    try {
      updatedOrder = await db.order.update({
        where: { id },
        data: { status },
      });
    } catch (dbError) {
      console.warn('PostgreSQL offline. Actualizando estado de pedido en mock local...', dbError);
      updatedOrder = mockDb.updateOrderStatus(id, status);
    }

    return NextResponse.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return NextResponse.json({ error: 'Error del servidor al actualizar estado' }, { status: 500 });
  }
}
