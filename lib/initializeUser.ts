import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from './db';

export async function initializeUser() {
  const userId = 'u_global_01'; 
  const userRef = doc(db, 'users', userId);
  
  try {
    // Check if user exists
    const userSnap = await getDoc(userRef);
    
    if (!userSnap.exists()) {
      // Create user document
      const userData = {
        id: userId,
        name: 'Super Admin',
        email: 'admin@inala.holdings',
        role: 'SUPER_ADMIN',
        tenantId: 'global',
        selectedTenant: 'inala-butchery',
        tenantAccess: ['inala-butchery'],
        createdAt: new Date().toISOString(),
        status: 'active',
        isActive: true,
        avatarUrl: 'https://ui-avatars.com/api/?name=SA&background=0f172a&color=fff'
      };
      
      await setDoc(userRef, userData);
      console.log('✅ User document created:', userData);
      return userData;
    }
    
    return userSnap.data();
  } catch (error) {
    console.error("Error initializing user:", error);
    return null;
  }
}