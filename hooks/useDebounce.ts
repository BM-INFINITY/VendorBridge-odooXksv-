"use client";

import { useEffect, useState } from "react";

// Debounces a value by the specified delay (default 300ms).
// Use for search input fields to avoid firing on every keystroke.
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}
