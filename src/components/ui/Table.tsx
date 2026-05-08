import React from 'react';
import { cn } from '../../lib/cn';

export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn(
      'w-full bg-white border border-slate-200/80 rounded-lg shadow-sm overflow-hidden',
      className
    )}>
      <div className="w-full overflow-x-auto scrollbar-thin">
        <table className="w-full border-collapse text-left">
          {children}
        </table>
      </div>
    </div>
  );
}

export function Thead({ children }: { children: React.ReactNode }) {
  return <thead className="bg-slate-50/80 border-b border-slate-200">{children}</thead>;
}

export function Tbody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-slate-100">{children}</tbody>;
}

export function Tr({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <tr className={cn(
      'group transition-colors hover:bg-slate-50/50',
      className
    )}>
      {children}
    </tr>
  );
}

interface ThProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
}

export function Th({ children, className, align = 'left' }: ThProps) {
  return (
    <th 
      className={cn(
        'px-4 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap',
        'first:pl-6 last:pr-6', // Extra padding for first and last columns
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {children}
    </th>
  );
}

interface TdProps {
  children: React.ReactNode;
  className?: string;
  align?: 'left' | 'center' | 'right';
  colSpan?: number;
}

export function Td({ children, className, align = 'left', colSpan }: TdProps) {
  return (
    <td 
      colSpan={colSpan}
      className={cn(
        'px-4 py-4 text-[12px] text-slate-700 font-medium',
        'first:pl-6 last:pr-6', // Extra padding for first and last columns
        align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left',
        className
      )}
    >
      {children}
    </td>
  );
}
