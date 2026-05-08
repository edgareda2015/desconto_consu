import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  className?: string;
}

const sizeMap = {
  sm:   'max-w-[420px]',
  md:   'max-w-[520px]',
  lg:   'max-w-[680px]',
  xl:   'max-w-[800px]',
  full: 'max-w-[90vw]',
};

export function Modal({ isOpen, onClose, title, description, children, size = 'md', className }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[2px]"
            onClick={onClose}
          />
          
          {/* Scrollable outer container — permite scroll quando modal é grande */}
          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center py-8 px-6 sm:py-12 sm:px-8 md:px-10">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 12 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                onClick={(e) => e.stopPropagation()}
                className={cn(
                  'relative w-full',
                  'bg-white rounded-2xl',
                  'shadow-[0_20px_60px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]',
                  'border border-slate-200',
                  'max-h-[calc(100vh-6rem)] overflow-hidden flex flex-col',
                  sizeMap[size],
                  className
                )}
              >
                {/* Header — fixo no topo */}
                <div className="flex items-start justify-between px-7 sm:px-8 pt-7 pb-5 border-b border-slate-100 shrink-0">
                  <div className="pr-4 min-w-0">
                    <h3 className="text-[18px] font-bold text-slate-900 tracking-tight leading-tight">{title}</h3>
                    {description && (
                      <p className="text-[13px] font-medium text-slate-500 mt-1.5 leading-relaxed">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-2 -mr-2 -mt-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all shrink-0"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Body — scrollável */}
                <div className="flex-1 overflow-y-auto px-7 sm:px-8 py-7 min-h-0">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : null;
}
