import { CloudOff, HardDriveUpload, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';

export const VaultQuickActions = () => {
  const { t } = useTranslation();
  return (
    <section className="rounded-2xl border border-slate-800/80 bg-slate-950/60 p-5">
      <header className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">{t('dashboard.quickStart')}</h3>
          <p className="text-xs text-slate-400">{t('dashboard.quickStartDescription')}</p>
        </div>
        <Lock className="h-4 w-4 text-emerald-400" aria-hidden="true" />
      </header>
      <div className="space-y-2">
        <Button variant="outline" size="sm" icon={HardDriveUpload} className="w-full justify-start">
          {t('actions.mountVault')}
        </Button>
        <Button variant="outline" size="sm" icon={CloudOff} className="w-full justify-start">
          {t('actions.enableStrictLocal')}
        </Button>
      </div>
    </section>
  );
};
