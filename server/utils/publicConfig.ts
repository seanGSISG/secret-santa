export interface EventMilestone {
  label: LocalizedText;
  date: string;
}

export interface LocalizedText {
  fr: string;
  en: string;
}

export interface PublicConfig {
  wishlistEnabled: boolean;
  pageTitle: string;
  gameTitle: string;
  subtitle: LocalizedText;
  welcomeMessage: LocalizedText;
  registrationRules: LocalizedText;
  milestones: EventMilestone[];
  spendingLimitEur: number | null;
}

export function getPublicConfig(): PublicConfig {
  const rawMilestones = process.env.EVENT_MILESTONES?.trim();
  const rawSpendingLimit = process.env.GIFT_SPENDING_LIMIT_EUR?.trim();
  let spendingLimitEur: number | null = null;
  let milestones: EventMilestone[] = [];

  if (rawSpendingLimit) {
    const parsedSpendingLimit = Number(rawSpendingLimit);
    if (!Number.isFinite(parsedSpendingLimit) || parsedSpendingLimit < 0) {
      throw new Error('GIFT_SPENDING_LIMIT_EUR must be a non-negative number.');
    }
    spendingLimitEur = parsedSpendingLimit;
  }

  if (rawMilestones) {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawMilestones);
    } catch {
      throw new Error('EVENT_MILESTONES must contain valid JSON.');
    }

    if (!Array.isArray(parsed) || parsed.length > 10) {
      throw new Error('EVENT_MILESTONES must be a JSON array with at most 10 entries.');
    }

    milestones = parsed.map((item, index) => {
      if (
        typeof item !== 'object' ||
        item === null ||
        !('label' in item) ||
        !('date' in item) ||
        typeof item.date !== 'string' ||
        !/^\d{4}-\d{2}-\d{2}$/.test(item.date) ||
        Number.isNaN(Date.parse(`${item.date}T00:00:00Z`)) ||
        new Date(`${item.date}T00:00:00Z`).toISOString().slice(0, 10) !== item.date
      ) {
        throw new Error(`EVENT_MILESTONES entry ${index + 1} must have a label and a YYYY-MM-DD date.`);
      }

      let label: LocalizedText;
      if (typeof item.label === 'string' && item.label.trim()) {
        label = { fr: item.label.trim(), en: item.label.trim() };
      } else if (
        typeof item.label === 'object' &&
        item.label !== null &&
        'fr' in item.label &&
        'en' in item.label &&
        typeof item.label.fr === 'string' &&
        typeof item.label.en === 'string' &&
        item.label.fr.trim() &&
        item.label.en.trim()
      ) {
        label = { fr: item.label.fr.trim(), en: item.label.en.trim() };
      } else {
        throw new Error(`EVENT_MILESTONES entry ${index + 1} must have a label in French and English.`);
      }

      return { label, date: item.date };
    });
  }

  return {
    wishlistEnabled: process.env.ENABLE_WISHLIST?.trim().toLowerCase() !== 'false',
    pageTitle: process.env.PAGE_TITLE?.trim() || 'Secret Santa révèle',
    gameTitle: process.env.GAME_TITLE?.trim() || 'Secret Santa',
    subtitle: {
      fr: process.env.GAME_SUBTITLE_FR?.trim() || process.env.GAME_SUBTITLE?.trim() ||
        'Le plus beau moment de l’année commence ici : inscrivez-vous et partagez la joie des cadeaux.',
      en: process.env.GAME_SUBTITLE_EN?.trim() || process.env.GAME_SUBTITLE?.trim() ||
        'The most wonderful time of the year starts here: sign up and share the joy of giving.',
    },
    welcomeMessage: {
      fr: process.env.WELCOME_MESSAGE_FR?.trim() || process.env.WELCOME_MESSAGE?.trim() ||
        'Bienvenue ! Inscrivez-vous pour participer à notre Secret Santa.',
      en: process.env.WELCOME_MESSAGE_EN?.trim() || process.env.WELCOME_MESSAGE?.trim() ||
        'Welcome! Sign up to take part in our Secret Santa.',
    },
    registrationRules: {
      fr: process.env.REGISTRATION_RULES_FR?.trim() || '',
      en: process.env.REGISTRATION_RULES_EN?.trim() || '',
    },
    milestones,
    spendingLimitEur,
  };
}
