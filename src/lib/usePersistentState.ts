import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";

export interface PersistentState<T> {
  value: T;
  setValue: Dispatch<SetStateAction<T>>;
  /** true until the (simulated) network read resolves */
  loading: boolean;
}

/** Treats localStorage like a remote API: resolves after `delay` ms. */
function fakeFetch<T>(key: string, fallback: T, delay: number, validate: (raw: unknown) => raw is T): Promise<T> {
  return new Promise((resolve) => {
    window.setTimeout(() => {
      try {
        const raw = localStorage.getItem(key);
        if (raw === null) return resolve(fallback);
        const parsed: unknown = JSON.parse(raw);
        resolve(validate(parsed) ? parsed : fallback);
      } catch {
        resolve(fallback);
      }
    }, delay);
  });
}

/**
 * useState that persists to localStorage, wrapped so it behaves like a
 * network call (1s latency by default) and the UI can show a skeleton.
 * Writes are held back until the first read finishes, so the fallback
 * never overwrites saved data.
 */
export function usePersistentState<T>(
  key: string,
  fallback: T,
  validate: (raw: unknown) => raw is T,
  delay = 1000,
): PersistentState<T> {
  const [value, setValue] = useState<T>(fallback);
  const [loading, setLoading] = useState(true);
  const hydrated = useRef(false);
  const fallbackRef = useRef(fallback);
  const validateRef = useRef(validate);

  useEffect(() => {
    let alive = true;
    fakeFetch(key, fallbackRef.current, delay, validateRef.current).then((v) => {
      if (!alive) return;
      setValue(v);
      setLoading(false);
      hydrated.current = true;
    });
    return () => {
      alive = false;
    };
  }, [key, delay]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* quota or privacy mode: keep working in memory */
    }
  }, [key, value]);

  return { value, setValue, loading };
}
