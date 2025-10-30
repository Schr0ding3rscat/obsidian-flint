import clsx from 'clsx';
import type { LucideIcon } from 'lucide-react';
import type { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: 'primary' | 'ghost' | 'outline';
  readonly size?: 'sm' | 'md';
  readonly icon?: LucideIcon;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  className,
  children,
  type,
  ...props
}: ButtonProps) => {
  return (
    <button
      type={type ?? 'button'}
      className={clsx(
        'inline-flex items-center gap-2 rounded-md font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:opacity-50',
        {
          'bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 text-sm': variant === 'primary',
          'border border-slate-700 bg-transparent px-4 py-2 text-sm hover:bg-slate-800': variant === 'outline',
          'bg-transparent px-3 py-2 text-sm hover:bg-slate-800': variant === 'ghost'
        },
        {
          'px-3 py-1 text-xs': size === 'sm',
          'px-4 py-2 text-sm': size === 'md'
        },
        className
      )}
      {...props}
    >
      {Icon ? <Icon className="h-4 w-4" aria-hidden="true" /> : null}
      <span>{children}</span>
    </button>
  );
};
