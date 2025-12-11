import enPack from '@/utils/i18n-packs/en';
import ruPack from '@/utils/i18n-packs/ru';

type Translations = Record<string, string>;
export type AppLanguage = 'en' | 'ru';
export type TranslationKey = keyof typeof enPack;

// Namespaced translations structure
type NamespacedTranslations = {
  global: Translations;
  namespaces: Record<string, Translations>;
};

class I18n {
  private dictionaries: Record<string, NamespacedTranslations>;
  private currentLang: AppLanguage;
  private loaders: Record<string, () => Promise<{ default?: Translations } | Translations>> = {};
  private fallbackLang: AppLanguage = 'en';
  private missingKeyWarnings = true;
  private listeners: Array<(lang: AppLanguage) => void> = [];

  constructor() {
    this.dictionaries = {
      en: { global: { ...enPack }, namespaces: {} },
      ru: { global: { ...ruPack }, namespaces: {} },
    };
    this.currentLang =
      (typeof window !== 'undefined' && (localStorage.getItem('appLanguage') as AppLanguage)) || 'en';
  }

  private resolveKey(dict: NamespacedTranslations, key: string): string | undefined {
    // Try global first
    if (dict.global[key] !== undefined) return dict.global[key];

    // Namespace support via dot or colon separators
    const nsSepIndexDot = key.indexOf('.');
    const nsSepIndexColon = key.indexOf(':');
    const nsSepIndex = nsSepIndexDot >= 0 ? nsSepIndexDot : nsSepIndexColon;

    if (nsSepIndex >= 0) {
      const ns = key.substring(0, nsSepIndex);
      const nsKey = key.substring(nsSepIndex + 1);
      const nsDict = dict.namespaces[ns];
      if (nsDict && nsDict[nsKey] !== undefined) return nsDict[nsKey];
    }

    // Fallback convenience: search all namespaces for direct key
    for (const ns in dict.namespaces) {
      if (dict.namespaces[ns][key] !== undefined) return dict.namespaces[ns][key];
    }

    return undefined;
  }

  t(key: TranslationKey | string, replacements?: { [key: string]: string | number }): string {
    const currentDict = this.dictionaries[this.currentLang] || this.dictionaries[this.fallbackLang];
    const fallbackDict = this.dictionaries[this.fallbackLang];

    let text =
      this.resolveKey(currentDict, String(key)) ??
      this.resolveKey(fallbackDict, String(key)) ??
      String(key);

    if (this.missingKeyWarnings && text === key) {
      const presentInFallback = !!this.resolveKey(fallbackDict, String(key));
      if (!presentInFallback) {
        console.warn(`[i18n] Missing translation key "${key}" for language "${this.currentLang}".`);
      }
    }

    if (replacements) {
      for (const placeholder in replacements) {
        const regex = new RegExp(`\\{${placeholder}\\}`, 'g');
        text = text.replace(regex, String(replacements[placeholder]));
      }
    }
    return text;
  }

  registerLanguageLoader(lang: string, loader: () => Promise<{ default?: Translations } | Translations>) {
    this.loaders[lang] = loader;
  }

  async loadLanguage(lang: string): Promise<void> {
    if (this.dictionaries[lang]) return;
    const loader = this.loaders[lang];
    if (!loader) return;
    const pack = await loader();
    const entries = (pack && (pack as any).default) ? (pack as any).default as Translations : (pack as Translations);
    this.dictionaries[lang] = {
      global: { ...(entries || {}) },
      namespaces: {},
    };
  }

  setLanguage(lang: AppLanguage) {
    this.currentLang = lang;
    this.loadLanguage(lang).then(() => {
      this.notifyLanguageChange();
    });
    if (typeof window !== 'undefined') {
      localStorage.setItem('appLanguage', lang);
    }
    // Notify synchronously as well
    this.notifyLanguageChange();
  }

  getLanguage(): AppLanguage {
    return this.currentLang;
  }

  addTranslations(lang: AppLanguage, entries: Translations) {
    if (!this.dictionaries[lang]) {
      this.dictionaries[lang] = { global: {}, namespaces: {} };
    }
    Object.assign(this.dictionaries[lang].global, entries);
  }

  addNamespaceTranslations(lang: AppLanguage, namespace: string, entries: Translations) {
    if (!this.dictionaries[lang]) {
      this.dictionaries[lang] = { global: {}, namespaces: {} };
    }
    if (!this.dictionaries[lang].namespaces[namespace]) {
      this.dictionaries[lang].namespaces[namespace] = {};
    }
    Object.assign(this.dictionaries[lang].namespaces[namespace], entries);
  }

  registerLanguagePack(lang: string, entries: Translations) {
    if (!this.dictionaries[lang]) {
      this.dictionaries[lang] = { global: {}, namespaces: {} };
    }
    Object.assign(this.dictionaries[lang].global, entries);
  }

  hasKey(lang: AppLanguage, key: string): boolean {
    const dict = this.dictionaries[lang];
    if (!dict) return false;
    return this.resolveKey(dict, key) !== undefined;
  }

  setFallbackLanguage(lang: AppLanguage) {
    this.fallbackLang = lang;
  }

  setMissingKeyWarnings(enabled: boolean) {
    this.missingKeyWarnings = enabled;
  }

  getAvailableLanguages(): string[] {
    return Object.keys(this.dictionaries);
  }

  onLanguageChanged(listener: (lang: AppLanguage) => void) {
    this.listeners.push(listener);
  }

  offLanguageChanged(listener: (lang: AppLanguage) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  private notifyLanguageChange() {
    for (const l of this.listeners) {
      l(this.currentLang);
    }
  }

  // ADD: return a namespaced translator function
  getTranslator(namespace?: string) {
    return (key: string, replacements?: { [key: string]: string | number }) => {
      const fullKey = namespace ? `${namespace}.${key}` : String(key);
      return this.t(fullKey, replacements);
    };
  }
}

// Singleton instance
const i18n = new I18n();

// Public API (preserves existing imports)
export function t(key: TranslationKey | string, replacements?: { [key: string]: string | number }): string {
  return i18n.t(key, replacements);
}

export function getKeyAsPageId(key: string): string {
  return key.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase();
}

export function setLanguage(lang: AppLanguage) {
  i18n.setLanguage(lang);
}

export function getLanguage(): AppLanguage {
  return i18n.getLanguage();
}

export function addTranslations(lang: AppLanguage, entries: Translations) {
  i18n.addTranslations(lang, entries);
}

// Helpers for modular packs and dynamic languages
export function addNamespaceTranslations(lang: AppLanguage, namespace: string, entries: Translations) {
  i18n.addNamespaceTranslations(lang, namespace, entries);
}

export function registerLanguagePack(lang: string, entries: Translations) {
  i18n.registerLanguagePack(lang, entries);
}

export function hasKey(lang: AppLanguage, key: string): boolean {
  return i18n.hasKey(lang, key);
}

export function registerLanguageLoader(lang: string, loader: () => Promise<{ default?: Translations } | Translations>) {
  i18n.registerLanguageLoader(lang, loader);
}

export async function loadLanguage(lang: AppLanguage | string): Promise<void> {
  await i18n.loadLanguage(lang as string);
}

export function setFallbackLanguage(lang: AppLanguage) {
  i18n.setFallbackLanguage(lang);
}

export function setMissingKeyWarnings(enabled: boolean) {
  i18n.setMissingKeyWarnings(enabled);
}

export function getAvailableLanguages(): string[] {
  return i18n.getAvailableLanguages();
}

export function onLanguageChanged(listener: (lang: AppLanguage) => void) {
  i18n.onLanguageChanged(listener);
}

export function offLanguageChanged(listener: (lang: AppLanguage) => void) {
  i18n.offLanguageChanged(listener);
}

// ADD: export getTranslator helper
export function getTranslator(namespace?: string) {
  return i18n.getTranslator(namespace);
}