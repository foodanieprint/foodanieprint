import { Router, Response } from 'express';
import { db } from '../db.js';
import { mockDb } from '../mockData.js';
import { AuthenticatedRequest } from '../auth.js';

export const ordersRouter = Router();

// GET: Fetch orders list (All for Admin, history for regular Customers)
ordersRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
    }

    let orders;

    try {
      if (req.user.role === 'ADMIN') {
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
          where: { userId: req.user.id },
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
      orders = mockDb.getOrders(req.user.id, req.user.role === 'ADMIN');
    }

    return res.json(orders);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return res.status(500).json({ error: 'Error del servidor al obtener pedidos' });
  }
});

// POST: Create a new order (Checkout)
ordersRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      shippingName,
      shippingAddress,
      shippingCity,
      shippingZip,
      shippingPhone,
      items, // Array of { productId, customDesignId, quantity, selectedSpecs, unitPrice }
    } = req.body;

    if (!shippingName || !shippingAddress || !shippingCity || !shippingZip || !shippingPhone || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Faltan campos obligatorios para el envío o el carrito' });
    }

    // Calculate sum
    let calculatedTotal = 0;
    for (const item of items) {
      calculatedTotal += parseFloat(item.unitPrice) * parseInt(item.quantity);
    }

    let order: { id: string } | null = null;

    try {
      order = await db.$transaction(async (tx) => {
        const newOrder = await tx.order.create({
          data: {
            userId: req.user ? req.user.id : null,
            status: 'PAID', // In this simulation we mark as paid immediately
            totalAmount: calculatedTotal,
            shippingName,
            shippingAddress,
            shippingCity,
            shippingZip,
            shippingPhone,
          },
        });

        const itemsData = items.map((item: {
          productId: string;
          customDesignId: string;
          quantity: string | number;
          selectedSpecs: unknown;
          unitPrice: string | number;
        }) => ({
          orderId: newOrder.id,
          productId: item.productId,
          customDesignId: item.customDesignId,
          quantity: parseInt(item.quantity as string),
          selectedSpecs: typeof item.selectedSpecs === 'string' ? JSON.parse(item.selectedSpecs) : item.selectedSpecs,
          unitPrice: parseFloat(item.unitPrice as string),
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
        userId: req.user ? req.user.id : null,
        totalAmount: calculatedTotal,
        shippingName,
        shippingAddress,
        shippingCity,
        shippingZip,
        shippingPhone,
        items
      });
    }

    return res.status(201).json({
      success: true,
      orderId: order?.id,
      order,
    });
  } catch (error: unknown) {
    console.error('Error al crear pedido:', error);
    return res.status(500).json({ error: 'Error interno del servidor al procesar el pedido' });
  }
});

// PATCH: Update order status (Admin Only)
ordersRouter.patch('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'No autorizado' });
    }

    const { id, status } = req.body;

    if (!id || !status) {
      return res.status(400).json({ error: 'Faltan campos obligatorios' });
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

    return res.json(updatedOrder);
  } catch (error) {
    console.error('Error al actualizar pedido:', error);
    return res.status(500).json({ error: 'Error del servidor al actualizar estado' });
  }
});
