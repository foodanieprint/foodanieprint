import { Router } from 'express';
import multer from 'multer';
import { initializeApp, getApps } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { promises as fs } from 'fs';
import path from 'path';
import { db } from '../db.js';
export const uploadRouter = Router();
// Setup multer memory storage (stores file buffer in memory)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // limit to 50MB
    }
});
// Dynamic Firebase storage helper
async function getFirebaseStorage() {
    const apps = getApps();
    if (apps.length > 0) {
        return getStorage(apps[0]);
    }
    const configSetting = await db.systemSetting.findUnique({
        where: { key: 'FIREBASE_CONFIG' }
    });
    if (!configSetting) {
        throw new Error('Firebase Storage is not configured. Please add the Firebase credentials under General Settings in the Admin Panel.');
    }
    const config = JSON.parse(configSetting.value);
    if (!config.apiKey || !config.storageBucket) {
        throw new Error('Firebase configuration in settings is incomplete.');
    }
    const app = initializeApp(config);
    return getStorage(app);
}
// POST upload
uploadRouter.post('/', upload.single('file'), async (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
        if (!allowedTypes.includes(file.mimetype) && !file.mimetype.startsWith('image/')) {
            return res.status(400).json({ error: 'Uploaded file must be an image (JPG, PNG) or PDF' });
        }
        const safeName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const uniqueFilename = `${Date.now()}-${safeName}`;
        let downloadUrl = '';
        try {
            const storage = await getFirebaseStorage();
            const storageRef = ref(storage, `uploads/${uniqueFilename}`);
            await uploadBytes(storageRef, file.buffer, {
                contentType: file.mimetype,
            });
            downloadUrl = await getDownloadURL(storageRef);
        }
        catch (configError) {
            console.warn('Firebase storage failed or not configured, falling back to local storage:', configError.message);
            const uploadDir = path.join(process.cwd(), 'uploads');
            await fs.mkdir(uploadDir, { recursive: true });
            const filePath = path.join(uploadDir, uniqueFilename);
            await fs.writeFile(filePath, file.buffer);
            const host = req.get('host') || 'localhost:5000';
            const isHttps = req.protocol === 'https' || req.headers['x-forwarded-proto'] === 'https';
            const protocol = isHttps ? 'https' : 'http';
            downloadUrl = `${protocol}://${host}/uploads/${uniqueFilename}`;
        }
        return res.json({ url: downloadUrl });
    }
    catch (error) {
        console.error('Error during file upload:', error);
        return res.status(500).json({ error: 'Upload failed' });
    }
});
