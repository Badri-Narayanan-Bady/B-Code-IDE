import React, { useState } from 'react';
import { X, Copy, Check, Users, Shield, Globe, Lock } from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeCollaboratorsCount: number;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, activeCollaboratorsCount }) => {
  const [copied, setCopied] = useState(false);
  const [role, setRole] = useState<'editor' | 'viewer'>('editor');

  if (!isOpen) return null;

  const shareUrl = window.location.href;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl p-5 text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-600/20 text-cyan-400 flex items-center justify-center">
              <Users size={18} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Share Workspace</h3>
              <p className="text-[11px] text-neutral-400">Invite peers to edit, run, and debug simultaneously</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white">
            <X size={16} />
          </button>
        </div>

        <div className="mt-4 space-y-4 text-xs">
          <div>
            <label className="block text-neutral-400 mb-1.5 font-medium">Workspace Live Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="flex-1 bg-neutral-950 border border-neutral-750 rounded px-3 py-2 text-white font-mono text-[11px] outline-none"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-medium rounded flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div className="bg-neutral-950 border border-neutral-800 rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Globe size={15} className="text-emerald-400" />
                <div>
                  <div className="font-semibold text-white">Real-time Cross-Tab Sync</div>
                  <div className="text-[11px] text-neutral-400">Syncs cursors, terminal, and edits across browser tabs</div>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-emerald-950 text-emerald-300 border border-emerald-800 rounded text-[10px] font-mono">
                Active
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-neutral-800">
            <span className="text-neutral-400">{activeCollaboratorsCount} collaborator(s) online</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-neutral-800 hover:bg-neutral-750 border border-neutral-700 rounded text-neutral-200 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
