import React, { useState } from 'react';
import {
  GitBranch,
  GitCommit,
  Plus,
  Minus,
  Check,
  RotateCcw,
  Clock,
  ChevronDown,
  ChevronRight,
  FileCode,
  Sparkles
} from 'lucide-react';
import { VFSNode, GitCommit as GitCommitType } from '../types/ide';

interface GitPanelProps {
  files: Record<string, VFSNode>;
  onStageFile: (fileId: string) => void;
  onUnstageFile: (fileId: string) => void;
  onStageAll: () => void;
  onCommit: (message: string) => void;
  onRevertFile: (fileId: string) => void;
  onSelectDiff: (file: VFSNode) => void;
  commits: GitCommitType[];
  currentBranch: string;
  onChangeBranch: (branch: string) => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({
  files,
  onStageFile,
  onUnstageFile,
  onStageAll,
  onCommit,
  onRevertFile,
  onSelectDiff,
  commits,
  currentBranch,
  onChangeBranch,
}) => {
  const [commitMessage, setCommitMessage] = useState('');
  const [showBranches, setShowBranches] = useState(false);
  const [newBranchInput, setNewBranchInput] = useState('');
  const [isCreatingBranch, setIsCreatingBranch] = useState(false);

  const fileList = Object.values(files).filter((f) => f.type === 'file');
  const stagedFiles = fileList.filter((f) => f.gitStatus === 'staged');
  const unstagedFiles = fileList.filter((f) => f.gitStatus === 'modified' || f.gitStatus === 'untracked');

  const handleCommitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commitMessage.trim()) return;
    onCommit(commitMessage.trim());
    setCommitMessage('');
  };

  const handleQuickCommitMsg = () => {
    const suggestions = [
      'feat: update component reactivity and styling',
      'fix: resolve syntax issue and optimize state',
      'refactor: streamline data pipeline and execution',
      'docs: update project README and instructions',
    ];
    setCommitMessage(suggestions[Math.floor(Math.random() * suggestions.length)]);
  };

  return (
    <div className="h-full flex flex-col bg-neutral-900 text-neutral-300 select-none">
      {/* Header with branch selector */}
      <div className="px-3 py-2 border-b border-neutral-800 flex items-center justify-between">
        <div className="text-[11px] font-semibold tracking-wider text-neutral-400 uppercase">
          Source Control
        </div>
        <div className="relative">
          <button
            onClick={() => setShowBranches(!showBranches)}
            className="flex items-center gap-1 text-xs text-neutral-200 bg-neutral-800 hover:bg-neutral-750 px-2 py-1 rounded border border-neutral-700"
          >
            <GitBranch size={13} className="text-cyan-400" />
            <span className="font-mono">{currentBranch}</span>
            <ChevronDown size={11} className="text-neutral-500" />
          </button>

          {showBranches && (
            <div className="absolute right-0 top-full mt-1 w-48 bg-neutral-800 border border-neutral-700 rounded shadow-xl py-1 z-30 text-xs">
              <div className="px-3 py-1 text-[10px] text-neutral-400 uppercase font-bold">Switch Branch</div>
              {['main', 'dev', 'feat/interactive-ide'].map((b) => (
                <button
                  key={b}
                  onClick={() => {
                    onChangeBranch(b);
                    setShowBranches(false);
                  }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center justify-between font-mono"
                >
                  <span>{b}</span>
                  {currentBranch === b && <Check size={13} className="text-cyan-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Commit Input Area */}
      <form onSubmit={handleCommitSubmit} className="p-3 border-b border-neutral-800 space-y-2">
        <div className="relative">
          <textarea
            value={commitMessage}
            onChange={(e) => setCommitMessage(e.target.value)}
            placeholder="Message (Ctrl+Enter to commit)"
            className="w-full h-16 bg-neutral-950 border border-neutral-750 rounded p-2 text-xs text-white placeholder-neutral-500 outline-none resize-none focus:border-cyan-500"
            onKeyDown={(e) => {
              if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                handleCommitSubmit(e);
              }
            }}
          />
          <button
            type="button"
            onClick={handleQuickCommitMsg}
            className="absolute right-2 bottom-2 text-neutral-400 hover:text-cyan-400 p-1"
            title="Generate commit message"
          >
            <Sparkles size={13} />
          </button>
        </div>

        <button
          type="submit"
          disabled={!commitMessage.trim() || (stagedFiles.length === 0 && unstagedFiles.length === 0)}
          className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white rounded text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Check size={14} /> Commit Changes
        </button>
      </form>

      {/* Changes & Staged Changes Lists */}
      <div className="flex-1 overflow-y-auto divide-y divide-neutral-800">
        {/* Staged Changes */}
        {stagedFiles.length > 0 && (
          <div className="py-2">
            <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400">
              <span>STAGED CHANGES ({stagedFiles.length})</span>
            </div>
            {stagedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onSelectDiff(file)}
                className="flex items-center justify-between px-3 py-1 hover:bg-neutral-850 cursor-pointer text-xs group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode size={13} className="text-emerald-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">S</span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUnstageFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                    title="Unstage"
                  >
                    <Minus size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Unstaged Changes */}
        <div className="py-2">
          <div className="px-3 py-1 flex items-center justify-between text-[11px] font-semibold text-neutral-400">
            <span>CHANGES ({unstagedFiles.length})</span>
            {unstagedFiles.length > 0 && (
              <button
                onClick={onStageAll}
                className="hover:text-white p-0.5 rounded"
                title="Stage All Changes"
              >
                <Plus size={13} />
              </button>
            )}
          </div>
          {unstagedFiles.length === 0 ? (
            <div className="px-3 py-3 text-xs text-neutral-500 italic">No uncommitted changes</div>
          ) : (
            unstagedFiles.map((file) => (
              <div
                key={file.id}
                onClick={() => onSelectDiff(file)}
                className="flex items-center justify-between px-3 py-1 hover:bg-neutral-850 cursor-pointer text-xs group"
              >
                <div className="flex items-center gap-1.5 min-w-0">
                  <FileCode size={13} className="text-amber-400 shrink-0" />
                  <span className="truncate">{file.name}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono text-amber-400 font-bold">
                    {file.gitStatus === 'untracked' ? 'U' : 'M'}
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onStageFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-white"
                    title="Stage changes"
                  >
                    <Plus size={12} />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onRevertFile(file.id);
                    }}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-neutral-700 rounded text-neutral-400 hover:text-rose-400"
                    title="Discard changes"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Commit Log History */}
        <div className="py-2">
          <div className="px-3 py-1 text-[11px] font-semibold text-neutral-400 flex items-center gap-1">
            <Clock size={12} />
            <span>COMMIT HISTORY</span>
          </div>
          <div className="space-y-1.5 px-3 py-1">
            {commits.map((c) => (
              <div
                key={c.id}
                className="p-2 bg-neutral-950 border border-neutral-800 rounded text-xs hover:border-neutral-700 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-cyan-400 text-[11px] font-semibold">{c.hash}</span>
                  <span className="text-[10px] text-neutral-500">
                    {new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="text-neutral-200 mt-1 font-medium leading-snug">{c.message}</div>
                <div className="text-[10px] text-neutral-500 mt-1 flex items-center justify-between">
                  <span>{c.author}</span>
                  <span>{c.filesChanged} file{c.filesChanged === 1 ? '' : 's'}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
