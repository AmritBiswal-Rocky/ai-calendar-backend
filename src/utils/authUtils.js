// src/utils/authUtils.js
import { auth } from '@/lib/firebase';

/**
 * Get the current user's Firebase firebase_uid
 * @returns {Promise<string|null>} The current user's firebase_uid or null if not authenticated
 * @throws {Error} If there's an error getting the firebase_uid
 */
export const getCurrentUserUID = async () => {
  try {
    // Wait for auth to be ready (handles the initial auth state loading)
    await auth.authStateReady();
    
    const currentUser = auth.currentUser;
    
    if (!currentUser) {
      console.warn('No user is currently logged in');
      return null;
    }
    
    return currentUser.firebase_uid;
  } catch (error) {
    console.error('Error getting current user firebase_uid:', error);
    throw new Error('Failed to get current user firebase_uid');
  }
};

/**
 * Get the current user's ID token
 * @param {boolean} forceRefresh - Whether to force refresh the token
 * @returns {Promise<string|null>} The current user's ID token or null if not authenticated
 */
export const getCurrentUserToken = async (forceRefresh = false) => {
  try {
    await auth.authStateReady();
    
    if (!auth.currentUser) {
      return null;
    }
    
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch (error) {
    console.error('Error getting user token:', error);
    throw new Error('Failed to get user token');
  }
};
