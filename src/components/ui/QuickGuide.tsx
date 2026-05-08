import React, { useState, useEffect } from 'react';
import { X, HelpCircle } from 'lucide-react';
import { Button } from './Button';
import { Modal } from './Modal';

interface GuideStep {
  text: string;
  strongText?: string;
}

interface QuickGuideProps {
  title: string;
  steps: GuideStep[];
  icon?: React.ReactNode;
  storageKey: string;
}

export function QuickGuide({ title, steps, icon, storageKey }: QuickGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const hidden = localStorage.getItem(`hide_guide_${storageKey}`);
    if (!hidden) {
      setIsVisible(true);
    }
  }, [storageKey]);

  const handleCloseClick = () => {
    setShowConfirmModal(true);
  };

  const handlePreference = (dontShowAgain: boolean) => {
    if (dontShowAgain) {
      localStorage.setItem(`hide_guide_${storageKey}`, 'true');
    }
    setIsVisible(false);
    setShowConfirmModal(false);
  };

  if (!isVisible) return null;

  return (
    <>
      <div className="bg-gradient-to-r from-navy-50 to-white border border-navy-100 rounded-2xl p-5 mb-8 shadow-sm relative animate-fade-in group">
        <button 
          onClick={handleCloseClick}
          className="absolute top-3 right-3 p-1.5 rounded-lg text-navy-300 hover:text-navy-600 hover:bg-navy-100 transition-all opacity-0 group-hover:opacity-100"
          title="Fechar guia"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-4">
          <div className="bg-brand-blue/10 p-2.5 rounded-xl">
            {icon || <HelpCircle className="text-brand-blue" size={24} />}
          </div>
          <div className="flex-1">
            <h3 className="text-navy-900 font-bold text-[15px] mb-2">{title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {steps.map((step, index) => (
                <div key={index} className="flex gap-2.5">
                  <span className="flex items-center justify-center h-5 w-5 rounded-full bg-brand-blue text-white text-[11px] font-bold shrink-0 mt-0.5">
                    {index + 1}
                  </span>
                  <p className="text-[12px] text-navy-600 leading-snug">
                    {step.text.split('<strong>').map((part, i) => {
                      if (part.includes('</strong>')) {
                        const [strong, rest] = part.split('</strong>');
                        return <React.Fragment key={i}><strong>{strong}</strong>{rest}</React.Fragment>;
                      }
                      return part;
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="Ocultar Guia de Instruções?"
        description="Você deseja que esta mensagem apareça novamente nos próximos acessos?"
        size="sm"
      >
        <div className="space-y-4 pt-2">
          <div className="flex flex-col gap-3">
            <Button 
              variant="primary" 
              className="w-full bg-navy-900" 
              onClick={() => handlePreference(false)}
            >
              Sim, mostrar no próximo acesso
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-slate-200 text-slate-600" 
              onClick={() => handlePreference(true)}
            >
              Não, oculte permanentemente
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
