import { Exercise, AppSettings } from '../types';

const STORAGE_KEY = 'trimble_spark_trainer_v1';
const SETTINGS_KEY = 'trimble_spark_settings_v1';

export const storageService = {
  /**
   * Save exercises to local storage.
   */
  save: (exercises: Exercise[]) => {
    try {
      const serialized = JSON.stringify(exercises);
      localStorage.setItem(STORAGE_KEY, serialized);
    } catch (e) {
      console.warn("Failed to save progress to local storage (quota exceeded?)", e);
    }
  },

  /**
   * Load exercises from local storage.
   */
  load: (): Exercise[] => {
    try {
      const serialized = localStorage.getItem(STORAGE_KEY);
      if (!serialized) return [];
      return JSON.parse(serialized) as Exercise[];
    } catch (e) {
      console.error("Failed to load progress from local storage", e);
      return [];
    }
  },

  /**
   * Clear all data.
   */
  clear: () => {
    localStorage.removeItem(STORAGE_KEY);
  },

  saveSettings: (settings: AppSettings) => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  },

  loadSettings: (): AppSettings => {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed.geminiApiKeys) && typeof parsed.geminiApiKey === 'string') {
        return {
          geminiApiKeys: parsed.geminiApiKey ? [parsed.geminiApiKey] : []
        };
      }
      return (parsed as AppSettings);
    }
    return {
      geminiApiKeys: []
    };
  }
};