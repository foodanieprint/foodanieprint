import { NextResponse } from 'next/server';
import { getFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { promises as fs } from 'fs';
import path from 'path';

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Validate file type: images or pdf
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(file.type) && !file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Uploaded file must be an image (JPG, PNG) or PDF' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Generate a unique filename using timestamp and safe characters
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeName}`;

    let downloadUrl = '';
    
    // Try uploading to Firebase, fallback to local file system if it fails or is unconfigured
    try {
      const storage = await getFirebaseStorage();
      const storageRef = ref(storage, `uploads/${uniqueFilename}`);
      
      await uploadBytes(storageRef, buffer, {
        contentType: file.type,
      });

      downloadUrl = await getDownloadURL(storageRef);
    } catch (configError: any) {
      console.warn('Firebase storage failed or not configured, falling back to local storage:', configError.message);
      
      const uploadDir = path.join(process.cwd(), 'public', 'uploads');
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, uniqueFilename);
      await fs.writeFile(filePath, buffer);
      
      downloadUrl = `/uploads/${uniqueFilename}`;
    }

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('Error during file upload:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}

