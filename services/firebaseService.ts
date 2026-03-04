import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase, ref, set, get, child } from 'firebase/database';
import { Transaction, FirebaseConfig } from '../types';

const CONFIG_STORAGE_KEY = 'mosque_firebase_config';

// Helper to save/load config from local storage so user doesn't re-type it
export const getStoredFirebaseConfig = (): FirebaseConfig | null => {
  const data = localStorage.getItem(CONFIG_STORAGE_KEY);
  return data ? JSON.parse(data) : null;
};

export const saveFirebaseConfig = (config: FirebaseConfig) => {
  localStorage.setItem(CONFIG_STORAGE_KEY, JSON.stringify(config));
};

const getFirebaseApp = (config: FirebaseConfig) => {
  if (getApps().length === 0) {
    return initializeApp(config);
  } else {
    // If app already exists but config changed, we might need to handle that, 
    // but for simple use case, we return existing.
    return getApp(); 
  }
};

export const saveToCloud = async (transactions: Transaction[], config: FirebaseConfig): Promise<boolean> => {
  try {
    const app = getFirebaseApp(config);
    const db = getDatabase(app);
    // Save under a specific node 'mosque_data'
    await set(ref(db, 'mosque_data'), {
      transactions: transactions,
      last_updated: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Firebase Save Error:", error);
    throw error;
  }
};

export const loadFromCloud = async (config: FirebaseConfig): Promise<Transaction[]> => {
  try {
    const app = getFirebaseApp(config);
    const dbRef = ref(getDatabase(app));
    const snapshot = await get(child(dbRef, 'mosque_data'));
    
    if (snapshot.exists()) {
      const data = snapshot.val();
      return data.transactions || [];
    } else {
      console.log("No data available");
      return [];
    }
  } catch (error) {
    console.error("Firebase Load Error:", error);
    throw error;
  }
};