import React from 'react';
import { Info } from 'lucide-react';

interface ToastProps {
  message: string | null;
  onDismiss: () => void;
}

/** Fixed bottom banner replacing `window.alert` for one-shot, non-blocking notifications. */
export const Toast: React.FC<ToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div className="fixed bottom-4 inset-x-0 z-[70] flex justify-center px-4 pointer-events-none">
      <div className="pointer-events-auto max-w-md w-full bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-3.5 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-150">
        <Info className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <p className="text-xs text-slate-200 flex-1">{message}</p>
        <button
          type="button"
          onClick={onDismiss}
          className="text-slate-500 hover:text-white text-sm leading-none px-1"
        >
          ✕
        </button>
      </div>
    </div>
  );
};
