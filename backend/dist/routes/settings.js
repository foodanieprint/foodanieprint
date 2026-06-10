import { Router } from 'express';
import { db } from '../db.js';
export const settingsRouter = Router();
// GET settings
settingsRouter.get('/', async (req, res) => {
    try {
        const firebaseSetting = await db.systemSetting.findUnique({
            where: { key: 'FIREBASE_CONFIG' }
        });
        const designerSetting = await db.systemSetting.findUnique({
            where: { key: 'DESIGNER_CONFIG' }
        });
        const firebase = firebaseSetting ? JSON.parse(firebaseSetting.value) : null;
        const designer = designerSetting ? JSON.parse(designerSetting.value) : { bleed: 0.25, dpi: 300 };
        return res.json({ firebase, designer });
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
// POST settings (Admin Only)
settingsRouter.post('/', async (req, res) => {
    try {
        if (!req.user || req.user.role !== 'ADMIN') {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const { firebase, designer } = req.body;
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
        return res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving settings:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
});
