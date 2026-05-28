import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const configSetting = await db.systemSetting.findUnique({
      where: { key: 'FIREBASE_CONFIG' }
    });

    if (!configSetting) {
      return NextResponse.json({ config: null });
    }

    return NextResponse.json({ config: JSON.parse(configSetting.value) });
  } catch (error) {
    console.error('Error fetching settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { config } = await req.json();

    if (!config) {
      return NextResponse.json({ error: 'Missing configuration object' }, { status: 400 });
    }

    const updatedSetting = await db.systemSetting.upsert({
      where: { key: 'FIREBASE_CONFIG' },
      update: { value: JSON.stringify(config) },
      create: { key: 'FIREBASE_CONFIG', value: JSON.stringify(config) },
    });

    return NextResponse.json({ success: true, updatedSetting });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
