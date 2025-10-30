import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export const LoadingScreen = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-slate-400">
      <Loader2 className="h-6 w-6 animate-spin" aria-hidden="true" />
      <p className="text-sm">{t('app.loading')}</p>
    </div>
  );
};
