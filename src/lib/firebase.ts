import { initializeApp, getApps } from 'firebase/app';
import { getStorage } from 'firebase/storage';
import { db } from './db';

export async function getFirebaseStorage() {
  const apps = getApps();
  if (apps.length > 0) {
    return getStorage(apps[0]);
  }

  // Get config from DB SystemSetting table
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
