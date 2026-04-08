import React from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
  zIndex?: number;
}

const sizeClasses = {
  sm: 'max-w-2xl',
  md: 'max-w-3xl',
  lg: 'max-w-4xl',
};

export function Modal({ isOpen, onClose, title, children, size = 'md', zIndex = 50 }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 bg-black/10 backdrop-blur-md flex items-center justify-center p-4`} style={{ zIndex }}>

      <div className={`w-full ${sizeClasses[size]} bg-white rounded-2xl shadow-2xl border border-gray-200 p-6 sm:p-8 relative`}>
        {title && (
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            {title}
          </h2>
        )}
        
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors duration-200"
        >
          <XMarkIcon className="w-6 h-6" />
        </button>

        <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
          {children}
        </div>
      </div>
    </div>
  );
}
