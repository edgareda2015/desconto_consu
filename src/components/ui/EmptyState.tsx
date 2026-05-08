import React from 'react';
import { cn } from '../../lib/cn';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn(
      "flex flex-col items-center justify-center py-12 px-6 sm:py-16 sm:px-8 text-center",
      className
    )}>
      <div className="w-14 h-14 rounded-full bg-slate-50 flex items-center justify-center mb-5 border border-slate-100 shadow-sm">
        {icon || <Inbox size={26} className="text-slate-400" />}
      </div>
      <h3 className="text-[15px] font-bold text-slate-900 mb-1.5">{title}</h3>
      {description && (
        <p className="text-[13px] text-slate-500 max-w-sm leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
