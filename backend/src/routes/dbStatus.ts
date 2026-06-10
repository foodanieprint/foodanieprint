import { Router, Response } from 'express';
import { db } from '../db.js';
import { AuthenticatedRequest } from '../auth.js';

export const dbStatusRouter = Router();

dbStatusRouter.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const dbUrl = process.env.DATABASE_URL || 'Not defined';
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':******@');

  try {
    await db.$queryRaw`SELECT 1`;
    
    const productCount = await db.product.count();
    const userCount = await db.user.count();
    const optionCount = await db.globalOption.count();

    return res.json({
      status: 'connected',
      database: 'PostgreSQL',
      maskedUrl,
      counts: {
        products: productCount,
        users: userCount,
        options: optionCount
      }
    });
  } catch (error: any) {
    console.error('Database connection error:', error);
    return res.status(500).json({
      status: 'error',
      database: 'PostgreSQL',
      maskedUrl,
      error: error.message || 'Unknown database connection error',
      code: error.code || null,
      meta: error.meta || null
    });
  }
});
