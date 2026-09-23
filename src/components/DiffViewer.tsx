import React from 'react';
import { X, ArrowRight, GitCommit } from 'lucide-react';
import { VFSNode } from '../types/ide';

interface DiffViewerProps {
  file: VFSNode;
  onClose: () => void;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({ file, onClose }) => {
  const originalLines = (file.originalContent ?? file.content ?? '').split('\n');
  const currentLines = (file.content ?? '').split('\n');

  const maxLines = Math.max(originalLines.length, currentLines.length);

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d1117] text-neutral-200 select-none overflow-hidden font-mono text-xs">
      {/* Diff Header */}
      <div className="h-9 bg-neutral-900 border-b border-neutral-800 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <GitCommit size={14} className="text-cyan-400" />
          <span className="font-semibold">{file.name}</span>
          <span className="text-[11px] text-neutral-500">(Working Tree Comparison)</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white"
        >
          <X size={14} />
        </button>
      </div>

      {/* Side-by-side header */}
      <div className="grid grid-cols-2 bg-neutral-850 border-b border-neutral-800 text-[11px] text-neutral-400 font-sans py-1 px-3">
        <div>Original (Head / Stored)</div>
        <div className="border-l border-neutral-800 pl-3">Current Working Copy</div>
      </div>

      {/* Side by side diff lines */}
      <div className="flex-1 overflow-auto divide-y divide-neutral-850/40">
        {Array.from({ length: maxLines }).map((_, i) => {
          const orig = originalLines[i];
          const curr = currentLines[i];
          const isModified = orig !== curr;
          const isAdded = orig === undefined && curr !== undefined;
          const isDeleted = orig !== undefined && curr === undefined;

          return (
            <div key={i} className="grid grid-cols-2 leading-5 text-[12px]">
              {/* Left: Original */}
              <div
                className={`flex px-2 py-0.5 ${
                  isDeleted
                    ? 'bg-rose-950/40 text-rose-300'
                    : isModified
                    ? 'bg-amber-950/30 text-amber-200'
                    : 'text-neutral-400'
                }`}
              >
                <span className="w-8 text-neutral-600 text-right pr-2 select-none">{orig !== undefined ? i + 1 : ''}</span>
                <span className="whitespace-pre overflow-hidden text-ellipsis">{orig ?? ''}</span>
              </div>

              {/* Right: Current */}
              <div
                className={`flex px-2 py-0.5 border-l border-neutral-800 ${
                  isAdded
                    ? 'bg-emerald-950/40 text-emerald-300'
                    : isModified
                    ? 'bg-cyan-950/30 text-cyan-200'
                    : 'text-neutral-300'
                }`}
              >
                <span className="w-8 text-neutral-600 text-right pr-2 select-none">{curr !== undefined ? i + 1 : ''}</span>
                <span className="whitespace-pre overflow-hidden text-ellipsis">{curr ?? ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
