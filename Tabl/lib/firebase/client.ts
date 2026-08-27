import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import config from '@/firebase-applet-config.json';

let clientApp: FirebaseApp | null = null;
let clientDb: Firestore | null = null;

export function getFirebaseClientApp(): FirebaseApp {
  if (!clientApp) {
    if (getApps().length > 0) {
      clientApp = getApp();
    } else {
      clientApp = initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId,
      });
    }
  }
  return clientApp;
}

export function getFirebaseClientDb(): Firestore {
  if (!clientDb) {
    const app = getFirebaseClientApp();
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
      clientDb = getFirestore(app, config.firestoreDatabaseId);
    } else {
      clientDb = getFirestore(app);
    }
  }
  return clientDb;
}
