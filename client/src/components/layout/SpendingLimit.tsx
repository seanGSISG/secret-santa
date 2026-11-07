import { Banknote } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { translate } from '@/lib/i18n';

interface SpendingLimitProps {
  className?: string;
}

export function SpendingLimit({ className = '' }: SpendingLimitProps) {
  const { config, language } = useAuth();

  if (config.spendingLimitEur === null) {
    return null;
  }

  const amount = new Intl.NumberFormat(language === 'fr' ? 'fr-FR' : 'en-US', {
    style: 'currency',
    currency: 'EUR',
  }).format(config.spendingLimitEur);

  return (
    <p className={`flex items-center gap-2 text-sm font-semibold ${className}`}>
      <Banknote aria-hidden="true" className="h-5 w-5 shrink-0" />
      <span>{translate(language, 'Spending limit:')} {amount}</span>
    </p>
  );
}
