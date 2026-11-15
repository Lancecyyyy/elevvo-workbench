import { useCallback, useEffect, useState } from "react";

const KEY = "tf-saved-posts";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    const v: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Saved journal posts, kept in sync across components and tabs. */
export function useSavedPosts() {
  const [saved, setSaved] = useState<string[]>(read);

  useEffect(() => {
    const sync = () => setSaved(read());
    window.addEventListener("tf:saved", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("tf:saved", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggle = useCallback((slug: string): boolean => {
    const cur = read();
    const on = !cur.includes(slug);
    const next = on ? [slug, ...cur] : cur.filter((s) => s !== slug);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event("tf:saved"));
    return on;
  }, []);

  return { saved, toggle };
}
