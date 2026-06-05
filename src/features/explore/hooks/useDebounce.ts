/**
 * Lumina — useDebounce
 *
 * Returns a debounced copy of the given value. The debounced value only
 * updates after `delay` milliseconds have elapsed since the last change.
 * Cleans up the timeout on unmount.
 */

import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}
