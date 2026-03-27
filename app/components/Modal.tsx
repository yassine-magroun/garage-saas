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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white border border-gray-200 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-3">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <button onClick={onClose} className="p-1 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {actions && <div className="border-t border-gray-100 px-5 py-3 bg-gray-50 flex justify-end gap-2">{actions}</div>}
      </div>
    </div>
  );
}
