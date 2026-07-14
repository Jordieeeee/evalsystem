import { Loader2 } from 'lucide-react';

export const LoadingSpinner = ({ size = 32, label, className = 'h-[50vh]' }) => (
  <div className={`flex flex-col justify-center items-center text-[#375534] ${label ? 'space-y-4' : ''} ${className}`}>
    <Loader2 className="animate-spin" size={size} />
    {label && (
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400">{label}</p>
    )}
  </div>
);
