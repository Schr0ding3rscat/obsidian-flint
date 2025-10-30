import { Folder, Search, Settings, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import { NavLink } from '../ui/nav-link';

export const Sidebar = () => {
  const { t } = useTranslation();
  return (
    <aside className="flex min-h-screen flex-col border-r border-slate-800 bg-slate-950/60 backdrop-blur">
      <div className="px-6 pb-4 pt-6 text-sm uppercase tracking-wide text-slate-400">
        {t('app.title')}
      </div>
      <nav className="flex-1 space-y-2 px-2">
        <NavLink icon={Folder} label={t('nav.vault')} to="/" />
        <NavLink icon={Search} label={t('nav.search')} to="/search" disabled />
        <NavLink icon={Share2} label={t('nav.sync')} to="/sync" disabled />
      </nav>
      <div className="border-t border-slate-800 p-2">
        <NavLink icon={Settings} label={t('nav.settings')} to="/settings" disabled />
      </div>
    </aside>
  );
};
