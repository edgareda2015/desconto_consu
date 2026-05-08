import React from 'react';
import { cn } from '../../lib/cn';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md';
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Aguardando análise':          { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  'Aguardando envio':            { bg: 'bg-slate-100',   text: 'text-slate-600',   dot: 'bg-slate-400' },
  'Liberado para coordenação':   { bg: 'bg-purple-50',   text: 'text-purple-700',  dot: 'bg-purple-500' },
  'Chamado aberto':              { bg: 'bg-blue-50',     text: 'text-blue-700',    dot: 'bg-blue-500' },
  'Deferido':                    { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
  'Indeferido':                  { bg: 'bg-amber-50',    text: 'text-amber-700',   dot: 'bg-amber-500' },
  'Enviado':                     { bg: 'bg-sky-50',      text: 'text-sky-700',     dot: 'bg-sky-500' },
  'Finalizado':                  { bg: 'bg-emerald-50',  text: 'text-emerald-700', dot: 'bg-emerald-500' },
};

const defaultConfig = { bg: 'bg-gray-100', text: 'text-gray-700', dot: 'bg-gray-500' };

export function StatusBadge({ status, size = 'sm' }: StatusBadgeProps) {
  const cfg = statusConfig[status] || defaultConfig;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap',
        cfg.bg, cfg.text,
        size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-[12px]',
      )}
    >
      <span className={cn('w-1.5 h-1.5 rounded-full animate-pulse-dot', cfg.dot)} />
      {status}
    </span>
  );
}

export function getRowColorClass(status: string, reprocessada?: boolean): string {
  if (reprocessada) return 'bg-amber-100/80 hover:bg-amber-200/90 transition-colors';
  if (status === 'Deferido' || status === 'Finalizado') return 'bg-emerald-100/70 hover:bg-emerald-200/80 transition-colors';
  if (status === 'Indeferido') return 'bg-red-100/70 hover:bg-red-200/80 transition-colors';
  return 'hover:bg-slate-50 transition-colors';
}
