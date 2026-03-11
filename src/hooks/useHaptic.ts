/**
 * useHaptic - Provides haptic feedback for mobile devices
 *
 * Usage:
 * const haptic = useHaptic();
 * haptic.light(); // Light tap
 * haptic.medium(); // Medium impact
 * haptic.heavy(); // Heavy impact
 * haptic.success(); // Success pattern
 * haptic.error(); // Error pattern
 */

export function useHaptic() {
  const vibrate = (pattern: number | number[]) => {
    if ('vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {
        // Silently fail on devices that don't support vibration
        console.debug('Haptic feedback not supported:', e);
      }
    }
  };

  return {
    // Light tap (10ms)
    light: () => vibrate(10),

    // Medium impact (25ms)
    medium: () => vibrate(25),

    // Heavy impact (50ms)
    heavy: () => vibrate(50),

    // Success pattern (short-pause-short)
    success: () => vibrate([15, 30, 15]),

    // Error pattern (long-pause-long)
    error: () => vibrate([40, 50, 40]),

    // Warning pattern (short-pause-short-pause-short)
    warning: () => vibrate([10, 20, 10, 20, 10]),

    // Selection change (quick tap)
    select: () => vibrate(5),

    // Double tap pattern
    doubleTap: () => vibrate([15, 50, 15]),
  };
}
