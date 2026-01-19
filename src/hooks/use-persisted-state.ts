import { useCallback, useEffect, useState } from 'react';

interface UsePersistedStateOptions<T, TStored = T> {
  /** Transform the value before saving to localStorage */
  serialize?: (value: T) => TStored;
  /** Transform the stored value when loading from localStorage */
  deserialize?: (stored: TStored) => T;
}

/**
 * A type-safe hook for persisting state to localStorage.
 *
 * @param key - The localStorage key to use
 * @param defaultValue - The default value if nothing is stored
 * @param options - Optional serialize/deserialize functions for custom transformations
 * @returns A tuple of [value, setValue, clearValue]
 */
export function usePersistedState<T, TStored = T>(
  key: string,
  defaultValue: T,
  options?: UsePersistedStateOptions<T, TStored>
): [T, React.Dispatch<React.SetStateAction<T>>, () => void] {
  const { serialize, deserialize } = options ?? {};

  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return defaultValue;
    }

    try {
      const stored = localStorage.getItem(key);
      if (stored !== null) {
        const parsed = JSON.parse(stored) as TStored;
        return deserialize ? deserialize(parsed) : (parsed as unknown as T);
      }
    } catch {
      // Invalid JSON or other error, use default
    }

    return defaultValue;
  });

  useEffect(() => {
    try {
      const toStore = serialize ? serialize(value) : value;
      localStorage.setItem(key, JSON.stringify(toStore));
    } catch {
      // Storage quota exceeded or other error
    }
  }, [key, value, serialize]);

  const clearValue = useCallback(() => {
    localStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, clearValue];
}
