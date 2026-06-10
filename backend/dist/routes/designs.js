import { Router } from 'express';
import { db } from '../db.js';
import { mockDb } from '../mockData.js';
export const designsRouter = Router();
// GET: Fetch saved designs of the authenticated user
designsRouter.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'No autorizado. Debe iniciar sesión.' });
        }
        let designs;
        try {
            designs = await db.customDesign.findMany({
                where: { userId: req.user.id },
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
        }
        catch (dbError) {
            console.warn('PostgreSQL offline. Obteniendo diseños guardados desde mock local...', dbError);
            designs = mockDb.getDesigns(req.user.id);
        }
        return res.json(designs);
    }
    catch (error) {
        console.error('Error al obtener diseños:', error);
        return res.status(500).json({ error: 'Error del servidor al obtener diseños' });
    }
});
// POST: Save or update custom design
designsRouter.post('/', async (req, res) => {
    try {
        const { id, productId, name, canvasData, previewUrl } = req.body;
        if (!productId || !canvasData) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }
        let resultDesign;
        try {
            if (id) {
                const existingDesign = await db.customDesign.findUnique({
                    where: { id },
                });
                if (!existingDesign) {
                    return res.status(404).json({ error: 'Diseño no encontrado' });
                }
                if (existingDesign.userId && (!req.user || existingDesign.userId !== req.user.id)) {
                    return res.status(403).json({ error: 'No autorizado para editar este diseño' });
                }
                resultDesign = await db.customDesign.update({
                    where: { id },
                    data: {
                        name: name || existingDesign.name,
                        canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
                        previewUrl: previewUrl !== undefined ? previewUrl : existingDesign.previewUrl,
                    },
                });
            }
            else {
                resultDesign = await db.customDesign.create({
                    data: {
                        productId,
                        userId: req.user ? req.user.id : null,
                        name: name || 'Mi Diseño Personalizado',
                        canvasData: typeof canvasData === 'string' ? JSON.parse(canvasData) : canvasData,
                        previewUrl: previewUrl || '',
                    },
                });
            }
        }
        catch (dbError) {
            console.warn('PostgreSQL offline. Guardando / actualizando diseño en mock local...', dbError);
            resultDesign = mockDb.saveDesign({
                id,
                productId,
                userId: req.user ? req.user.id : null,
                name,
                canvasData,
                previewUrl
            });
        }
        return res.status(201).json(resultDesign);
    }
    catch (error) {
        console.error('Error al guardar diseño:', error);
        return res.status(500).json({ error: 'Error interno al guardar el diseño' });
    }
});
