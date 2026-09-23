import React from 'react';
import { CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { ToastMessage } from '../types/ide';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => {
        const icons = {
          success: <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />,
          info: <Info size={16} className="text-cyan-400 shrink-0" />,
          warn: <AlertTriangle size={16} className="text-amber-400 shrink-0" />,
          error: <AlertCircle size={16} className="text-rose-400 shrink-0" />,
        };

        const borders = {
          success: 'border-emerald-500/40 bg-neutral-900/95 shadow-emerald-500/10',
          info: 'border-cyan-500/40 bg-neutral-900/95 shadow-cyan-500/10',
          warn: 'border-amber-500/40 bg-neutral-900/95 shadow-amber-500/10',
          error: 'border-rose-500/40 bg-neutral-900/95 shadow-rose-500/10',
        };

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-lg border shadow-xl backdrop-blur-md transition-all animate-in fade-in slide-in-from-bottom-2 ${borders[toast.type]}`}
          >
            <div className="mt-0.5">{icons[toast.type]}</div>
            <div className="flex-1 min-w-0">
              {toast.title && (
                <div className="text-xs font-semibold text-white tracking-tight">{toast.title}</div>
              )}
              <div className="text-xs text-neutral-300 mt-0.5 break-words leading-relaxed">
                {toast.message}
              </div>
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-neutral-400 hover:text-white p-0.5 transition-colors cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};
