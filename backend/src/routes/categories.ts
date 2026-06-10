import { Router, Response } from 'express';
import { db } from '../db.js';
import { mockDb } from '../mockData.js';
import { AuthenticatedRequest } from '../auth.js';

export const categoriesRouter = Router();

// GET: Fetch all categories
categoriesRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const categories = await db.category.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return res.json(categories);
  } catch (error) {
    console.warn('PostgreSQL offline o esquema Category no cargado. Cargando categorías mock...', error);
    return res.json(mockDb.getCategories());
  }
});

// POST: Create a category (Admin Only)
categoriesRouter.post('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
    }

    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const existing = await db.category.findUnique({
        where: { slug }
      });

      if (existing) {
        return res.status(409).json({ error: 'A category with a similar name already exists' });
      }

      const category = await db.category.create({
        data: {
          name,
          slug,
          description: description || ''
        }
      });

      return res.status(201).json(category);
    } catch (dbError) {
      console.warn('PostgreSQL offline al crear categoría. Usando memoria...', dbError);
      const newMock = mockDb.saveCategory({ name, description });
      return res.status(201).json(newMock);
    }
  } catch (error: any) {
    console.error('Error al crear categoría:', error);
    return res.status(500).json({ error: 'Internal server error while creating category' });
  }
});

// PUT: Update an existing category (Admin Only)
categoriesRouter.put('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
    }

    const { id, name, description } = req.body;

    if (!id || !name) {
      return res.status(400).json({ error: 'Category ID and name are required' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    try {
      const category = await db.category.update({
        where: { id },
        data: {
          name,
          slug,
          description: description || ''
        }
      });

      return res.json(category);
    } catch (dbError) {
      console.warn('PostgreSQL offline al actualizar categoría. Usando memoria...', dbError);
      const updatedMock = mockDb.saveCategory({ id, name, description });
      if (!updatedMock) {
        return res.status(404).json({ error: 'Category not found' });
      }
      return res.json(updatedMock);
    }
  } catch (error: any) {
    console.error('Error al actualizar categoría:', error);
    return res.status(500).json({ error: 'Internal server error while updating category' });
  }
});

// DELETE: Delete a category (Admin Only)
categoriesRouter.delete('/', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
    }

    const id = req.query.id as string;

    if (!id) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    try {
      const deleted = await db.category.delete({
        where: { id }
      });
      return res.json({ success: true, deleted });
    } catch (dbError) {
      console.warn('PostgreSQL offline al eliminar categoría. Usando memoria...', dbError);
      const success = mockDb.deleteCategory(id);
      if (!success) {
        return res.status(404).json({ error: 'Category not found in memory' });
      }
      return res.json({ success: true, id });
    }
  } catch (error: any) {
    console.error('Error al eliminar categoría:', error);
    return res.status(500).json({ error: 'Internal server error while deleting category' });
  }
});
