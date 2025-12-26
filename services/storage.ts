
import { Exercise } from '../types';

const STORAGE_KEY = 'trimble_spark_trainer_v1';

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
  }
};
