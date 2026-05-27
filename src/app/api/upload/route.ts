import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Basic image type validation
    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Uploaded file must be an image' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save path inside the public/uploads directory
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    
    // Ensure the directory exists
    await mkdir(uploadDir, { recursive: true });

    // Generate a unique filename using timestamp and safe characters
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeName}`;
    const filePath = join(uploadDir, uniqueFilename);

    await writeFile(filePath, buffer);
    
    // Return relative URL for Next.js static asset serving
    const relativeUrl = `/uploads/${uniqueFilename}`;
    return NextResponse.json({ url: relativeUrl });
  } catch (error) {
    console.error('Error during file upload:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
