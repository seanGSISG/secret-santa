import type { Language, PublicConfig } from '@/types';

export const DEFAULT_LANGUAGE: Language =
  typeof navigator !== 'undefined' && navigator.language.toLowerCase().startsWith('en')
    ? 'en'
    : 'fr';

export const DEFAULT_PUBLIC_CONFIG: PublicConfig = {
  wishlistEnabled: true,
  pageTitle: 'Secret Santa révèle',
  gameTitle: 'Secret Santa',
  subtitle: {
    fr: 'Le plus beau moment de l’année commence ici : inscrivez-vous et partagez la joie des cadeaux.',
    en: 'The most wonderful time of the year starts here: sign up and share the joy of giving.',
  },
  welcomeMessage: {
    fr: 'Bienvenue ! Inscrivez-vous pour participer à notre Secret Santa.',
    en: 'Welcome! Sign up to take part in our Secret Santa.',
  },
  registrationRules: {
    fr: '',
    en: '',
  },
  milestones: [],
  spendingLimitEur: null,
};
