import { Router } from 'express';
import { db } from '../db.js';
import { mockDb } from '../mockData.js';
export const productsRouter = Router();
// GET: Fetch all products with their specs
productsRouter.get('/', async (req, res) => {
    try {
        const products = await db.product.findMany({
            include: {
                specs: {
                    orderBy: {
                        position: 'asc'
                    }
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        return res.json(products);
    }
    catch (error) {
        console.warn('PostgreSQL offline o credenciales no válidas. Cargando catálogo mock de respaldo...', error);
        return res.json(mockDb.getProducts());
    }
});
// GET: Fetch detailed specs for a specific product by slug
productsRouter.get('/:slug', async (req, res) => {
    const { slug } = req.params;
    let product = null;
    let globalOptions = [];
    // 1. Try PostgreSQL
    try {
        product = await db.product.findUnique({
            where: { slug },
            include: {
                specs: {
                    orderBy: {
                        position: 'asc'
                    }
                },
            },
        });
        if (product) {
            try {
                globalOptions = await db.globalOption.findMany({
                    include: { attributes: true }
                });
            }
            catch (err) {
                console.warn("PostgreSQL globalOptions query failed, utilizing mock options fallback.");
                globalOptions = mockDb.getGlobalOptions();
            }
        }
    }
    catch (error) {
        console.warn(`PostgreSQL offline. Cargando producto slug "${slug}" desde mock local...`, error);
    }
    // 2. Fallback to mock data
    if (!product) {
        const rawMock = mockDb.getProductBySlug(slug);
        if (rawMock) {
            product = JSON.parse(JSON.stringify(rawMock));
        }
        globalOptions = mockDb.getGlobalOptions();
    }
    if (!product) {
        return res.status(404).json({ error: 'Producto no encontrado' });
    }
    // 3. Serialize inherited options
    let specs = [...(product.specs || [])];
    let catOptions = [];
    if (product.categoryId) {
        catOptions = globalOptions.filter((o) => {
            if (o.categoryId === product.categoryId)
                return true;
            if (o.categoryIds) {
                const ids = Array.isArray(o.categoryIds)
                    ? o.categoryIds
                    : typeof o.categoryIds === 'string'
                        ? JSON.parse(o.categoryIds)
                        : [];
                return ids.includes(product.categoryId);
            }
            return false;
        });
        const allowedOptionNames = new Set(catOptions.map((o) => o.name));
        specs = specs.filter((s) => allowedOptionNames.has(s.group));
    }
    else {
        const optionIds = Array.isArray(product.globalOptionIds)
            ? product.globalOptionIds
            : typeof product.globalOptionIds === 'string'
                ? JSON.parse(product.globalOptionIds || '[]')
                : [];
        catOptions = globalOptions.filter((o) => optionIds.includes(o.id));
        if (catOptions.length > 0) {
            catOptions.forEach((globalOpt) => {
                if (Array.isArray(globalOpt.attributes)) {
                    globalOpt.attributes.forEach((attr, idx) => {
                        const exists = specs.some(s => s.group === globalOpt.name && s.value === attr.value);
                        if (!exists) {
                            specs.push({
                                id: attr.id || `inherited-spec-${globalOpt.id}-${idx}`,
                                productId: product.id,
                                group: globalOpt.name,
                                value: attr.value,
                                priceMarkup: attr.priceMarkup,
                                markupType: attr.markupType || 'FLAT',
                                isBasePrice: attr.isBasePrice ?? false,
                                imageUrl: attr.imageUrl || null,
                                horizontal: attr.horizontal || 0,
                                vertical: attr.vertical || 0,
                            });
                        }
                    });
                }
            });
        }
    }
    specs = specs.map((spec) => {
        const globalOpt = globalOptions.find((o) => o.name === spec.group);
        if (globalOpt && Array.isArray(globalOpt.attributes)) {
            const match = globalOpt.attributes.find((a) => a.value === spec.value);
            if (match) {
                return {
                    ...spec,
                    imageUrl: spec.imageUrl || match.imageUrl || null,
                    metric: spec.metric || match.metric || 'none',
                    horizontal: spec.horizontal || match.horizontal || 0,
                    vertical: spec.vertical || match.vertical || 0
                };
            }
        }
        return {
            ...spec,
            metric: spec.metric || 'none'
        };
    });
    specs.sort((a, b) => {
        const posA = typeof a.position === 'number' ? a.position : 0;
        const posB = typeof b.position === 'number' ? b.position : 0;
        return posA - posB;
    });
    return res.json({
        ...product,
        specs
    });
});
// POST: Create a new product (Admin Only)
productsRouter.post('/', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
        }
        const { name, description, basePrice, thumbnail, images, widthPx, heightPx, bleedMm, dpi, specs, globalOptionIds, categoryId } = req.body;
        if (!name || !description || !basePrice || !thumbnail || !widthPx || !heightPx) {
            return res.status(400).json({ error: 'Missing mandatory fields' });
        }
        const slug = name
            .toLowerCase()
            .trim()
            .replace(/[^\w\s-]/g, '')
            .replace(/[\s_-]+/g, '-')
            .replace(/^-+|-+$/g, '');
        try {
            const existingProduct = await db.product.findUnique({
                where: { slug },
            });
            if (existingProduct) {
                return res.status(409).json({ error: 'A product with a similar name already exists' });
            }
            const product = await db.$transaction(async (tx) => {
                const newProduct = await tx.product.create({
                    data: {
                        name,
                        slug,
                        description,
                        basePrice: parseFloat(basePrice),
                        thumbnail,
                        images: images || [],
                        widthPx: parseInt(widthPx),
                        heightPx: parseInt(heightPx),
                        bleedMm: parseFloat(bleedMm || '0'),
                        dpi: dpi ? parseInt(dpi) : null,
                        globalOptionIds: globalOptionIds || [],
                        categoryId: categoryId || null
                    },
                });
                if (specs && Array.isArray(specs)) {
                    const specsData = specs.map((spec, idx) => ({
                        productId: newProduct.id,
                        group: spec.group,
                        value: spec.value,
                        priceMarkup: parseFloat(spec.priceMarkup || '0'),
                        markupType: spec.markupType || 'FLAT',
                        isBasePrice: spec.isBasePrice ?? false,
                        imageUrl: spec.imageUrl || null,
                        position: typeof spec.position === 'number' ? spec.position : idx,
                        horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
                        vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
                    }));
                    await tx.productSpec.createMany({
                        data: specsData,
                    });
                }
                return tx.product.findUnique({
                    where: { id: newProduct.id },
                    include: { specs: true },
                });
            });
            return res.status(201).json(product);
        }
        catch (dbError) {
            console.warn('PostgreSQL offline al crear producto. Usando memoria...', dbError);
            const newMock = mockDb.createProduct({
                name,
                description,
                basePrice,
                thumbnail,
                images,
                widthPx,
                heightPx,
                bleedMm,
                specs,
                globalOptionIds,
                categoryId
            });
            return res.status(201).json(newMock);
        }
    }
    catch (error) {
        console.error('Error al crear producto:', error);
        return res.status(500).json({ error: 'Internal server error while creating product' });
    }
});
// PUT: Update an existing product (Admin Only)
productsRouter.put('/', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
        }
        const { id, name, description, basePrice, thumbnail, images, widthPx, heightPx, bleedMm, dpi, specs, globalOptionIds, categoryId } = req.body;
        if (!id || !name || !description || !basePrice || !thumbnail || !widthPx || !heightPx) {
            return res.status(400).json({ error: 'Missing mandatory fields' });
        }
        try {
            const existing = await db.product.findUnique({
                where: { id },
                select: { slug: true }
            });
            const slug = existing?.slug || name
                .toLowerCase()
                .trim()
                .replace(/[^\w\s-]/g, '')
                .replace(/[\s_-]+/g, '-')
                .replace(/^-+|-+$/g, '');
            await db.productSpec.deleteMany({
                where: { productId: id }
            });
            const updatedProduct = await db.product.update({
                where: { id },
                data: {
                    name,
                    slug,
                    description,
                    basePrice: parseFloat(basePrice),
                    thumbnail,
                    images: images || [],
                    widthPx: parseInt(widthPx),
                    heightPx: parseInt(heightPx),
                    bleedMm: parseFloat(bleedMm || '0'),
                    dpi: dpi ? parseInt(dpi) : null,
                    globalOptionIds: globalOptionIds || [],
                    categoryId: categoryId || null,
                    specs: {
                        createMany: {
                            data: (specs || []).map((spec, idx) => ({
                                group: spec.group,
                                value: spec.value,
                                priceMarkup: parseFloat(spec.priceMarkup || '0'),
                                markupType: spec.markupType || 'FLAT',
                                isBasePrice: spec.isBasePrice ?? false,
                                imageUrl: spec.imageUrl || null,
                                position: typeof spec.position === 'number' ? spec.position : idx,
                                horizontal: typeof spec.horizontal === 'number' ? spec.horizontal : (parseFloat(spec.horizontal) || 0),
                                vertical: typeof spec.vertical === 'number' ? spec.vertical : (parseFloat(spec.vertical) || 0),
                            }))
                        }
                    }
                },
                include: {
                    specs: true
                }
            });
            return res.json(updatedProduct);
        }
        catch (dbError) {
            console.warn('PostgreSQL offline al actualizar producto. Usando memoria...', dbError);
            const updatedMock = mockDb.updateProduct(id, {
                name,
                description,
                basePrice,
                thumbnail,
                images,
                widthPx,
                heightPx,
                bleedMm,
                specs,
                globalOptionIds,
                categoryId
            });
            if (!updatedMock) {
                return res.status(404).json({ error: 'Product not found' });
            }
            return res.json(updatedMock);
        }
    }
    catch (error) {
        console.error('Error al actualizar producto:', error);
        return res.status(500).json({ error: 'Internal server error while updating product' });
    }
});
// DELETE: Delete a product (Admin Only)
productsRouter.delete('/', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(403).json({ error: 'Unauthorized. Admin permissions required.' });
        }
        const id = req.query.id;
        if (!id) {
            return res.status(400).json({ error: 'Product ID is required' });
        }
        try {
            await db.productSpec.deleteMany({
                where: { productId: id }
            });
            const deletedProduct = await db.product.delete({
                where: { id }
            });
            return res.json({ success: true, deleted: deletedProduct });
        }
        catch (dbError) {
            console.warn('PostgreSQL offline al eliminar producto. Usando memoria...', dbError);
            const success = mockDb.deleteProduct(id);
            if (!success) {
                return res.status(404).json({ error: 'Product not found in memory' });
            }
            return res.json({ success: true, id });
        }
    }
    catch (error) {
        console.error('Error al eliminar producto:', error);
        return res.status(500).json({ error: 'Internal server error while deleting product' });
    }
});
