import React from 'react';
import { cn } from '../../lib/cn';
import { AlertCircle } from 'lucide-react';

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className, required, ...props }, ref) => (
    <div className="w-full">
      {label && (
        <label className="block text-[13px] font-semibold text-navy-900 mb-2">
          {label}
          {required && <span className="text-brand-red ml-0.5">*</span>}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          'w-full bg-white border border-slate-200 rounded-xl shadow-sm',
          'px-3.5 py-3 text-[13px] font-medium text-navy-900 resize-none',
          'placeholder:text-navy-400/60 outline-none',
          'focus:border-navy-500 focus:ring-1 focus:ring-navy-500',
          'transition-all duration-200',
          error && 'border-red-500',
          className
        )}
        required={required}
        rows={3}
        {...props}
      />
      {error && (
        <p className="text-[12px] font-medium text-red-500 mt-1.5 flex items-center gap-1.5">
          <AlertCircle size={12} /> {error}
        </p>
      )}
    </div>
  )
);
Textarea.displayName = 'Textarea';
