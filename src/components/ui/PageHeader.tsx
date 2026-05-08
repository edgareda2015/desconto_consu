import React from 'react';
import { cn } from '../../lib/cn';

interface PageHeaderProps {
  title: string;
  description?: string;
  badge?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, badge, action, className }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-1', className)}>
      <div className="flex items-center gap-3 min-w-0">
        <div className="min-w-0">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h1 className="text-[22px] sm:text-[26px] font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
            {badge}
          </div>
          {description && (
            <p className="text-[13px] sm:text-[14px] text-slate-500 mt-1.5 leading-relaxed">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
