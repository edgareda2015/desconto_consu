import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'elevated' | 'flat' | 'outline';
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const paddingMap = {
  none: '',
  sm: 'p-4 sm:p-5',
  md: 'p-5 sm:p-6',
  lg: 'p-6 sm:p-8',
};

const variantMap = {
  elevated: 'bg-white border border-slate-200 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-card-hover)]',
  flat:     'bg-white border border-slate-200',
  outline:  'bg-transparent border border-slate-200',
};

export function Card({ children, className, variant = 'elevated', padding = 'md' }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-[var(--radius-xl)] transition-shadow duration-300 w-full',
        variantMap[variant],
        paddingMap[padding],
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('pb-5 border-b border-slate-100', className)}>
      {children}
    </div>
  );
}

export function CardBody({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('pt-5', className)}>
      {children}
    </div>
  );
}
