import { Clock3, FileText, GitBranch } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const timelineEvents = [
  {
    id: '1',
    labelKey: 'timeline.event.vaultCreated',
    descriptionKey: 'timeline.event.vaultCreatedDescription',
    icon: GitBranch
  },
  {
    id: '2',
    labelKey: 'timeline.event.welcomePinned',
    descriptionKey: 'timeline.event.welcomePinnedDescription',
    icon: FileText
  }
] as const;

export const Timeline = () => {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
      <header className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        <Clock3 className="h-4 w-4" aria-hidden="true" />
        <span>{t('timeline.heading')}</span>
      </header>
      <ol className="mt-4 space-y-3">
        {timelineEvents.map((event) => (
          <li key={event.id} className="flex items-start gap-3 rounded-xl border border-slate-800/60 bg-slate-900/40 p-3">
            <event.icon className="mt-1 h-4 w-4 text-slate-300" aria-hidden="true" />
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between text-slate-100">
                <span>{t(event.labelKey)}</span>
                <span className="text-xs text-slate-500">{t('timeline.timestamp.justNow')}</span>
              </div>
              <p className="text-slate-400">{t(event.descriptionKey)}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
};
