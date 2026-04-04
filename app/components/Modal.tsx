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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[#1A1D27] border border-[#2A2D3A] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[#2A2D3A] px-5 py-4">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#8B8FA8] hover:bg-white/5 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
        {actions && (
          <div className="border-t border-[#2A2D3A] px-5 py-4 flex justify-end gap-3">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}
