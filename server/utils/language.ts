export type Language = 'fr' | 'en';

export function parseLanguage(value: unknown, fallback: Language | null = 'fr'): Language | null {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return value === 'fr' || value === 'en' ? value : null;
}
