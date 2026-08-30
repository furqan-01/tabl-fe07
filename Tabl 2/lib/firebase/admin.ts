import { App, getApps, initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

export function getFirebaseAdminApp(): App | null {
  if (adminApp) {
    return adminApp;
  }

  const existingApps = getApps();
  if (existingApps.length > 0) {
    adminApp = existingApps[0]!;
    return adminApp;
  }

  try {
    // 1. Check for complete JSON service account
    if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id || process.env.FIREBASE_PROJECT_ID,
      });
      return adminApp;
    }

    // 2. Check for individual env vars
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY
      ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
      : undefined;

    if (projectId && clientEmail && privateKey) {
      adminApp = initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        projectId,
      });
      return adminApp;
    }

    // 3. Fallback: Google Cloud Application Default Credentials (ADC)
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS || process.env.GCP_PROJECT || process.env.K_SERVICE) {
      adminApp = initializeApp({
        credential: applicationDefault(),
        projectId: projectId || process.env.GCP_PROJECT,
      });
      return adminApp;
    }

    // 4. Default initialize if projectId is present
    if (projectId) {
      adminApp = initializeApp({
        projectId,
      });
      return adminApp;
    }

    console.warn(
      '[Firebase Admin] No Firebase credentials found in environment. Using safe fallback data mode.'
    );
    return null;
  } catch (error) {
    console.error('[Firebase Admin] Initialization error:', error);
    return null;
  }
}

export function getAdminDb(): Firestore | null {
  if (adminDb) {
    return adminDb;
  }

  const app = getFirebaseAdminApp();
  if (!app) {
    return null;
  }

  try {
    adminDb = getFirestore(app);
    return adminDb;
  } catch (error) {
    console.error('[Firebase Admin] Firestore initialization error:', error);
    return null;
  }
}

export { adminDb };
