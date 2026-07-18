import { db } from './firebase';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';

// Falls back to these when system_settings/general has never been written.
export const DEFAULT_GENERAL_SETTINGS = {
  universityName: 'The Last Salle University',
  shortName: 'TLSU',
  contactEmail: 'admin@tlsu.edu',
  compactTable: true,
  showActivityFeed: true
};

export const systemService = {
  // Fetch current academic configuration
  getAcademicConfig: async () => {
    try {
      const docRef = doc(db, 'system_settings', 'academic');
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return snap.data();
      }
      // Fallback default configuration if document doesn't exist yet
      return { activeYear: '2026-2027', activeSemester: '1st Semester' };
    } catch (error) {
      console.error("Failed to fetch academic config:", error);
      throw error;
    }
  },

  // Save updated academic configuration
  updateAcademicConfig: async (config) => {
    try {
      const docRef = doc(db, 'system_settings', 'academic');
      await setDoc(docRef, config, { merge: true });
      return true;
    } catch (error) {
      console.error("Failed to update academic config:", error);
      throw error;
    }
  },

  // Fetch general/display settings (university info + dashboard display toggles)
  getGeneralSettings: async () => {
    try {
      const docRef = doc(db, 'system_settings', 'general');
      const snap = await getDoc(docRef);
      if (snap.exists()) return { ...DEFAULT_GENERAL_SETTINGS, ...snap.data() };
      return DEFAULT_GENERAL_SETTINGS;
    } catch (error) {
      console.error("Failed to fetch general settings:", error);
      throw error;
    }
  },

  // Save (partial or full) general/display settings
  updateGeneralSettings: async (settings) => {
    try {
      const docRef = doc(db, 'system_settings', 'general');
      await setDoc(docRef, settings, { merge: true });
      return true;
    } catch (error) {
      console.error("Failed to update general settings:", error);
      throw error;
    }
  },

  // Live-subscribe to general/display settings, e.g. for pages that only read
  // the display toggles (dashboard's activity feed, the students table).
  subscribeToGeneralSettings: (callback) => {
    const docRef = doc(db, 'system_settings', 'general');
    return onSnapshot(docRef, (snap) => {
      callback(snap.exists() ? { ...DEFAULT_GENERAL_SETTINGS, ...snap.data() } : DEFAULT_GENERAL_SETTINGS);
    });
  }
};