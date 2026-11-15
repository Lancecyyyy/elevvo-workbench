import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { setSoundEnabled } from "./sound";

export type Theme = "light" | "dark";

interface Prefs {
  theme: Theme;
  toggleTheme: () => void;
  sound: boolean;
  toggleSound: () => void;
}

const PrefsContext = createContext<Prefs | null>(null);

export function readStore(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}
export function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* storage blocked — preference just won't persist */
  }
}

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() =>
    document.documentElement.dataset.theme === "dark" ? "dark" : "light",
  );
  const [sound, setSound] = useState<boolean>(() => readStore("tf-sound") !== "off");

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    writeStore("tf-theme", theme);
  }, [theme]);

  useEffect(() => {
    setSoundEnabled(sound);
    writeStore("tf-sound", sound ? "on" : "off");
  }, [sound]);

  return (
    <PrefsContext.Provider
      value={{
        theme,
        toggleTheme: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
        sound,
        toggleSound: () => setSound((s) => !s),
      }}
    >
      {children}
    </PrefsContext.Provider>
  );
}

export function usePrefs(): Prefs {
  const ctx = useContext(PrefsContext);
  if (!ctx) throw new Error("usePrefs must be used inside <PrefsProvider>");
  return ctx;
}
