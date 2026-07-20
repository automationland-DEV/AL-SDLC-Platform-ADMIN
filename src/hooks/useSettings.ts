import { useEffect } from "react";
import { create } from "zustand";

export type ThemeMode = "light" | "dark" | "system";
export type FontSize = "small" | "medium" | "large" | "xlarge";
export type AccentColor = "blue" | "indigo" | "emerald" | "rose" | "amber";

interface SettingsState {
  theme: ThemeMode;
  fontSize: FontSize;
  accentColor: AccentColor;
  setTheme: (theme: ThemeMode) => void;
  setFontSize: (size: FontSize) => void;
  setAccentColor: (color: AccentColor) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  theme: (localStorage.getItem("admin-theme") as ThemeMode) || "system",
  fontSize: (localStorage.getItem("admin-font-size") as FontSize) || "medium",
  accentColor: (localStorage.getItem("admin-accent-color") as AccentColor) || "blue",
  setTheme: (theme) => set({ theme }),
  setFontSize: (fontSize) => set({ fontSize }),
  setAccentColor: (accentColor) => set({ accentColor }),
}));

export const useSettings = () => {
  const store = useSettingsStore();

  // Theme Effect
  useEffect(() => {
    const root = window.document.documentElement;
    const systemMedia = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = (currentTheme: ThemeMode) => {
      root.classList.remove("light", "dark");
      if (currentTheme === "system") {
        const systemMode = systemMedia.matches ? "dark" : "light";
        root.classList.add(systemMode);
      } else {
        root.classList.add(currentTheme);
      }
    };

    applyTheme(store.theme);
    localStorage.setItem("admin-theme", store.theme);

    const listener = () => {
      if (store.theme === "system") applyTheme("system");
    };

    systemMedia.addEventListener("change", listener);
    return () => systemMedia.removeEventListener("change", listener);
  }, [store.theme]);

  // Font Size Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("font-small", "font-medium", "font-large", "font-xlarge");
    root.classList.add(`font-${store.fontSize}`);
    localStorage.setItem("admin-font-size", store.fontSize);
  }, [store.fontSize]);

  // Accent Color Effect
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("theme-blue", "theme-indigo", "theme-emerald", "theme-rose", "theme-amber");
    root.classList.add(`theme-${store.accentColor}`);
    localStorage.setItem("admin-accent-color", store.accentColor);
  }, [store.accentColor]);

  return store;
};
