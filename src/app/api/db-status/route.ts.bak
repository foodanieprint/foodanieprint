import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

const prisma = db as any;

export async function GET() {
  const dbUrl = process.env.DATABASE_URL || 'Not defined';
  // Mask password for safety
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ':******@');

  try {
    // Attempt a simple query to verify connection
    await prisma.$queryRaw`SELECT 1`;
    
    // Count records
    const productCount = await prisma.product.count();
    const userCount = await prisma.user.count();
    const optionCount = await prisma.globalOption.count();

    return NextResponse.json({
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
    console.error('Database diagnostic connection error:', error);
    return NextResponse.json({
      status: 'error',
      database: 'PostgreSQL',
      maskedUrl,
      error: error.message || 'Unknown database connection error',
      code: error.code || null,
      meta: error.meta || null
    }, { status: 500 });
  }
}
