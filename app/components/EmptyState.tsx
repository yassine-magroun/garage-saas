'use client';

import type { ComponentType } from 'react';

interface EmptyStateProps {
  icon: ComponentType<{ className?: string }>;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'py-10' : 'py-20'}`}>
      <div className="w-14 h-14 rounded-2xl bg-[#FF6B2B]/10 border border-[#FF6B2B]/20 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7 text-[#FF6B2B]/70" />
      </div>
      <h3 className="text-base font-semibold text-white mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-[#8B8FA8] max-w-xs mb-5">{description}</p>
      )}
      {(action || secondaryAction) && (
        <div className="flex items-center gap-2 mt-2">
          {action && (
            <button
              onClick={action.onClick}
              className="px-4 py-2 bg-[#FF6B2B] text-white text-sm font-medium rounded-lg hover:bg-[#E55A1F] transition-colors"
            >
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="px-4 py-2 border border-[#2A2D3A] text-[#8B8FA8] text-sm font-medium rounded-lg hover:bg-white/5 hover:text-white transition-colors"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
