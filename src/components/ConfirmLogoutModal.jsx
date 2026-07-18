import { useEffect, useRef, useCallback, useState } from 'react';
import { LogOut } from 'lucide-react';

/**
 * ConfirmLogoutModal — shared by Admin and Student dashboards.
 *
 * Props:
 * - isOpen: boolean
 * - onCancel: () => void
 * - onConfirm: () => void (async-safe, the component handles its own loading state)
 *
 * Features:
 * - Maroon/white TLSU theme matching the portal design system
 * - Overlay backdrop with click-outside-to-cancel
 * - Centered card with rounded corners
 * - Subtle enter/exit CSS transition
 * - Focus trap between Cancel and Logout buttons
 * - Esc key to cancel
 */
export default function ConfirmLogoutModal({ isOpen, onCancel, onConfirm }) {
  const [isClosing, setIsClosing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const cancelRef = useRef(null);
  const logoutRef = useRef(null);
  const overlayRef = useRef(null);

  // Graceful close with exit animation
  const handleClose = useCallback(() => {
    if (isLoggingOut) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onCancel();
    }, 150);
  }, [onCancel, isLoggingOut]);

  // Confirm logout with loading state
  const handleConfirm = useCallback(async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      await onConfirm();
    } catch {
      setIsLoggingOut(false);
    }
  }, [onConfirm, isLoggingOut]);

  // Esc key handler
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleClose();
      }
      // Focus trap: Tab cycles between Cancel and Logout
      if (e.key === 'Tab') {
        const focusable = [cancelRef.current, logoutRef.current].filter(Boolean);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handleClose]);

  // Focus the cancel button when modal opens
  useEffect(() => {
    if (isOpen && cancelRef.current) {
      // Small delay to let the animation start
      requestAnimationFrame(() => cancelRef.current?.focus());
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIsClosing(false);
      setIsLoggingOut(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const overlayClass = isClosing ? 'modal-overlay-exit' : 'modal-overlay-enter';
  const cardClass = isClosing ? 'modal-card-exit' : 'modal-card-enter';

  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 ${overlayClass}`}
      style={{ backgroundColor: 'rgba(125, 25, 36, 0.15)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
      onClick={(e) => {
        if (e.target === overlayRef.current) handleClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="logout-modal-title"
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden ${cardClass}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Body */}
        <div className="p-8 text-center">
          {/* Icon */}
          <div className="w-14 h-14 bg-[#7D1924]/8 rounded-2xl flex items-center justify-center mx-auto mb-5">
            <LogOut size={26} className="text-[#7D1924]" />
          </div>

          {/* Title */}
          <h3
            id="logout-modal-title"
            className="text-lg font-black text-slate-900 tracking-tight"
          >
            Confirm Logout
          </h3>

          {/* Body text */}
          <div className="mt-3 space-y-1.5">
            <p className="text-sm text-slate-600 font-medium">
              Are you sure you want to logout?
            </p>
            <p className="text-xs text-slate-400 font-medium">
              You will need to sign in again to access your account.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-8 pb-7 flex gap-3">
          <button
            ref={cancelRef}
            onClick={handleClose}
            disabled={isLoggingOut}
            className="flex-1 px-5 py-2.5 rounded-xl border-2 border-slate-200 bg-white text-slate-700 text-xs font-bold uppercase tracking-wider hover:bg-slate-50 hover:border-slate-300 transition-all focus:outline-none focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 disabled:opacity-40"
          >
            Cancel
          </button>
          <button
            ref={logoutRef}
            onClick={handleConfirm}
            disabled={isLoggingOut}
            className="flex-1 px-5 py-2.5 rounded-xl bg-[#7D1924] text-white text-xs font-black uppercase tracking-wider hover:bg-[#63121b] transition-all shadow-sm focus:outline-none focus:ring-2 focus:ring-[#7D1924]/50 focus:ring-offset-1 disabled:opacity-70 flex items-center justify-center gap-2"
          >
            {isLoggingOut ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Signing Out…
              </>
            ) : (
              'Logout'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
