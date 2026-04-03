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
        className={`px-4 py-3 rounded-xl shadow-lg border transition-all duration-300 ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <p className="text-sm font-medium">{toast.message}</p>
        </div>
      </div>
    </div>
  );
}
