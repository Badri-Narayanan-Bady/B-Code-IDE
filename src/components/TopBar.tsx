import React, { useRef } from 'react';
import {
  Play,
  Upload,
  Download,
  FileCode,
  Sparkles,
  Settings,
  Keyboard,
  RefreshCw,
  RotateCcw,
  FilePlus,
  Activity,
} from 'lucide-react';
import { SupportedLanguage, CodeFile, CodeAnalysisResult } from '../types/ide';
import { LANGUAGES } from '../utils/languages';

interface TopBarProps {
  file: CodeFile;
  onUpdateFileName: (name: string) => void;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  onUploadFile: (file: File) => void;
  onDownloadFile: () => void;
  onFormatCode: () => void;
  onResetCode: () => void;
  onNewTemplate: (lang: SupportedLanguage) => void;
  onRun: () => void;
  isRunning: boolean;
  onOpenSettings: () => void;
  onOpenShortcuts: () => void;
  onToggleTerminal?: () => void;
  analysis?: CodeAnalysisResult;
  onOpenAnalyzer?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  file,
  onUpdateFileName,
  onSelectLanguage,
  onUploadFile,
  onDownloadFile,
  onFormatCode,
  onResetCode,
  onNewTemplate,
  onRun,
  isRunning,
  onOpenSettings,
  onOpenShortcuts,
  analysis,
  onOpenAnalyzer,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentLangMeta = LANGUAGES[file.language] || LANGUAGES.python;

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      onUploadFile(selected);
    }
    e.target.value = '';
  };

  return (
    <header className="h-12 bg-neutral-950 border-b border-neutral-850 flex items-center justify-between px-3 md:px-4 shrink-0 select-none z-30">
      {/* Hidden file input for uploading */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        className="hidden"
        accept=".py,.js,.java,.cpp,.cc,.cxx,.c,.h,.sql,.txt"
      />

      {/* Left: Brand & File Config */}
      <div className="flex items-center gap-2.5">
        {/* Minimalist Logo */}
        <div className="flex items-center gap-2 pr-2.5 border-r border-neutral-800">
          <div className="w-7 h-7 rounded-md bg-neutral-900 border border-neutral-750 flex items-center justify-center text-cyan-400 font-bold font-mono shadow-sm">
            B
          </div>
          <span className="text-sm font-semibold text-neutral-100 tracking-tight hidden sm:inline">
            B Code
          </span>
        </div>

        {/* Language Selector */}
        <select
          value={file.language}
          onChange={(e) => onSelectLanguage(e.target.value as SupportedLanguage)}
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-200 text-xs rounded-md px-2.5 py-1 font-medium outline-none focus:border-cyan-500 cursor-pointer transition-colors"
          title="Select Language Environment"
        >
          <option value="python">Python 3.12</option>
          <option value="javascript">JavaScript (Node)</option>
          <option value="java">Java 21</option>
          <option value="cpp">C++20</option>
          <option value="c">C17</option>
          <option value="sql">MySQL SQL</option>
        </select>

        {/* Active File Name */}
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-neutral-900/90 border border-neutral-800 hover:border-neutral-700 transition-colors">
          <FileCode size={13} style={{ color: currentLangMeta.color }} />
          <input
            type="text"
            value={file.name}
            onChange={(e) => onUpdateFileName(e.target.value)}
            className="bg-transparent text-xs font-mono font-medium text-neutral-300 focus:text-white outline-none w-24 sm:w-32 transition-all"
            title="Click to rename file"
          />
          {file.isDirty && (
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" title="Modified" />
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Run Button (Primary) */}
        <button
          onClick={onRun}
          disabled={isRunning}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-semibold text-xs shadow-sm transition-all active:scale-95 ${
            isRunning
              ? 'bg-neutral-800 text-neutral-500 cursor-not-allowed border border-neutral-700'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-950/50'
          }`}
          title="Execute code (F5)"
        >
          {isRunning ? (
            <>
              <RefreshCw size={13} className="animate-spin text-emerald-300" />
              <span>Running...</span>
            </>
          ) : (
            <>
              <Play size={13} className="fill-white" />
              <span>Run</span>
              <kbd className="hidden md:inline px-1 py-0.2 bg-emerald-700/60 rounded text-[9px] font-mono text-emerald-100">
                F5
              </kbd>
            </>
          )}
        </button>

        {/* Static Analyzer Quick Metric Badge */}
        {onOpenAnalyzer && analysis && (
          <button
            onClick={onOpenAnalyzer}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-xs font-medium text-neutral-300 hover:text-white transition-all"
            title="View Cyclomatic Complexity & Performance Analysis"
          >
            <Activity size={13} className="text-cyan-400" />
            <span className="font-mono text-[11px]">
              M:{analysis.totalCyclomaticComplexity}
            </span>
            <span className="text-[10px] text-neutral-400">
              {analysis.executionEstimate.asymptoticNotation}
            </span>
          </button>
        )}

        {/* Templates Dropdown */}
        <div className="relative group">
          <button
            className="flex items-center gap-1 px-2.5 py-1 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-neutral-800 text-xs font-medium transition-all"
            title="Boilerplate Templates"
          >
            <FilePlus size={13} className="text-indigo-400" />
            <span className="hidden sm:inline">Templates</span>
          </button>
          <div className="absolute right-0 top-full mt-1 w-44 bg-neutral-900 border border-neutral-750 rounded-md shadow-xl py-1 hidden group-hover:block z-50 text-xs">
            <button
              onClick={onResetCode}
              className="w-full text-left px-3 py-1.5 hover:bg-neutral-800 text-cyan-300 hover:text-cyan-200 flex items-center justify-between border-b border-neutral-800"
            >
              <span className="font-medium flex items-center gap-1.5">
                <RotateCcw size={11} />
                Fresh Blank File
              </span>
            </button>
            <div className="px-3 py-1 text-[9px] font-semibold text-neutral-500 uppercase tracking-wider">
              Samples
            </div>
            <button
              onClick={() => onNewTemplate('python')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>Python 3</span>
              <span className="text-[10px] font-mono text-sky-400">.py</span>
            </button>
            <button
              onClick={() => onNewTemplate('javascript')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>JavaScript</span>
              <span className="text-[10px] font-mono text-yellow-400">.js</span>
            </button>
            <button
              onClick={() => onNewTemplate('java')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>Java 21</span>
              <span className="text-[10px] font-mono text-orange-400">.java</span>
            </button>
            <button
              onClick={() => onNewTemplate('cpp')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>C++20</span>
              <span className="text-[10px] font-mono text-purple-400">.cpp</span>
            </button>
            <button
              onClick={() => onNewTemplate('c')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>C17</span>
              <span className="text-[10px] font-mono text-cyan-400">.c</span>
            </button>
            <button
              onClick={() => onNewTemplate('sql')}
              className="w-full text-left px-3 py-1 hover:bg-neutral-800 text-neutral-200 flex items-center justify-between"
            >
              <span>MySQL SQL</span>
              <span className="text-[10px] font-mono text-emerald-400">.sql</span>
            </button>
          </div>
        </div>

        {/* Upload Button */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
          title="Upload Code File"
        >
          <Upload size={13} className="text-cyan-400" />
        </button>

        {/* Download Button */}
        <button
          onClick={onDownloadFile}
          className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
          title="Download File"
        >
          <Download size={13} className="text-emerald-400" />
        </button>

        {/* Format Document Button */}
        <button
          onClick={onFormatCode}
          className="p-1.5 rounded-md bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-all"
          title="Format Code (Alt + Shift + F)"
        >
          <Sparkles size={13} className="text-amber-400" />
        </button>

        {/* Shortcuts & Settings */}
        <div className="flex items-center pl-1 border-l border-neutral-800 gap-1">
          <button
            onClick={onOpenShortcuts}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Keyboard Shortcuts"
          >
            <Keyboard size={14} />
          </button>
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Editor Settings"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </header>
  );
};
