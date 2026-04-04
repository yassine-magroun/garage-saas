'use client';

type ToastData = {
  message: string;
  type: 'success' | 'error';
};

export default function Toast({ toast }: { toast: ToastData | null }) {
  if (!toast) return null;
  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div
        className={`px-4 py-3 rounded-xl shadow-xl border transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-[#1A2A1E] border-emerald-500/30 text-emerald-400'
            : 'bg-[#2A1A1A] border-red-500/30 text-red-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
            }`}
          />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
