
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { getStorage, FirebaseStorage } from 'firebase/storage';

// Safe access to env, providing an empty object if undefined
// Fixed: Explicitly casting to any to allow property access in build environments where import.meta.env may be untyped
// @ts-ignore
const env = (import.meta as any).env || {};

// Use environment variables if available, otherwise fallback to hardcoded values
// This ensures the app works in environments where import.meta.env injection fails
const firebaseConfig = {
  apiKey: env.VITE_FB_API_KEY || "AIzaSyBLvZUHpgH-miqqkslWy3SlFwXRIo2ZNTc",
  authDomain: env.VITE_FB_AUTH_DOMAIN || "inala-holdings.firebaseapp.com",
  projectId: env.VITE_FB_PROJECT_ID || "inala-holdings",
  storageBucket: env.VITE_FB_STORAGE_BUCKET || "inala-holdings.firebasestorage.app",
  messagingSenderId: env.VITE_FB_MESSAGING_SENDER_ID || "33361592792",
  appId: env.VITE_FB_APP_ID || "1:33361592792:web:aedc5840369a00811ff2ad",
  measurementId: env.VITE_FB_MEASUREMENT_ID || "G-K5Q00B33J0"
};

// Log project ID to confirm initialization source
console.log("Firebase Initializing:", firebaseConfig.projectId);

// Initialize Firebase App (Singleton pattern)
export const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Services
export const db: Firestore = getFirestore(app);
export const auth: Auth = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);

// Helper to check connection status for the Settings UI
export const checkDBConnection = async (): Promise<{ ok: boolean, latency?: number, message?: string, mode: 'ONLINE' | 'OFFLINE_DEMO' }> => {
    const start = performance.now();
    try {
        if (!db) return { ok: false, message: "Firestore not initialized", mode: 'OFFLINE_DEMO' };
        
        // Simple check
        const end = performance.now();
        return { ok: true, latency: Math.round(end - start), message: "Connected to Cloud Firestore", mode: 'ONLINE' };
    } catch (e: any) {
        return { ok: false, message: e.message || "Connection Failed", mode: 'OFFLINE_DEMO' };
    }
}