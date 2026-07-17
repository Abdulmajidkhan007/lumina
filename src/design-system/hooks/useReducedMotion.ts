/**
 * Lumina — useReducedMotion
 *
 * Reads the OS-level "Reduce Motion" accessibility setting and keeps it in
 * sync with live changes. Entrance/press animations should gate on this so
 * that users who request reduced motion get instant state changes instead
 * of springs/timings.
 */

import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((value) => {
      if (mounted) setReduced(value);
    });

    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (value: boolean) => setReduced(value),
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  return reduced;
}
