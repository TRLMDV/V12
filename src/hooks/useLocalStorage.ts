"use client";

import { useState, useEffect } from 'react';

type SetValue<T> = (value: T | ((prevValue: T) => T)) => void;

export function useLocalStorage<T>(key: string, initialValue: T): [T, SetValue<T>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue;
    }
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) {
        return initialValue; // No item found, return initial value
      }

      const parsedItem = JSON.parse(item);

      // If initialValue is an object, ensure we always return an object.
      // Start with initialValue to guarantee all default properties are present.
      if (typeof initialValue === 'object' && initialValue !== null) {
        const mergedObject = { ...initialValue };
        // If parsedItem is also an object, overlay its non-undefined properties.
        if (typeof parsedItem === 'object' && parsedItem !== null) {
          for (const prop in parsedItem) {
            if (Object.prototype.hasOwnProperty.call(parsedItem, prop) && parsedItem[prop] !== undefined) {
              mergedObject[prop] = parsedItem[prop];
            }
          }
        }
        return mergedObject as T; // Always return a merged object if initialValue was an object
      }

      // If initialValue was not an object (e.g., a primitive), just return the parsed item.
      return parsedItem;
    } catch (error) {
      console.error(`Error reading or parsing localStorage key "${key}":`, error);
      return initialValue; // Fallback to initialValue on any error
    }
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key, JSON.stringify(storedValue));
      } catch (error) {
        console.error(`Error writing to localStorage key "${key}":`, error);
      }
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}