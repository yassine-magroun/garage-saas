'use client';

interface SkeletonLoaderProps {
  count?: number;
  variant?: 'card' | 'list' | 'table' | 'kanban';
}

export default function SkeletonLoader({ count = 3, variant = 'card' }: SkeletonLoaderProps) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-5 skeleton">
            <div className="flex items-center justify-between mb-4">
              <div className="h-3 bg-[#2A2D3A] rounded w-1/3" />
              <div className="w-9 h-9 bg-[#2A2D3A] rounded-xl" />
            </div>
            <div className="h-7 bg-[#2A2D3A] rounded w-1/2 mb-1" />
            <div className="h-3 bg-[#2A2D3A] rounded w-2/3" />
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-2">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] p-4 skeleton">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-[#2A2D3A] rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-[#2A2D3A] rounded w-1/3" />
                <div className="h-3 bg-[#2A2D3A] rounded w-1/5" />
              </div>
              <div className="h-6 bg-[#2A2D3A] rounded-full w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="bg-[#1A1D27] rounded-xl border border-[#2A2D3A] overflow-hidden">
        <div className="grid grid-cols-4 gap-4 px-4 py-3 border-b border-[#2A2D3A]">
          {[1, 2, 3, 4].map(c => <div key={c} className="h-3 bg-[#2A2D3A] rounded skeleton" />)}
        </div>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="grid grid-cols-4 gap-4 px-4 py-3.5 border-b border-[#2A2D3A]/50 last:border-0">
            {[1, 2, 3, 4].map(c => (
              <div key={c} className={`h-3 bg-[#2A2D3A] rounded skeleton ${c === 1 ? 'w-full' : c === 4 ? 'w-16' : 'w-3/4'}`} />
            ))}
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'kanban') {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="bg-[#1A1D27]/50 rounded-xl border border-[#2A2D3A] p-3 space-y-2">
            <div className="h-3 bg-[#2A2D3A] rounded w-1/2 skeleton mb-3" />
            {Array.from({ length: col === 0 ? 3 : col === 1 ? 2 : 1 }).map((_, j) => (
              <div key={j} className="bg-[#1A1D27] rounded-lg border border-[#2A2D3A] p-3 skeleton space-y-2">
                <div className="h-3 bg-[#2A2D3A] rounded w-3/4" />
                <div className="h-2.5 bg-[#2A2D3A] rounded w-1/2" />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  return null;
}
