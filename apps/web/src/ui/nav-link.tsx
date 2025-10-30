import { Link } from '@tanstack/react-router';
import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';

interface NavLinkProps {
  readonly to: string;
  readonly label: string;
  readonly icon: LucideIcon;
  readonly disabled?: boolean;
}

export const NavLink = ({ to, label, icon: Icon, disabled }: NavLinkProps) => {
  const content = (
    <span className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition hover:bg-slate-800/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <Icon className="h-4 w-4" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );

  if (disabled) {
    return (
      <div className={clsx('cursor-not-allowed opacity-40', 'focus-visible:outline-none')} aria-disabled="true">
        {content}
      </div>
    );
  }

  return (
    <Link to={to} activeProps={{ className: 'bg-slate-800/80 text-white' }} className="block">
      {content}
    </Link>
  );
};
