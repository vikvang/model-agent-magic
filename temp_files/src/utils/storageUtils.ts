/**
 * Utility functions for working with Chrome extension storage
 */

// Key constants to prevent typos and ensure consistent key usage
export const STORAGE_KEYS = {
  // User preferences
  SELECTED_MODEL: "gregify_selected_model",
  SELECTED_ROLE: "gregify_selected_role",
  ACTIVE_PROVIDER: "gregify_active_provider",

  // Content
  PROMPT: "gregify_prompt",
  LAST_PROMPT: "gregify_last_prompt",
  PROMPT_HISTORY: "gregify_prompt_history",

  // UI state
  DARK_MODE: "gregify_dark_mode",
  SIDEBAR_OPEN: "gregify_sidebar_open",

  // Settings
  NOTIFICATIONS_ENABLED: "gregify_notifications_enabled",
};

/**
 * Get a value from storage
 * @param key The key to get
 * @param defaultValue The default value to return if the key doesn't exist
 * @returns A promise that resolves to the value
 */
export async function getFromStorage<T>(
  key: string,
  defaultValue: T
): Promise<T> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.get([key], (result) => {
          resolve(result[key] !== undefined ? result[key] : defaultValue);
        });
      } else {
        // Fallback to localStorage
        const value = localStorage.getItem(key);
        resolve(value !== null ? JSON.parse(value) : defaultValue);
      }
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      resolve(defaultValue);
    }
  });
}

/**
 * Save a value to storage
 * @param key The key to save under
 * @param value The value to save
 * @returns A promise that resolves when the value is saved
 */
export async function saveToStorage<T>(key: string, value: T): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.set({ [key]: value }, resolve);
      } else {
        // Fallback to localStorage
        localStorage.setItem(key, JSON.stringify(value));
        resolve();
      }
    } catch (error) {
      console.error(`Error saving ${key} to storage:`, error);
      resolve();
    }
  });
}

/**
 * Clear a value from storage
 * @param key The key to clear
 * @returns A promise that resolves when the value is cleared
 */
export async function clearFromStorage(key: string): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.remove(key, resolve);
      } else {
        // Fallback to localStorage
        localStorage.removeItem(key);
        resolve();
      }
    } catch (error) {
      console.error(`Error clearing ${key} from storage:`, error);
      resolve();
    }
  });
}

/**
 * Clear all storage values
 * @returns A promise that resolves when all values are cleared
 */
export async function clearAllStorage(): Promise<void> {
  return new Promise((resolve) => {
    try {
      if (typeof chrome !== "undefined" && chrome.storage) {
        chrome.storage.local.clear(resolve);
      } else {
        // Fallback to localStorage
        localStorage.clear();
        resolve();
      }
    } catch (error) {
      console.error("Error clearing all storage:", error);
      resolve();
    }
  });
}
