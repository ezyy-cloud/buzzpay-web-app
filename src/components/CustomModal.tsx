import React, { ReactNode } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

interface CustomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
  title: string;
  message: string;
  type?: 'confirm' | 'alert';
  confirmText?: string;
  cancelText?: string;
}

export function CustomModal({
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message, 
  type = 'confirm',
  confirmText = 'OK',
  cancelText = 'Cancel'
}: CustomModalProps) {
  if (!isOpen) return null;

  const renderIcon = () => {
    switch (type) {
      case 'confirm':
        return <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />;
      case 'alert':
        return <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-sm w-full p-6 relative">
        <button 
          onClick={onClose} 
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <X className="w-6 h-6" />
        </button>

        {renderIcon()}

        <h2 className="text-xl font-bold text-center mb-4 text-gray-900 dark:text-white">
          {title}
        </h2>

        <p className="text-center text-gray-600 dark:text-gray-300 mb-6 whitespace-pre-line">
          {message}
        </p>

        <div className="flex space-x-4">
          {type === 'confirm' && (
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-900 dark:text-white rounded-md"
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={onConfirm || onClose}
            className={`flex-1 px-4 py-2 rounded-md ${
              type === 'confirm' 
                ? 'bg-green-500 text-white hover:bg-green-600' 
                : 'bg-red-500 text-white hover:bg-red-600'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
