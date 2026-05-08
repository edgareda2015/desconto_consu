import React from 'react';
import { cn } from '../../lib/cn';
import { AlertCircle, ChevronDown } from 'lucide-react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, placeholder, className, required, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-semibold text-navy-900 mb-2">
          {label}
          {required && <span className="text-brand-red ml-0.5">*</span>}
        </label>
      )}
      <div className="relative">
        <select
          ref={ref}
          className={cn(
            'w-full h-10 bg-white border border-slate-200 rounded-xl shadow-sm',
            'px-3.5 pr-9 text-[13px] font-medium text-navy-900 appearance-none',
            'focus:border-navy-500 focus:ring-1 focus:ring-navy-500 focus:outline-none',
            'transition-all duration-200 cursor-pointer',
            error && 'border-red-500',
            className
          )}
          required={required}
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ChevronDown size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-navy-400 pointer-events-none" />
      </div>
      {error && (
        <p className="text-[12px] font-medium text-red-500 mt-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
);
Select.displayName = 'Select';
