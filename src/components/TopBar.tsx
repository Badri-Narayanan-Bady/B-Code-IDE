import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Share2,
  Download,
  Settings,
  Eye,
  FolderPlus,
  FilePlus,
  RefreshCw,
  Sparkles,
  ChevronDown,
  Terminal as TerminalIcon,
  Check,
  Code2,
  FolderKanban,
  HelpCircle,
  Keyboard,
  ShieldCheck,
  Gauge,
  Binary,
  AlignLeft,
  Network
} from 'lucide-react';
import { TEMPLATES } from '../services/storage';

interface TopBarProps {
  onRun: () => void;
  onTogglePreview: () => void;
  showPreview: boolean;
  onExportZip: () => void;
  onOpenSettings: () => void;
  onOpenShare: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSwitchTemplate: (key: string) => void;
  activeTemplate: string;
  isRunning: boolean;
  peerCount: number;
  workspaceName?: string;
  isPrivateWorkspace?: boolean;
  roomId?: string;
  onOpenWorkspaces?: () => void;
  onOpenVercelDeploy?: () => void;
  onOpenGuide?: () => void;
  onOpenShortcuts?: () => void;
  onFormatDocument?: () => void;
  onOpenRegexTester?: () => void;
  onOpenAstModal?: () => void;
  onOpenTestRunner?: () => void;
  onOpenProfiler?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onRun,
  onTogglePreview,
  showPreview,
  onExportZip,
  onOpenSettings,
  onOpenShare,
  onNewFile,
  onNewFolder,
  onSwitchTemplate,
  activeTemplate,
  isRunning,
  peerCount,
  workspaceName = 'Personal Project',
  isPrivateWorkspace = true,
  roomId,
  onOpenWorkspaces,
  onOpenVercelDeploy,
  onOpenGuide,
  onOpenShortcuts,
  onFormatDocument,
  onOpenRegexTester,
  onOpenAstModal,
  onOpenTestRunner,
  onOpenProfiler,
}) => {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="h-12 bg-neutral-900 border-b border-neutral-800 px-3 sm:px-4 flex items-center justify-between select-none z-30 shrink-0">
      {/* Zone 1: Wordmark & Workspace switcher */}
      <div className="flex items-center gap-3">
        <a href="/" className="flex items-center gap-2 text-white font-semibold text-sm tracking-tight hover:opacity-90 transition-opacity shrink-0">
          <div className="w-7 h-7 rounded-md bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center shadow-sm text-white">
            <Code2 size={16} />
          </div>
          <span className="hidden sm:inline font-bold">B Code</span>
        </a>

        {/* Workspace Pill */}
        {onOpenWorkspaces && (
          <button
            onClick={onOpenWorkspaces}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-800/90 hover:bg-neutral-750 border border-neutral-700/80 text-xs text-neutral-200 transition-colors cursor-pointer max-w-[200px] truncate"
            title="Click to manage or switch workspaces"
          >
            <FolderKanban size={13} className={isPrivateWorkspace ? 'text-cyan-400 shrink-0' : 'text-indigo-400 shrink-0'} />
            <span className="truncate font-medium">{workspaceName}</span>
            {roomId && (
              <span className="text-[10px] font-mono bg-indigo-500/20 text-indigo-300 px-1 rounded shrink-0">
                #{roomId}
              </span>
            )}
            <ChevronDown size={11} className="opacity-50 shrink-0" />
          </button>
        )}

        {/* Zone 2: Menus & Navigation */}
        <div ref={menuRef} className="hidden lg:flex items-center gap-1 text-xs text-neutral-300">
          {/* File Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'file' ? null : 'file')}
              className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1 ${
                openMenu === 'file' ? 'bg-neutral-800 text-white' : ''
              }`}
            >
              File <ChevronDown size={12} className="opacity-60" />
            </button>
            {openMenu === 'file' && (
              <div className="absolute top-full left-0 mt-1 w-52 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                <button
                  onClick={() => { onNewFile(); setOpenMenu(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                >
                  <FilePlus size={14} /> New File
                </button>
                <button
                  onClick={() => { onNewFolder(); setOpenMenu(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                >
                  <FolderPlus size={14} /> New Folder
                </button>
                <div className="h-px bg-neutral-700 my-1" />
                <button
                  onClick={() => { onExportZip(); setOpenMenu(null); }}
                  className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                >
                  <Download size={14} /> Download ZIP
                </button>
                {onOpenVercelDeploy && (
                  <button
                    onClick={() => { onOpenVercelDeploy(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                  >
                    {/* Vercel icon */}
                    <svg width="13" height="13" viewBox="0 0 1155 1000" fill="currentColor">
                      <path d="m577.3 0 577.4 1000H0z" />
                    </svg>
                    Deploy to Vercel
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Templates Menu */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'templates' ? null : 'templates')}
              className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1 ${
                openMenu === 'templates' ? 'bg-neutral-800 text-white' : ''
              }`}
            >
              Templates <ChevronDown size={12} className="opacity-60" />
            </button>
            {openMenu === 'templates' && (
              <div className="absolute top-full left-0 mt-1 w-64 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-medium text-neutral-400">Starter Sandboxes</div>
                {Object.entries(TEMPLATES).map(([key, t]) => (
                  <button
                    key={key}
                    onClick={() => { onSwitchTemplate(key); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center justify-between text-neutral-200"
                  >
                    <div>
                      <div className="font-medium text-white">{t.name}</div>
                      <div className="text-[10px] text-neutral-400 truncate">{t.description}</div>
                    </div>
                    {activeTemplate === key && <Check size={14} className="text-cyan-400 shrink-0 ml-2" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Tools Menu (MAANG Engineering Suite) */}
          <div className="relative">
            <button
              onClick={() => setOpenMenu(openMenu === 'tools' ? null : 'tools')}
              className={`px-2.5 py-1 rounded hover:bg-neutral-800 hover:text-white transition-colors flex items-center gap-1 ${
                openMenu === 'tools' ? 'bg-neutral-800 text-white' : ''
              }`}
            >
              Tools <ChevronDown size={12} className="opacity-60" />
            </button>
            {openMenu === 'tools' && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-neutral-800 border border-neutral-700 rounded-lg shadow-xl py-1 z-50 text-xs">
                <div className="px-3 py-1 text-[11px] font-medium text-neutral-400">Developer Utilities</div>
                {onFormatDocument && (
                  <button
                    onClick={() => { onFormatDocument(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center justify-between text-neutral-200"
                  >
                    <span className="flex items-center gap-2">
                      <AlignLeft size={14} className="text-cyan-400" /> Format Document
                    </span>
                    <span className="text-[10px] text-neutral-400 font-mono">Alt+Shift+F</span>
                  </button>
                )}
                {onOpenTestRunner && (
                  <button
                    onClick={() => { onOpenTestRunner(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                  >
                    <ShieldCheck size={14} className="text-emerald-400" /> Test Suite Runner
                  </button>
                )}
                {onOpenProfiler && (
                  <button
                    onClick={() => { onOpenProfiler(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                  >
                    <Gauge size={14} className="text-amber-400" /> Performance Profiler
                  </button>
                )}
                {onOpenRegexTester && (
                  <button
                    onClick={() => { onOpenRegexTester(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                  >
                    <Binary size={14} className="text-sky-400" /> Regex Pattern Tester
                  </button>
                )}
                {onOpenAstModal && (
                  <button
                    onClick={() => { onOpenAstModal(); setOpenMenu(null); }}
                    className="w-full text-left px-3 py-1.5 hover:bg-neutral-700 flex items-center gap-2 text-neutral-200"
                  >
                    <Network size={14} className="text-indigo-400" /> Inspect AST Syntax Tree
                  </button>
                )}
              </div>
            )}
          </div>

          <button
            onClick={onTogglePreview}
            className={`px-2.5 py-1 rounded hover:bg-neutral-800 transition-colors flex items-center gap-1.5 ${
              showPreview ? 'text-cyan-400 bg-neutral-800/80 font-medium' : 'text-neutral-300'
            }`}
          >
            <Eye size={13} /> {showPreview ? 'Hide Preview' : 'Live Preview'}
          </button>
        </div>
      </div>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Run Button */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
          title="Run project or current script (F5)"
        >
          <Play size={13} className={isRunning ? 'animate-spin' : 'fill-white'} />
          <span>{isRunning ? 'Running...' : 'Run'}</span>
        </button>

        {/* Deploy to Vercel Button */}
        {onOpenVercelDeploy && (
          <button
            onClick={onOpenVercelDeploy}
            className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 border border-neutral-700 text-white rounded-md text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm"
            title="Deploy project to Vercel"
          >
            <svg width="12" height="12" viewBox="0 0 1155 1000" fill="currentColor">
              <path d="m577.3 0 577.4 1000H0z" />
            </svg>
            <span className="hidden sm:inline">Deploy</span>
          </button>
        )}

        {/* Collaborate / Share Button */}
        <button
          onClick={onOpenShare}
          className="px-2.5 py-1.5 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-200 rounded-md text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer relative"
          title="Share workspace and collaborate"
        >
          <Share2 size={13} className="text-cyan-400" />
          <span className="hidden md:inline">Collab</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
          <span className="text-[10px] text-neutral-400 font-mono">({peerCount})</span>
        </button>

        {/* Quick Guide Tour */}
        {onOpenGuide && (
          <button
            onClick={onOpenGuide}
            className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            title="Quick Guide & Features"
          >
            <Sparkles size={15} className="text-amber-400" />
          </button>
        )}

        {/* Keyboard Shortcuts */}
        {onOpenShortcuts && (
          <button
            onClick={onOpenShortcuts}
            className="hidden sm:flex p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
            title="Keyboard Shortcuts (?)"
          >
            <Keyboard size={15} />
          </button>
        )}

        {/* Settings Button */}
        <button
          onClick={onOpenSettings}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title="IDE Settings"
        >
          <Settings size={15} />
        </button>
      </div>
    </header>
  );
};
