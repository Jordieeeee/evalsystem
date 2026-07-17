import { Loader2 } from 'lucide-react';

/**
 * The section-level loading animation, lifted from the Reports section so every
 * area shows the same thing while it waits.
 *
 * Two layers: a slate ring whose top arc spins in the accent colour, and a
 * pulsing Loader2 centred inside it.
 *
 * `accent` drives both layers. It is applied via inline style rather than a
 * Tailwind class because `border-t-[...]` is an arbitrary value and cannot be
 * built from a runtime variable.
 *
 * `className` owns the frame (height/background), so a full-page loader and one
 * nested inside a panel can share the animation without inheriting 65vh.
 */
export default function LoadingState({
  label = 'Loading...',
  accent = '#7D1924',
  className = 'h-[65vh] bg-[#f8faf7]/50 rounded-3xl border border-slate-100'
}) {
  return (
    <div className={`flex flex-col justify-center items-center gap-4 ${className}`}>
      <div className="relative flex items-center justify-center">
        <div
          className="w-12 h-12 rounded-full border-4 border-slate-100 animate-spin"
          style={{ borderTopColor: accent }}
        />
        <Loader2 className="absolute animate-pulse" size={18} style={{ color: accent }} />
      </div>
      <span className="text-xs font-black uppercase tracking-widest text-slate-400">{label}</span>
    </div>
  );
}
