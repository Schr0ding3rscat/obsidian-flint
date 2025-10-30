import { Flame, PlusCircle, Wand2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Timeline } from '../components/timeline';
import { VaultQuickActions } from '../components/vault-quick-actions';
import { Button } from '../ui/button';

const recentNotes: Array<{ id: string; title: string }> = [];

const DashboardView = () => {
  const { t } = useTranslation();
  return (
    <div className="flex h-full flex-col overflow-y-auto">
      <section className="border-b border-slate-800/80 bg-slate-950/60 px-10 py-10">
        <h1 className="text-3xl font-semibold text-white">{t('app.onboarding')}</h1>
        <p className="mt-2 max-w-2xl text-slate-400">{t('app.subtitle')}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button size="md" icon={PlusCircle}>
            {t('app.createVault')}
          </Button>
          <Button variant="outline" size="md" icon={Flame}>
            {t('dashboard.sampleVault')}
          </Button>
          <Button variant="ghost" size="md" icon={Wand2} disabled>
            {t('actions.enableAi')}
          </Button>
        </div>
      </section>
      <section className="grid flex-1 gap-6 px-10 py-8 lg:grid-cols-[2fr_1fr]">
        <article className="space-y-6 rounded-2xl border border-slate-800/80 bg-slate-950/50 p-6">
          <header className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{t('dashboard.recentNotes')}</h2>
            <Button variant="ghost" size="sm">
              {t('actions.viewAll')}
            </Button>
          </header>
          {recentNotes.length === 0 ? (
            <p className="rounded-lg border border-dashed border-slate-800/80 bg-slate-900/40 p-6 text-sm text-slate-400">
              {t('dashboard.noRecentNotes')}
            </p>
          ) : null}
        </article>
        <div className="space-y-6">
          <VaultQuickActions />
          <Timeline />
        </div>
      </section>
    </div>
  );
};

export default DashboardView;
