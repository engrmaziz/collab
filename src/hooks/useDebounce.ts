import { useEffect, useRef } from "react";

/**
 * Calls `callback` with the latest `value` after `delay` ms of inactivity.
 * Does NOT fire on mount with the initial value.
 */
export function useDebouncedEffect<T>(
  value: T,
  delay: number,
  callback: (value: T) => void
) {
  const isFirst = useRef(true);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const handle = setTimeout(() => {
      callbackRef.current(value);
    }, delay);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, delay]);
}

/**
 * Simple debounce for imperative function calls (e.g. broadcasting on every keystroke).
 */
export function useDebouncedCallback<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fnRef = useRef(fn);
  fnRef.current = fn;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return (...args: Args) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => fnRef.current(...args), delay);
  };
}
