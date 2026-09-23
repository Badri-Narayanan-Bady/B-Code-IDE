import React, { useState, useEffect, useRef } from 'react';
import { Search, FileCode, Play, Eye, Download, Terminal, Trash2, Settings, Share2, Sparkles } from 'lucide-react';
import { VFSNode } from '../types/ide';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  files: Record<string, VFSNode>;
  onSelectFile: (fileId: string) => void;
  onRun: () => void;
  onTogglePreview: () => void;
  onExportZip: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onClearTerminal: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenWorkspaces?: () => void;
  onOpenGuide?: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  files,
  onSelectFile,
  onRun,
  onTogglePreview,
  onExportZip,
  onOpenSettings,
  onOpenShare,
  onClearTerminal,
  onOpenVercelDeploy,
  onOpenWorkspaces,
  onOpenGuide,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isCommandMode = query.startsWith('>');
  const cleanQuery = isCommandMode ? query.substring(1).trim().toLowerCase() : query.toLowerCase();

  // File list items
  const fileItems = Object.values(files)
    .filter((f) => f.type === 'file' && (!cleanQuery || f.name.toLowerCase().includes(cleanQuery)))
    .map((f) => ({
      id: `file-${f.id}`,
      type: 'file' as const,
      label: f.name,
      description: f.path,
      icon: <FileCode size={14} className="text-cyan-400" />,
      action: () => {
        onSelectFile(f.id);
        onClose();
      },
    }));

  // IDE Command items
  const commandItems = [
    {
      id: 'cmd-run',
      type: 'command' as const,
      label: 'Run: Execute Project / Script',
      description: 'Run with in-browser runner or preview',
      icon: <Play size={14} className="text-emerald-400" />,
      action: () => {
        onRun();
        onClose();
      },
    },
    {
      id: 'cmd-preview',
      type: 'command' as const,
      label: 'View: Toggle Live Web Preview',
      description: 'Open or close interactive iframe preview',
      icon: <Eye size={14} className="text-cyan-400" />,
      action: () => {
        onTogglePreview();
        onClose();
      },
    },
    {
      id: 'cmd-vercel',
      type: 'command' as const,
      label: 'Deploy: Deploy Project to Vercel',
      description: 'Generate production bundle with vercel.json configuration',
      icon: (
        <svg width="14" height="14" viewBox="0 0 1155 1000" fill="currentColor" className="text-white">
          <path d="m577.3 0 577.4 1000H0z" />
        </svg>
      ),
      action: () => {
        onOpenVercelDeploy?.();
        onClose();
      },
    },
    {
      id: 'cmd-workspaces',
      type: 'command' as const,
      label: 'Workspace: Manage Projects & Isolation Sandboxes',
      description: 'Create, clone, switch, or inspect isolated workspaces',
      icon: <FileCode size={14} className="text-cyan-400" />,
      action: () => {
        onOpenWorkspaces?.();
        onClose();
      },
    },
    {
      id: 'cmd-guide',
      type: 'command' as const,
      label: 'Help: Welcome & Quick Start Guide',
      description: 'Interactive overview of editor, runner, and deployment',
      icon: <Sparkles size={14} className="text-amber-400" />,
      action: () => {
        onOpenGuide?.();
        onClose();
      },
    },
    {
      id: 'cmd-export',
      type: 'command' as const,
      label: 'File: Export Project as ZIP',
      description: 'Download workspace files as zip archive',
      icon: <Download size={14} className="text-amber-400" />,
      action: () => {
        onExportZip();
        onClose();
      },
    },
    {
      id: 'cmd-share',
      type: 'command' as const,
      label: 'Collaborate: Share Workspace Live Link',
      description: 'Invite peers for real-time collaboration',
      icon: <Share2 size={14} className="text-indigo-400" />,
      action: () => {
        onOpenShare();
        onClose();
      },
    },
    {
      id: 'cmd-settings',
      type: 'command' as const,
      label: 'Preferences: Open IDE Settings',
      description: 'Configure editor themes, fonts, and keys',
      icon: <Settings size={14} className="text-neutral-400" />,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: 'cmd-clear',
      type: 'command' as const,
      label: 'Terminal: Clear Console Output',
      description: 'Clear terminal and execution logs',
      icon: <Trash2 size={14} className="text-rose-400" />,
      action: () => {
        onClearTerminal();
        onClose();
      },
    },
  ].filter((c) => !cleanQuery || c.label.toLowerCase().includes(cleanQuery));

  const items = isCommandMode ? commandItems : [...fileItems, ...commandItems];

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (items.length > 0 ? (prev - 1 + items.length) % items.length : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 bg-black/60 backdrop-blur-xs select-none"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-xl bg-neutral-900 border border-neutral-750 rounded-xl shadow-2xl overflow-hidden text-neutral-200"
      >
        {/* Input bar */}
        <div className="flex items-center px-4 py-3 border-b border-neutral-800 bg-neutral-950">
          <Search size={16} className="text-neutral-500 mr-3 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a file name or prefix with > for commands..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none font-sans"
          />
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto py-1 text-xs">
          {items.length === 0 ? (
            <div className="p-4 text-center text-neutral-500">No matching files or commands</div>
          ) : (
            items.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <div
                  key={item.id}
                  onClick={item.action}
                  className={`px-4 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                    isSelected ? 'bg-cyan-600 text-white font-medium' : 'hover:bg-neutral-800 text-neutral-300'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {item.icon}
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.description && (
                    <span className="text-[11px] opacity-60 truncate ml-3 font-mono">
                      {item.description}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer tip */}
        <div className="px-4 py-2 bg-neutral-950/80 border-t border-neutral-850 text-[11px] text-neutral-500 flex items-center justify-between">
          <span>Navigate with ↑ ↓ · Enter to execute</span>
          <span>Esc to dismiss</span>
        </div>
      </div>
    </div>
  );
};
