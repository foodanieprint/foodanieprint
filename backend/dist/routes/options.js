import { Router } from 'express';
import { db } from '../db.js';
import { mockDb } from '../mockData.js';
export const optionsRouter = Router();
// GET all global options alongside their attributes
optionsRouter.get('/', async (req, res) => {
    try {
        const options = await db.globalOption.findMany({
            include: { attributes: true },
            orderBy: { createdAt: 'desc' }
        });
        return res.json(options);
    }
    catch (err) {
        console.warn("PostgreSQL offline or GlobalOption schema not loaded. Falling back to resilient in-memory options mock store.");
        const mockOptions = mockDb.getGlobalOptions();
        return res.json(mockOptions);
    }
});
// POST: Create a new custom option with attributes
optionsRouter.post('/', async (req, res) => {
    try {
        const { name, description, attributes, categoryId, categoryIds } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'Option name is required' });
        }
        try {
            const option = await db.globalOption.create({
                data: {
                    name,
                    description: description || '',
                    categoryId: categoryId || null,
                    categoryIds: categoryIds || null,
                    attributes: {
                        create: (attributes || []).map((attr) => ({
                            value: attr.value,
                            metric: attr.metric || '',
                            priceMarkup: parseFloat(attr.priceMarkup || '0'),
                            markupType: attr.markupType || 'FLAT',
                            isBasePrice: attr.isBasePrice ?? false,
                            imageUrl: attr.imageUrl || null,
                            horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
                            vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
                        }))
                    }
                },
                include: { attributes: true }
            });
            return res.json(option);
        }
        catch (err) {
            console.warn("PostgreSQL write failed, falling back to mock save.");
            const mockOption = mockDb.saveGlobalOption({ name, description, attributes, categoryId, categoryIds });
            return res.json(mockOption);
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// PUT: Edit existing option/attributes
optionsRouter.put('/', async (req, res) => {
    try {
        const { id, name, description, attributes, categoryId, categoryIds } = req.body;
        if (!id || !name) {
            return res.status(400).json({ error: 'Option ID and name are required' });
        }
        try {
            await db.globalAttribute.deleteMany({
                where: { optionId: id }
            });
            const option = await db.globalOption.update({
                where: { id },
                data: {
                    name,
                    description: description || '',
                    categoryId: categoryId || null,
                    categoryIds: categoryIds || null,
                    attributes: {
                        create: (attributes || []).map((attr) => ({
                            value: attr.value,
                            metric: attr.metric || '',
                            priceMarkup: parseFloat(attr.priceMarkup || '0'),
                            markupType: attr.markupType || 'FLAT',
                            isBasePrice: attr.isBasePrice ?? false,
                            imageUrl: attr.imageUrl || null,
                            horizontal: typeof attr.horizontal === 'number' ? attr.horizontal : (parseFloat(attr.horizontal) || 0),
                            vertical: typeof attr.vertical === 'number' ? attr.vertical : (parseFloat(attr.vertical) || 0),
                        }))
                    }
                },
                include: { attributes: true }
            });
            return res.json(option);
        }
        catch (err) {
            console.warn("PostgreSQL update failed, falling back to mock update.");
            const mockOption = mockDb.saveGlobalOption({ id, name, description, attributes, categoryId, categoryIds });
            return res.json(mockOption);
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
// DELETE: Cascade delete custom option
optionsRouter.delete('/', async (req, res) => {
    try {
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: 'Option ID is required' });
        }
        try {
            await db.globalOption.delete({
                where: { id }
            });
            return res.json({ success: true });
        }
        catch (err) {
            console.warn("PostgreSQL delete failed, falling back to mock delete.");
            const deleted = mockDb.deleteGlobalOption(id);
            if (deleted) {
                return res.json({ success: true });
            }
            else {
                return res.status(404).json({ error: 'Option not found in mock store' });
            }
        }
    }
    catch (err) {
        return res.status(500).json({ error: err.message });
    }
});
