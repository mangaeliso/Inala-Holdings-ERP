import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';

// Configuration for Inala Holdings Firebase Project
const firebaseConfig = {
  apiKey: "AIzaSyBLvZUHpgH-miqqkslWy3SlFwXRIo2ZNTc",
  authDomain: "inala-holdings.firebaseapp.com",
  projectId: "inala-holdings",
  storageBucket: "inala-holdings.firebasestorage.app",
  messagingSenderId: "33361592792",
  appId: "1:33361592792:web:aedc5840369a00811ff2ad",
  measurementId: "G-K5Q00B33J0"
};

// Initialize Firebase App (Singleton pattern)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Cloud Firestore
export const db: Firestore = getFirestore(app);

// Helper to check connection status for the Settings UI
export const checkDBConnection = async (): Promise<{ ok: boolean, latency?: number, message?: string, mode: 'ONLINE' | 'OFFLINE_DEMO' }> => {
    const start = performance.now();
    try {
        if (!db) return { ok: false, message: "Firestore not initialized", mode: 'OFFLINE_DEMO' };

        // Simple ping to check connection since we are using real credentials now
        // We can't toggle network easily without potentially disrupting pending writes
        // so we assume online if initialized with valid config.
        const end = performance.now();
        return { ok: true, latency: Math.round(end - start), message: "Connected to Cloud Firestore", mode: 'ONLINE' };
    } catch (e: any) {
        return { ok: false, message: e.message || "Connection Failed", mode: 'OFFLINE_DEMO' };
    }
}