import { NextResponse } from 'next/server';
import { getFirebaseStorage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

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

    // Generate a unique filename using timestamp and safe characters
    const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueFilename = `${Date.now()}-${safeName}`;

    // Get Firebase Storage dynamically
    let storage;
    try {
      storage = await getFirebaseStorage();
    } catch (configError: any) {
      return NextResponse.json({ error: configError.message }, { status: 400 });
    }

    // Create Firebase Storage reference
    const storageRef = ref(storage, `uploads/${uniqueFilename}`);

    // Upload buffer to Firebase Storage
    await uploadBytes(storageRef, buffer, {
      contentType: file.type,
    });

    // Get the public download URL
    const downloadUrl = await getDownloadURL(storageRef);

    return NextResponse.json({ url: downloadUrl });
  } catch (error) {
    console.error('Error during file upload to Firebase Storage:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
