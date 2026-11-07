import { CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { formatDate } from '@/lib/i18n';

export function EventMilestones() {
  const { config, language } = useAuth();

  if (config.milestones.length === 0) {
    return null;
  }

  return (
    <ul className="space-y-3">
      {config.milestones.map((milestone) => (
        <li key={`${milestone.label[language]}-${milestone.date}`} className="flex items-start gap-3">
          <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[#f8b229]" />
          <span>
            <strong className="font-semibold">{milestone.label[language]}</strong>
            <span className="block text-sm opacity-80">{formatDate(milestone.date, language)}</span>
          </span>
        </li>
      ))}
    </ul>
  );
}
