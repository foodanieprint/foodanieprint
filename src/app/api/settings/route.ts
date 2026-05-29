import { NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
  try {
    const firebaseSetting = await db.systemSetting.findUnique({
      where: { key: 'FIREBASE_CONFIG' }
    });

    const designerSetting = await db.systemSetting.findUnique({
      where: { key: 'DESIGNER_CONFIG' }
    });

    const firebase = firebaseSetting ? JSON.parse(firebaseSetting.value) : null;
    const designer = designerSetting ? JSON.parse(designerSetting.value) : { bleed: 0.25, dpi: 300 };

    return NextResponse.json({ firebase, designer });
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

    const { firebase, designer } = await req.json();

    if (firebase) {
      await db.systemSetting.upsert({
        where: { key: 'FIREBASE_CONFIG' },
        update: { value: JSON.stringify(firebase) },
        create: { key: 'FIREBASE_CONFIG', value: JSON.stringify(firebase) },
      });
    }

    if (designer) {
      await db.systemSetting.upsert({
        where: { key: 'DESIGNER_CONFIG' },
        update: { value: JSON.stringify(designer) },
        create: { key: 'DESIGNER_CONFIG', value: JSON.stringify(designer) },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error saving settings:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
