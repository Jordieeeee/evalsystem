import { AlertTriangle, RefreshCw } from 'lucide-react';

export const ErrorState = ({
  title = 'Something went wrong',
  message = 'We were unable to load this data. Please try again.',
  onRetry
}) => {
  return (
    <div className="flex flex-col items-center justify-center h-[50vh] text-center px-4">
      <div className="p-4 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100">
        <AlertTriangle size={28} />
      </div>
      <h3 className="mt-4 text-lg font-serif font-black text-slate-900 tracking-tight">
        {title}
      </h3>
      <p className="mt-1 max-w-md text-xs font-semibold text-slate-400">
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-5 flex items-center gap-2 bg-[#0F2A1D] text-[#E3EED4] text-xs font-black uppercase tracking-wider px-5 py-3 rounded-xl hover:bg-[#375534] transition-all shadow-sm active:scale-[0.98]"
        >
          <RefreshCw size={14} /> Try Again
        </button>
      )}
    </div>
  );
};
