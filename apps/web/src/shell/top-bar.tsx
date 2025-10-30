import { Command, HardDriveDownload, ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { Button } from '../ui/button';

export const TopBar = () => {
  const { t } = useTranslation();
  const isSecure = true;

  return (
    <header className="flex items-center justify-between border-b border-slate-800/80 bg-slate-950/80 px-6 py-3 backdrop-blur">
      <div className="flex flex-1 items-center gap-3 text-sm text-slate-300">
        <ShieldCheck className="h-4 w-4 text-emerald-400" aria-hidden="true" />
        <span>{isSecure ? t('vaultStatus.secure') : t('status.offline')}</span>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" icon={HardDriveDownload}>
          {t('app.openVault')}
        </Button>
        <Button variant="primary" size="sm" icon={Command} data-command="toggle-command-palette">
          {t('app.shortcuts')}
        </Button>
      </div>
    </header>
  );
};
