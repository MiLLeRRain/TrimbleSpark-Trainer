const API_KEYS_STORAGE_KEY = "geminiApiKeys";
const API_KEY_INDEX_KEY = "geminiApiKeyIndex";
const MODEL_STORAGE_KEY = "geminiSelectedModel";

const isBrowser = () => typeof window !== "undefined" && typeof localStorage !== "undefined";

const safeJsonParse = <T,>(value: string | null, fallback: T): T => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
};

export const getStoredApiKeys = (): string[] => {
  if (!isBrowser()) return [];
  const keys = safeJsonParse<string[]>(localStorage.getItem(API_KEYS_STORAGE_KEY), []);
  return keys.map((key) => key.trim()).filter((key) => key.length > 0);
};

export const saveApiKeys = (keys: string[]) => {
  if (!isBrowser()) return;
  const cleaned = keys.map((key) => key.trim()).filter((key) => key.length > 0);
  localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(cleaned));
  localStorage.setItem(API_KEY_INDEX_KEY, "0");
};

export const hasStoredApiKeys = (): boolean => getStoredApiKeys().length > 0;

export const getAnyApiKey = (): string | null => {
  const keys = getStoredApiKeys();
  return keys.length > 0 ? keys[0] : null;
};

export const getNextApiKey = (): string | null => {
  const keys = getStoredApiKeys();
  if (keys.length === 0 || !isBrowser()) return null;

  const currentIndex = safeJsonParse<number>(localStorage.getItem(API_KEY_INDEX_KEY), 0);
  const nextIndex = Math.abs(currentIndex) % keys.length;
  localStorage.setItem(API_KEY_INDEX_KEY, String(nextIndex + 1));
  return keys[nextIndex];
};

export const getSelectedModel = (): string | null => {
  if (!isBrowser()) return null;
  const model = localStorage.getItem(MODEL_STORAGE_KEY);
  return model ? model.trim() : null;
};

export const saveSelectedModel = (model: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(MODEL_STORAGE_KEY, model.trim());
};
