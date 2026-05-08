import React from 'react';
import { cn } from '../../lib/cn';
import { AlertCircle } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  rightSlot?: React.ReactNode;
  labelRight?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, rightSlot, labelRight, className, required, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <div className="flex items-center justify-between mb-2.5">
          <label className="text-[13px] font-semibold text-slate-800">
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          {labelRight}
        </div>
      )}
      <div
        className={cn(
          'flex items-center rounded-lg transition-all duration-150',
          'bg-white border border-slate-200 shadow-sm',
          'focus-within:border-slate-400 focus-within:ring-1 focus-within:ring-slate-400',
          error && 'border-red-500 bg-red-50/30 focus-within:border-red-500 focus-within:ring-red-500',
        )}
      >
        {icon && <div className="pl-3.5 text-navy-400 shrink-0">{icon}</div>}
        <input
          ref={ref}
          className={cn(
            'w-full h-11 bg-transparent px-4 text-[14px] font-medium text-navy-900',
            'placeholder:text-slate-400 outline-none',
            !icon && 'pl-4',
            className
          )}
          required={required}
          {...props}
        />
        {rightSlot && <div className="pr-3 shrink-0">{rightSlot}</div>}
      </div>
      {error && (
        <p className="text-[12px] font-medium text-red-500 mt-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
);
Input.displayName = 'Input';
