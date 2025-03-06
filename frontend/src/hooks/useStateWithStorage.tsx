import { useState, useEffect } from "react";

/**
 * A custom hook that works like useState but persists the state to Chrome extension storage
 * @param key The key to store the value under in Chrome storage
 * @param initialValue The initial value to use if no value is stored
 * @returns A stateful value, and a function to update it (like useState)
 */
export function useStateWithStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((val: T) => T)) => void] {
  // Create state variable as usual
  const [state, setState] = useState<T>(initialValue);

  // When component mounts, load state from storage
  useEffect(() => {
    const loadState = async () => {
      try {
        // Check if chrome.storage is available (we're in an extension)
        if (typeof chrome !== "undefined" && chrome.storage) {
          chrome.storage.local.get([key], (result) => {
            // If we have a stored value, use it
            if (result[key] !== undefined) {
              setState(result[key]);
            }
          });
        } else {
          // Fallback to localStorage for development environment
          const storedValue = localStorage.getItem(key);
          if (storedValue !== null) {
            setState(JSON.parse(storedValue));
          }
        }
      } catch (error) {
        console.error(`Error loading state for key "${key}":`, error);
      }
    };

    loadState();
  }, [key]);

  // When state changes, save to storage
  const updateState = (value: T | ((val: T) => T)) => {
    setState((prevState) => {
      // Handle functional updates
      const newState = value instanceof Function ? value(prevState) : value;

      // Save to storage
      try {
        if (typeof chrome !== "undefined" && chrome.storage) {
          // Save to chrome.storage if available
          chrome.storage.local.set({ [key]: newState });
        } else {
          // Fallback to localStorage
          localStorage.setItem(key, JSON.stringify(newState));
        }
      } catch (error) {
        console.error(`Error saving state for key "${key}":`, error);
      }

      return newState;
    });
  };

  return [state, updateState];
}
