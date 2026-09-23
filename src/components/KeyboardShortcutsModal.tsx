import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'F5', description: 'Run code in active sandbox' },
    { key: 'Ctrl / Cmd + S', description: 'Download / Save code file' },
    { key: 'Ctrl / Cmd + F', description: 'Find & Replace in code' },
    { key: 'Alt + Shift + F', description: 'Format document' },
    { key: 'Alt + A', description: 'Static Code Analyzer (Cyclomatic & Big-O)' },
    { key: 'Tab', description: 'Indent code (inserts spaces)' },
    { key: 'Esc', description: 'Close modals / find bar' },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 select-none">
      <div className="bg-neutral-900 border border-neutral-750 rounded-xl max-w-md w-full shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-neutral-800 border border-neutral-700 flex items-center justify-center text-cyan-400">
              <Keyboard size={16} />
            </div>
            <h2 className="text-sm font-semibold text-white tracking-tight">Keyboard Shortcuts</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* List */}
        <div className="p-4 space-y-2 text-xs">
          {shortcuts.map((sc, i) => (
            <div
              key={i}
              className="flex items-center justify-between py-2 px-3 rounded bg-neutral-950/50 border border-neutral-850"
            >
              <span className="text-neutral-300 font-medium">{sc.description}</span>
              <kbd className="px-2 py-0.5 bg-neutral-800 border border-neutral-700 rounded text-[11px] font-mono text-cyan-300 font-semibold shadow-inner">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-neutral-800 bg-neutral-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
