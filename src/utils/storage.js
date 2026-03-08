const hasWindow = typeof window !== 'undefined';

const hasLocalStorage = () => hasWindow && typeof window.localStorage !== 'undefined';
const hasSessionStorage = () => hasWindow && typeof window.sessionStorage !== 'undefined';

export const safeLocalStorage = {
  getItem(key) {
    if (!hasLocalStorage()) return null;
    try {
      return window.localStorage.getItem(key);
    } catch (error) {
      console.warn('safeLocalStorage.getItem failed', error);
      return null;
    }
  },
  setItem(key, value) {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.setItem(key, value);
    } catch (error) {
      console.warn('safeLocalStorage.setItem failed', error);
    }
  },
  removeItem(key) {
    if (!hasLocalStorage()) return;
    try {
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn('safeLocalStorage.removeItem failed', error);
    }
  },
};

export const safeSessionStorage = {
  getItem(key) {
    if (!hasSessionStorage()) return null;
    try {
      return window.sessionStorage.getItem(key);
    } catch (error) {
      console.warn('safeSessionStorage.getItem failed', error);
      return null;
    }
  },
  setItem(key, value) {
    if (!hasSessionStorage()) return;
    try {
      window.sessionStorage.setItem(key, value);
    } catch (error) {
      console.warn('safeSessionStorage.setItem failed', error);
    }
  },
  removeItem(key) {
    if (!hasSessionStorage()) return;
    try {
      window.sessionStorage.removeItem(key);
    } catch (error) {
      console.warn('safeSessionStorage.removeItem failed', error);
    }
  },
};

export const getIndexedDB = () => {
  if (!hasWindow || typeof window.indexedDB === 'undefined') return null;
  return window.indexedDB;
};
