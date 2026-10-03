/**
 * Global Language State Manager & Event Listener Service
 * Manages multilingual selection, broadcast subscribers, cross-tab synchronization,
 * and automatic refetch triggers for localized labels, tooltips, and AI assistant responses.
 */

import { LanguageInfo, SUPPORTED_LANGUAGES } from '../data/languagesData';
import { getTranslation, Translations } from '../data/translations';
import { storageService } from './storageService';

export type LanguageChangeListener = (
  language: LanguageInfo,
  translations: Translations,
  eventSource: 'user' | 'storage' | 'system'
) => void;

class GlobalLanguageService {
  private currentLanguage: LanguageInfo;
  private listeners: Set<LanguageChangeListener> = new Set();
  private refreshCounter: number = 0;

  constructor() {
    const savedCode = storageService.getLanguageCode();
    const matched = SUPPORTED_LANGUAGES.find((l) => l.code === savedCode);
    this.currentLanguage = matched || SUPPORTED_LANGUAGES[0];

    // Cross-tab synchronization via storage event
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'polypharm_language_v3' && event.newValue) {
          const nextLang = SUPPORTED_LANGUAGES.find((l) => l.code === event.newValue);
          if (nextLang && nextLang.code !== this.currentLanguage.code) {
            this.setLanguage(nextLang, 'storage');
          }
        }
      });
    }
  }

  /**
   * Get currently active language
   */
  public getLanguage(): LanguageInfo {
    return this.currentLanguage;
  }

  /**
   * Get active language code
   */
  public getLanguageCode(): string {
    return this.currentLanguage.code;
  }

  /**
   * Get active translation dictionary
   */
  public getTranslations(): Translations {
    return getTranslation(this.currentLanguage.code);
  }

  /**
   * Get current refresh key for triggering re-renders / re-fetching
   */
  public getRefreshKey(): number {
    return this.refreshCounter;
  }

  /**
   * Set new language selection and broadcast to all global listeners
   */
  public setLanguage(
    newLangOrCode: LanguageInfo | string,
    eventSource: 'user' | 'storage' | 'system' = 'user'
  ): void {
    let nextLang: LanguageInfo | undefined;

    if (typeof newLangOrCode === 'string') {
      nextLang = SUPPORTED_LANGUAGES.find(
        (l) => l.code.toLowerCase() === newLangOrCode.toLowerCase()
      );
    } else {
      nextLang = newLangOrCode;
    }

    if (!nextLang) {
      console.warn(`[LanguageService] Unknown language: ${newLangOrCode}`);
      return;
    }

    this.currentLanguage = nextLang;
    this.refreshCounter += 1;

    // Persist to storage
    storageService.saveLanguageCode(nextLang.code);

    const translations = getTranslation(nextLang.code);

    // Notify registered in-app listeners
    this.listeners.forEach((listener) => {
      try {
        listener(nextLang!, translations, eventSource);
      } catch (err) {
        console.error('[LanguageService] Error in language listener:', err);
      }
    });

    // Dispatch DOM CustomEvent for decoupled listeners across the app
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('polypharm:language-change', {
          detail: {
            language: nextLang,
            translations,
            source: eventSource,
            refreshKey: this.refreshCounter,
          },
        })
      );
    }
  }

  /**
   * Subscribe to language selection changes
   * @returns Unsubscribe function
   */
  public subscribe(listener: LanguageChangeListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Trigger an explicit re-fetch of all localized resources
   */
  public triggerRefetch(): void {
    this.refreshCounter += 1;
    const translations = getTranslation(this.currentLanguage.code);

    this.listeners.forEach((listener) => {
      try {
        listener(this.currentLanguage, translations, 'system');
      } catch (err) {
        console.error('[LanguageService] Error in refetch listener:', err);
      }
    });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('polypharm:language-refetch', {
          detail: {
            language: this.currentLanguage,
            translations,
            refreshKey: this.refreshCounter,
          },
        })
      );
    }
  }
}

export const globalLanguageService = new GlobalLanguageService();
