// src/lib/firebase-admin.ts (Server-side only)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin only once
if (!getApps().length) {
  const serviceAccount = process.env.FIREBASE_ADMIN_SDK_KEY 
    ? JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY)
    : {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      };

  initializeApp({
    credential: cert(serviceAccount),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();