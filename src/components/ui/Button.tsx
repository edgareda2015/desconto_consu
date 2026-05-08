import React from 'react';
import { cn } from '../../lib/cn';
import { Loader2 } from 'lucide-react';
import { motion, HTMLMotionProps } from 'framer-motion';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg' | 'xl';

export interface ButtonProps extends Omit<HTMLMotionProps<"button">, 'children'> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

const variantStyles: Record<Variant, string> = {
  primary:   'bg-navy-900 text-white shadow-sm hover:bg-navy-800 ring-1 ring-transparent hover:shadow-md',
  secondary: 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200 shadow-sm hover:border-slate-300',
  outline:   'bg-transparent border border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  ghost:     'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  danger:    'bg-red-50 text-red-600 hover:bg-red-100 border border-red-100',
  success:   'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-100',
};

const sizeStyles: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5 rounded-md',
  md: 'h-9 px-4 text-[13px] gap-2 rounded-md',
  lg: 'h-10 px-5 text-[14px] gap-2 rounded-lg',
  xl: 'h-11 px-6 text-[14px] gap-2.5 rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.98 }}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        'outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-1',
        'active:scale-[0.98]',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      disabled={disabled || isLoading}
      {...(props as any)}
    >
      {isLoading ? (
        <Loader2 size={size === 'sm' ? 14 : 18} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span className="truncate">{children}</span>
    </motion.button>
  );
}
