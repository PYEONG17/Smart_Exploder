"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useSyncExternalStore,
} from "react";
import { translations, type Locale, type TranslationKey } from "@/lib/i18n";

interface LangContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: TranslationKey, fallback?: string) => string;
  toggleLocale: () => void;
}

const LangContext = createContext<LangContextValue | null>(null);

const STORAGE_KEY = "smartexplorer_locale";
const LOCALE_CHANGE_EVENT = "smartexplorer:locale-change";

function subscribeToLocaleChanges(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCALE_CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCALE_CHANGE_EVENT, onChange);
  };
}

function getLocaleSnapshot(): Locale {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved === "en" || saved === "vi" ? saved : "vi";
}

function getServerLocale(): Locale {
  return "vi";
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const locale = useSyncExternalStore(
    subscribeToLocaleChanges,
    getLocaleSnapshot,
    getServerLocale,
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = (l: Locale) => {
    localStorage.setItem(STORAGE_KEY, l);
    window.dispatchEvent(new Event(LOCALE_CHANGE_EVENT));
  };

  const toggleLocale = () => setLocale(locale === "vi" ? "en" : "vi");

  const t = (key: TranslationKey, fallback?: string): string => {
    return translations[locale][key] ?? fallback ?? key;
  };

  return (
    <LangContext.Provider value={{ locale, setLocale, t, toggleLocale }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside <LanguageProvider>");
  return ctx;
}
