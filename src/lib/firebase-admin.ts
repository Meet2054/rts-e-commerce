// src/lib/firebase-admin.ts (Server-side only)
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';

// Initialize Firebase Admin only once
if (!getApps().length) {
  let serviceAccount;

  if (process.env.FIREBASE_ADMIN_SDK_KEY) {
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SDK_KEY);
      console.log('Using FIREBASE_ADMIN_SDK_KEY');
    } catch (error) {
      console.error('Error parsing FIREBASE_ADMIN_SDK_KEY:', error);
      throw new Error('Invalid FIREBASE_ADMIN_SDK_KEY format');
    }
  } else {
    // Construct from individual environment variables
    console.log('Using individual environment variables');
    
    const privateKey = process.env.FIREBASE_PRIVATE_KEY;
    console.log('Private key exists:', !!privateKey);
    console.log('Private key starts with BEGIN:', privateKey?.startsWith('-----BEGIN'));
    console.log('Private key first 50 chars:', privateKey?.substring(0, 50));
    
    serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
      private_key: privateKey?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
      client_id: process.env.FIREBASE_CLIENT_ID,
      auth_uri: 'https://accounts.google.com/o/oauth2/auth',
      token_uri: 'https://oauth2.googleapis.com/token',
      auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
      client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${encodeURIComponent(process.env.FIREBASE_CLIENT_EMAIL || '')}`,
      universe_domain: 'googleapis.com'
    };
  }

  // Validate required fields
  console.log('Service account validation:');
  console.log('- project_id:', !!serviceAccount.project_id);
  console.log('- private_key exists:', !!serviceAccount.private_key);
  console.log('- client_email:', !!serviceAccount.client_email);
  console.log('- private_key length:', serviceAccount.private_key?.length);
  
  if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
    throw new Error('Missing required Firebase Admin configuration');
  }

  // Additional private key debugging
  const privateKey = serviceAccount.private_key;
  console.log('Final private key check:');
  console.log('- Starts with BEGIN:', privateKey.startsWith('-----BEGIN PRIVATE KEY-----'));
  console.log('- Ends with END:', privateKey.endsWith('-----END PRIVATE KEY-----'));
  console.log('- Contains newlines:', privateKey.includes('\n'));
  console.log('- Key snippet:', privateKey.substring(0, 100) + '...');

  try {
    initializeApp({
      credential: cert(serviceAccount),
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
export const adminStorage = getStorage();