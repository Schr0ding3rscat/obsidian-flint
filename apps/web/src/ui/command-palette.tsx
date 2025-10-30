import * as Dialog from '@radix-ui/react-dialog';
import clsx from 'clsx';
import { Command, Search, Sparkles } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { create } from 'zustand';

interface CommandPaletteState {
  readonly open: boolean;
  readonly setOpen: (open: boolean) => void;
  readonly toggle: () => void;
}

const useCommandPalette = create<CommandPaletteState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
  toggle: () => set((state) => ({ open: !state.open }))
}));

export const CommandPalette = () => {
  const { t } = useTranslation();
  const open = useCommandPalette((state) => state.open);
  const toggle = useCommandPalette((state) => state.toggle);
  const setOpen = useCommandPalette((state) => state.setOpen);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => {
        inputRef.current?.focus({ preventScroll: true });
      });
    }
  }, [open]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [toggle]);

  useEffect(() => {
    const clickHandler = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('[data-command="toggle-command-palette"]')) {
        toggle();
      }
    };
    window.addEventListener('click', clickHandler);
    return () => window.removeEventListener('click', clickHandler);
  }, [toggle]);

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm" />
        <Dialog.Content asChild>
          <div className="fixed left-1/2 top-24 w-full max-w-xl -translate-x-1/2 rounded-2xl border border-slate-800 bg-slate-950/95 shadow-2xl">
            <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-3">
              <Search className="h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                ref={inputRef}
                type="search"
                placeholder={t('commandPalette.placeholder')}
                className="flex-1 bg-transparent text-sm text-slate-100 outline-none placeholder:text-slate-500"
              />
              <kbd className="rounded border border-slate-700 bg-slate-900 px-2 py-1 text-[10px] uppercase text-slate-400">
                {t('commandPalette.shortcut')}
              </kbd>
            </div>
            <div className="space-y-1 p-2">
              <CommandPaletteItem icon={Command} label={t('commandPalette.toggle')} />
              <CommandPaletteItem icon={Sparkles} label={t('commandPalette.startNoteWithAi')} disabled />
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

interface CommandPaletteItemProps {
  readonly icon: typeof Command;
  readonly label: string;
  readonly disabled?: boolean;
}

const CommandPaletteItem = ({ icon: Icon, label, disabled }: CommandPaletteItemProps) => (
  <button
    type="button"
    disabled={disabled}
    className={clsx(
      'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition',
      disabled ? 'cursor-not-allowed opacity-40' : 'hover:bg-slate-900'
    )}
  >
    <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
    <span>{label}</span>
  </button>
);
