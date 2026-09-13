import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { useEscapeKey } from '../../hooks/useEscapeKey';

interface ConfirmDialogProps {
  isOpen: boolean;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Presentational replacement for `window.confirm`, styled to match the app's modal chrome. */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = true,
  onConfirm,
  onCancel,
}) => {
  useEscapeKey(isOpen, onCancel);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 space-y-3">
          <div
            className={`flex items-center gap-2.5 font-bold text-sm ${danger ? 'text-rose-300' : 'text-amber-300'}`}
          >
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>Confirm Action</span>
          </div>
          <p className="text-xs text-slate-300">{message}</p>
        </div>
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            className="py-2 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold text-xs rounded-xl transition"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`py-2 px-4 font-bold text-xs rounded-xl transition text-white ${
              danger
                ? 'bg-rose-600 hover:bg-rose-500'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};
