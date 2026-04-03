'use client';

export default function SkeletonLoader({ count = 3, variant = 'card' }: { count?: number; variant?: 'card' | 'list' | 'table' }) {
  if (variant === 'card') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-3"></div>
                <div className="h-8 bg-gray-200 rounded-md w-1/2"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-xl ml-4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className="space-y-3">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200/60 p-4 animate-pulse">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex-shrink-0"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded-md w-1/3 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded-md w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-200/60 shadow-sm p-6 animate-pulse">
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded-md w-1/4"></div>
            <div className="h-3 bg-gray-200 rounded-md w-full"></div>
            <div className="h-3 bg-gray-200 rounded-md w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
