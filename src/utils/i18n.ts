export type Locale = 'es-MX' | 'en' | 'it';

export const LOCALE_STORAGE_KEY = 'formulador-locale';

const translationsCache = new Map<Locale, Record<string, string>>();

export async function loadTranslations(locale: Locale): Promise<Record<string, string>> {
  if (translationsCache.has(locale)) return translationsCache.get(locale)!;
  let module: Record<string, string>;
  switch (locale) {
    case 'en':
      module = (await import('./i18n/en')).default;
      break;
    case 'it':
      module = (await import('./i18n/it')).default;
      break;
    default:
      module = (await import('./i18n/es-MX')).default;
      break;
  }
  translationsCache.set(locale, module);
  return module;
}

export function getSystemLocale(): Locale {
  if (typeof window === 'undefined') return 'es-MX';
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale | null;
    if (stored && (stored === 'es-MX' || stored === 'en' || stored === 'it')) return stored;
  } catch {}
  const navLang = navigator.language?.slice(0, 2);
  if (navLang === 'en') return 'en';
  if (navLang === 'it') return 'it';
  return 'es-MX';
}

export type TranslationFn = (key: string, ...args: (string | number)[]) => string;

export function createT(dict: Record<string, string>): TranslationFn {
  return (key: string, ...args: (string | number)[]): string => {
    let value = dict[key];
    if (value === undefined) return key;
    if (args.length > 0) {
      args.forEach((arg, i) => {
        value = value!.replace(`{${i}}`, String(arg));
      });
    }
    return value;
  };
}
