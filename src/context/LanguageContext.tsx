import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LanguageInfo, SUPPORTED_LANGUAGES } from '../data/languagesData';
import { getTranslation, Translations } from '../data/translations';
import { globalLanguageService } from '../services/languageService';
import { translatePhrase } from '../data/uiDictionary';

interface LanguageContextType {
  currentLanguage: LanguageInfo;
  languageCode: string;
  setLanguage: (lang: LanguageInfo | string) => void;
  t: Translations;
  translate: (englishText: string) => string;
  refreshKey: number;
  isRefetching: boolean;
  refetchNotification: string | null;
  triggerRefetch: () => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentLanguage, setCurrentLanguageState] = useState<LanguageInfo>(() =>
    globalLanguageService.getLanguage()
  );
  const [translations, setTranslations] = useState<Translations>(() =>
    globalLanguageService.getTranslations()
  );
  const [refreshKey, setRefreshKey] = useState<number>(0);
  const [isRefetching, setIsRefetching] = useState<boolean>(false);
  const [refetchNotification, setRefetchNotification] = useState<string | null>(null);

  useEffect(() => {
    // Register global listener for language changes
    const unsubscribe = globalLanguageService.subscribe((newLang, newTranslations, source) => {
      setCurrentLanguageState(newLang);
      setTranslations(newTranslations);
      setRefreshKey((prev) => prev + 1);
      setIsRefetching(true);

      const notice = `${newTranslations.refetch_notice || 'Refetched localized labels, tooltips, and AI assistant responses'} [${newLang.nativeName} - ${newLang.name}]`;
      setRefetchNotification(notice);

      const timer = setTimeout(() => {
        setIsRefetching(false);
      }, 700);

      const noticeTimer = setTimeout(() => {
        setRefetchNotification(null);
      }, 4000);

      return () => {
        clearTimeout(timer);
        clearTimeout(noticeTimer);
      };
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const setLanguage = useCallback((lang: LanguageInfo | string) => {
    let nextLang: LanguageInfo | undefined;
    if (typeof lang === 'string') {
      nextLang = SUPPORTED_LANGUAGES.find((l) => l.code.toLowerCase() === lang.toLowerCase());
    } else {
      nextLang = lang;
    }
    if (!nextLang) return;

    setCurrentLanguageState(nextLang);
    const newTrans = getTranslation(nextLang.code);
    setTranslations(newTrans);
    setRefreshKey((k) => k + 1);

    if (typeof document !== 'undefined') {
      document.documentElement.lang = nextLang.code;
    }

    globalLanguageService.setLanguage(nextLang, 'user');
  }, []);

  const translate = useCallback(
    (text: string) => {
      return translatePhrase(text, currentLanguage.code);
    },
    [currentLanguage.code]
  );

  const triggerRefetch = useCallback(() => {
    setIsRefetching(true);
    globalLanguageService.triggerRefetch();
    setTimeout(() => setIsRefetching(false), 600);
  }, []);

  return (
    <LanguageContext.Provider
      value={{
        currentLanguage,
        languageCode: currentLanguage.code,
        setLanguage,
        t: translations,
        translate,
        refreshKey,
        isRefetching,
        refetchNotification,
        triggerRefetch,
      }}
    >
      {children}
      {/* Global State Listener Refetch Toast Indicator */}
      {refetchNotification && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 max-w-sm sm:max-w-md bg-slate-900/95 text-cyan-200 border border-cyan-500/60 shadow-2xl shadow-cyan-950/80 rounded-xl p-3.5 text-xs flex items-center gap-3 backdrop-blur-lg transition-all border-l-4 border-l-cyan-400"
        >
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shrink-0" />
          <div className="flex-1 font-mono text-[11px] leading-tight text-slate-200">
            <span className="font-bold text-cyan-300 block mb-0.5">🔄 Global Localization Sync</span>
            {refetchNotification}
          </div>
          <button
            onClick={() => setRefetchNotification(null)}
            className="text-slate-400 hover:text-white font-bold px-1 text-sm cursor-pointer ml-1"
            aria-label="Dismiss notification"
          >
            ✕
          </button>
        </div>
      )}
    </LanguageContext.Provider>
  );
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
