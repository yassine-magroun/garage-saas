'use client';

import { X } from 'lucide-react';

type ModalProps = {
  isOpen: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export default function Modal({ isOpen, title, onClose, children, actions }: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-lg max-h-[90vh] rounded-xl bg-white border border-gray-200 shadow-xl dark:bg-slate-900 dark:border-slate-700 overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3 dark:border-slate-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-100">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 overflow-y-auto max-h-[calc(90vh-110px)]">{children}</div>
        {actions && <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-end gap-2 dark:border-slate-700 dark:bg-slate-800">{actions}</div>}
      </div>
    </div>
  );
}
