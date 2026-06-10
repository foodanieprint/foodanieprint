import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

export const templatesRouter = Router();

// GET templates (optionally filtered by productId and specs)
templatesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = req.query.id as string;
    const productId = req.query.productId as string;
    const specsStr = req.query.specs as string;

    if (id) {
      const template = await db.template.findUnique({
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
      return res.json(template);
    }

    const whereClause = productId ? { productId } : {};

    let templates = await db.template.findMany({
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
        if (querySpecs && typeof querySpecs === 'object') {
          templates = (templates as any[]).filter(tpl => {
            if (!tpl.targetSpecs) return true;
            const target = typeof tpl.targetSpecs === 'string' ? JSON.parse(tpl.targetSpecs) : tpl.targetSpecs;
            if (!target) return true;
            return Object.entries(target).every(([key, val]) => {
              if (querySpecs[key] === undefined) return true;
              return String(querySpecs[key]).toLowerCase() === String(val).toLowerCase();
            });
          });
        }
      } catch (e) {
        console.error('Error parsing specs query param:', e);
      }
    }

    return res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Error fetching templates' });
  }
});

// POST template (Admin Only)
templatesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id, productId, name, canvasData, previewUrl, targetSpecs } = req.body;

    if (id) {
      const updatedTemplate = await db.template.update({
        where: { id },
        data: {
          name,
          canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
          previewUrl: previewUrl || undefined,
          targetSpecs: targetSpecs ? (typeof targetSpecs === 'string' ? JSON.parse(targetSpecs) : targetSpecs) : undefined,
        } as any,
      });
      return res.status(200).json(updatedTemplate);
    }

    if (!productId || !name || !canvasData) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const newTemplate = await db.template.create({
      data: {
        productId,
        name,
        canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
        previewUrl: previewUrl || 'https://images.unsplash.com/photo-1561070791-26c113006238?auto=format&fit=crop&q=80&w=400',
        targetSpecs: targetSpecs ? (typeof targetSpecs === 'string' ? JSON.parse(targetSpecs) : targetSpecs) : null,
      } as any,
    });

    return res.status(201).json(newTemplate);
  } catch (error) {
    console.error('Error creating template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// DELETE template (Admin Only)
templatesRouter.delete('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: 'Missing template ID' });
    }

    await db.template.delete({
      where: { id },
    });

    return res.json({ success: true, message: 'Template deleted' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});
