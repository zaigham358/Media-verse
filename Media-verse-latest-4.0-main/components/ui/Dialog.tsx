import React, { useEffect } from 'react';
import { XIcon } from '../icons';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const Dialog: React.FC<DialogProps> = ({ isOpen, onClose, title, children }) => {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            onClose();
        }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 z-50 flex justify-center items-center p-4" onClick={onClose}>
      <div 
        className="bg-card-bg rounded-lg shadow-xl w-full max-w-4xl flex flex-col max-h-[90vh] animate-dialog-scale-in" 
        onClick={e => e.stopPropagation()} 
        onWheel={e => e.stopPropagation()}
      >
        <div className="flex-shrink-0 p-6 pb-4 border-b border-border-color">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-text-primary font-display">{title}</h2>
            <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
              <XIcon className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6">
            {children}
        </div>
      </div>
    </div>
  );
};

export default Dialog;